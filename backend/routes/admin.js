const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Request = require('../models/Request');
const { Conversation } = require('../models/Message');

// All admin routes require auth + admin or superadmin role
router.use(auth);
router.use(requireRole('admin', 'superadmin'));

// GET /api/admin/requests - list all pending requests
router.get('/requests', async (req, res) => {
  try {
    const { type, status = 'pending' } = req.query;
    const filter = { status };
    if (type) filter.type = type;
    
    const requests = await Request.find(filter)
      .populate('requester', 'username fio callsign employeeId clearanceLevel')
      .populate('documentId', 'title')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/requests/:id/approve
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    const { note, employeeId } = req.body;

    if (request.type === 'registration') {
      const data = request.registrationData;
      
      // Generate employee ID if not provided
      let finalId = employeeId;
      if (!finalId) {
        const count = await User.countDocuments();
        finalId = `SCP-${String(count + 1).padStart(4, '0')}`;
      }
      
      // Create user
      const user = new User({
        username: data.username,
        password: data.password,
        discordNick: data.discordNick,
        fio: data.fio,
        callsign: data.callsign,
        fraction: data.fraction,
        fractionType: data.fractionType,
        position: data.position,
        clearanceLevel: data.clearanceLevel,
        suggestion: data.suggestion,
        employeeId: finalId,
        status: 'approved',
        role: 'user'
      });
      
      await user.save();
    }

    if (request.type === 'clearance_upgrade') {
      const user = await User.findById(request.requester);
      if (user) {
        if (request.requestedLevel !== undefined) user.clearanceLevel = request.requestedLevel;
        if (request.requestedExtensions?.length) {
          user.clearanceExtensions = [...new Set([...user.clearanceExtensions, ...request.requestedExtensions])];
        }
        await user.save();
      }
    }

    if (request.type === 'twin_account') {
      const data = request;
      const parentUser = await User.findById(request.requester);
      
      let twinId = employeeId;
      if (!twinId) {
        const count = await User.countDocuments();
        twinId = `SCP-T${String(count + 1).padStart(4, '0')}`;
      }
      
      const twin = new User({
        username: data.twinUsername,
        password: data.twinPassword,
        discordNick: data.twinDiscordNick,
        fio: data.twinFio,
        callsign: data.twinCallsign,
        fraction: parentUser?.fraction || data.twinFraction,
        fractionType: parentUser?.fractionType || 'civilian',
        position: data.twinPosition,
        clearanceLevel: parentUser?.clearanceLevel || 0,
        employeeId: twinId,
        status: 'approved',
        role: 'user',
        isTwin: true,
        parentAccount: request.requester
      });
      
      await twin.save();
    }

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewNote = note || '';
    request.reviewedAt = new Date();
    await request.save();

    // Notify via socket
    const io = req.app.get('io');
    if (request.requester) {
      io.to(`user:${request.requester}`).emit('request_reviewed', {
        requestId: request._id,
        status: 'approved',
        type: request.type
      });
    }

    res.json({ message: 'Request approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/requests/:id/reject
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const { note } = req.body;
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewNote = note || '';
    request.reviewedAt = new Date();
    await request.save();

    const io = req.app.get('io');
    if (request.requester) {
      io.to(`user:${request.requester}`).emit('request_reviewed', {
        requestId: request._id,
        status: 'rejected',
        type: request.type,
        note
      });
    }

    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { isTwin } = req.query;
    const filter = { status: { $ne: 'pending' } };
    if (isTwin === 'true') filter.isTwin = true;
    else if (isTwin === 'false') filter.isTwin = { $ne: true };
    
    const users = await User.find(filter)
      .select('-password')
      .populate('parentAccount', 'username fio employeeId')
      .sort('-createdAt');
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id - update user (clearance, role, status, employeeId)
router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['clearanceLevel', 'clearanceExtensions', 'role', 'status', 'employeeId', 'fraction', 'position', 'callsign'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    
    // Only superadmin can change roles
    if (updates.role && req.user.role !== 'superadmin') {
      delete updates.role;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/comms/block-all - block all communications (superadmin only)
router.post('/comms/block-all', requireRole('superadmin'), async (req, res) => {
  try {
    const { blocked } = req.body;
    // Use a global settings collection or env
    // For simplicity, store in memory (use Redis/DB in production)
    global.commsBlocked = blocked;
    
    const io = req.app.get('io');
    io.emit('comms_status', { blocked });
    
    res.json({ message: blocked ? 'All comms blocked' : 'Comms unblocked', blocked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/issue-service-id - issue ID for another service
router.post('/issue-service-id', async (req, res) => {
  try {
    const { userId, service, idNumber } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.serviceIds.push({
      service,
      idNumber,
      issuedBy: req.user._id
    });
    
    await user.save();
    res.json({ message: 'Service ID issued', user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/comms/status
router.get('/comms/status', async (req, res) => {
  res.json({ blocked: global.commsBlocked || false });
});

module.exports = router;
