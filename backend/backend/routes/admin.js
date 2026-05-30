const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Request = require('../models/Request');
const { Conversation } = require('../models/Message');
const PersonnelRecord = require('../models/PersonnelRecord');
const CustomClearance = require('../models/CustomClearance');
const Faction = require('../models/Faction');

router.use(auth);
router.use(requireRole('admin', 'superadmin'));

// GET /api/admin/requests
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
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/requests/:id/approve
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    const { note, employeeId, overrideClearance, overrideExtensions, overrideFraction, overridePosition, overrideRole } = req.body;

    if (request.type === 'registration') {
      const data = request.registrationData;
      let finalId = employeeId;
      if (!finalId) {
        const count = await User.countDocuments();
        finalId = `SCP-${String(count + 1).padStart(4, '0')}`;
      }

      // Use override values if admin changed them, else use registration data
      const finalCL = overrideClearance !== undefined ? parseInt(overrideClearance) : data.clearanceLevel;
      const finalFraction = overrideFraction || data.fraction;
      const finalPosition = overridePosition || data.position;
      const finalRole = overrideRole || 'user';
      const finalExtensions = overrideExtensions || [];

      const user = new User({
        username: data.username,
        password: data.password,
        discordNick: data.discordNick,
        fio: data.fio,
        callsign: data.callsign,
        fraction: finalFraction,
        fractionType: data.fractionType,
        position: finalPosition,
        clearanceLevel: finalCL,
        clearanceExtensions: finalExtensions,
        suggestion: data.suggestion,
        employeeId: finalId,
        status: 'approved',
        role: finalRole,
        personnelStatus: 'active'
      });
      await user.save();

      // Auto-update faction member count
      if (finalFraction) {
        await Faction.findOneAndUpdate(
          { name: finalFraction },
          { $inc: { membersCount: 1 } }
        );
      }

      // Auto-create PersonnelRecord
      await PersonnelRecord.create({
        userId: user._id,
        fio: data.fio,
        callsign: data.callsign,
        position: finalPosition,
        fraction: finalFraction,
        fractionType: data.fractionType,
        clearanceLevel: finalCL,
        clearanceExtensions: finalExtensions,
        employeeId: finalId,
        discordNick: data.discordNick,
        personnelStatus: 'active',
        createdBy: req.user._id
      });
    }

    if (request.type === 'clearance_upgrade') {
      const user = await User.findById(request.requester);
      if (user) {
        const finalCL = overrideClearance !== undefined ? parseInt(overrideClearance) : request.requestedLevel;
        if (finalCL !== undefined) user.clearanceLevel = finalCL;
        if (overrideExtensions?.length) {
          user.clearanceExtensions = [...new Set([...user.clearanceExtensions, ...overrideExtensions])];
        } else if (request.requestedExtensions?.length) {
          user.clearanceExtensions = [...new Set([...user.clearanceExtensions, ...request.requestedExtensions])];
        }
        await user.save();
        // Sync PersonnelRecord
        await PersonnelRecord.findOneAndUpdate({ userId: user._id }, { clearanceLevel: user.clearanceLevel, clearanceExtensions: user.clearanceExtensions });
      }
    }

    if (request.type === 'twin_account') {
      const parentUser = await User.findById(request.requester);
      let twinId = employeeId;
      if (!twinId) {
        const count = await User.countDocuments();
        twinId = `SCP-T${String(count + 1).padStart(4, '0')}`;
      }
      const twin = new User({
        username: request.twinUsername,
        password: request.twinPassword,
        discordNick: request.twinDiscordNick,
        fio: request.twinFio,
        callsign: request.twinCallsign,
        fraction: parentUser?.fraction || request.twinFraction,
        fractionType: parentUser?.fractionType || 'civilian',
        position: request.twinPosition,
        clearanceLevel: overrideClearance !== undefined ? parseInt(overrideClearance) : (parentUser?.clearanceLevel || 0),
        employeeId: twinId,
        status: 'approved',
        role: 'user',
        isTwin: true,
        parentAccount: request.requester,
        personnelStatus: 'active'
      });
      await twin.save();
    }

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewNote = note || '';
    request.reviewedAt = new Date();
    await request.save();

    const io = req.app.get('io');
    if (request.requester) {
      io.to(`user:${request.requester}`).emit('request_reviewed', { requestId: request._id, status: 'approved', type: request.type });
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
      io.to(`user:${request.requester}`).emit('request_reviewed', { requestId: request._id, status: 'rejected', type: request.type, note });
    }
    res.json({ message: 'Request rejected' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { isTwin, search } = req.query;
    const filter = { status: { $ne: 'pending' } };
    if (isTwin === 'true') filter.isTwin = true;
    else if (isTwin === 'false') filter.isTwin = { $ne: true };
    if (search) filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { fio: { $regex: search, $options: 'i' } },
      { callsign: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(filter).select('-password').populate('parentAccount', 'username fio employeeId').sort('-createdAt');
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// PATCH /api/admin/users/:id - full edit (superadmin)
router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['clearanceLevel', 'clearanceExtensions', 'status', 'employeeId',
      'fraction', 'fractionType', 'position', 'callsign', 'fio', 'discordNick',
      'biography', 'photo', 'personnelStatus', 'serviceIds'];
    if (req.user.role === 'superadmin') allowed.push('role');
    
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sync PersonnelRecord if exists
    const syncFields = {};
    ['fio','callsign','position','fraction','fractionType','clearanceLevel','clearanceExtensions','employeeId','discordNick','personnelStatus'].forEach(f => {
      if (updates[f] !== undefined) syncFields[f] = updates[f];
    });
    if (Object.keys(syncFields).length > 0) {
      await PersonnelRecord.findOneAndUpdate({ userId: user._id }, { $set: syncFields });
    }

    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/comms/block-all
router.post('/comms/block-all', requireRole('superadmin'), async (req, res) => {
  try {
    const { blocked } = req.body;
    global.commsBlocked = blocked;
    const io = req.app.get('io');
    io.emit('comms_status', { blocked });
    res.json({ message: blocked ? 'All comms blocked' : 'Comms unblocked', blocked });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/comms/status
router.get('/comms/status', async (req, res) => {
  res.json({ blocked: global.commsBlocked || false });
});

// POST /api/admin/issue-service-id
router.post('/issue-service-id', async (req, res) => {
  try {
    const { userId, service, idNumber } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.serviceIds.push({ service, idNumber, issuedBy: req.user._id });
    await user.save();
    // Sync to personnel record
    await PersonnelRecord.findOneAndUpdate({ userId }, { $push: { serviceIds: { service, idNumber } } });
    res.json({ message: 'Service ID issued', user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== CUSTOM CLEARANCE =====
// GET /api/admin/custom-clearances
router.get('/custom-clearances', async (req, res) => {
  try {
    const list = await CustomClearance.find().populate('createdBy', 'username callsign').sort('-createdAt');
    res.json(list);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/custom-clearances
router.post('/custom-clearances', requireRole('superadmin'), async (req, res) => {
  try {
    const cc = new CustomClearance({ ...req.body, createdBy: req.user._id });
    await cc.save();
    res.status(201).json(cc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/admin/custom-clearances/:id
router.patch('/custom-clearances/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const cc = await CustomClearance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cc);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/admin/custom-clearances/:id
router.delete('/custom-clearances/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await CustomClearance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/custom-clearances/:id/assign — назначить пользователю + синхронизировать расширения
router.post('/custom-clearances/:id/assign', requireRole('superadmin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const cc = await CustomClearance.findById(req.params.id);
    if (!cc) return res.status(404).json({ message: 'Not found' });
    if (!cc.assignedTo.map(id => id.toString()).includes(userId)) {
      cc.assignedTo.push(userId);
      await cc.save();
    }

    // Sync extensions and base level to user and personnel record
    const user = await User.findById(userId);
    if (user) {
      // Add extensions from CC to user (merge, no duplicates)
      const newExts = [...new Set([...user.clearanceExtensions, ...(cc.extensions || [])])];
      // If CC baseLevel > user current level, upgrade
      const newLevel = Math.max(user.clearanceLevel, cc.baseLevel);
      user.clearanceExtensions = newExts;
      user.clearanceLevel = newLevel;
      await user.save();

      // Sync to personnel record
      await PersonnelRecord.findOneAndUpdate(
        { userId },
        { $set: { clearanceExtensions: newExts, clearanceLevel: newLevel } }
      );
    }

    const populated = await CustomClearance.findById(cc._id).populate('assignedTo', 'username callsign fio clearanceLevel');
    res.json(populated);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/custom-clearances/:id/unassign
router.post('/custom-clearances/:id/unassign', requireRole('superadmin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const cc = await CustomClearance.findById(req.params.id);
    if (!cc) return res.status(404).json({ message: 'Not found' });
    cc.assignedTo = cc.assignedTo.filter(id => id.toString() !== userId);
    await cc.save();

    // Remove extensions that came only from this CC (not from other CCs assigned to user)
    const otherCCs = await CustomClearance.find({
      assignedTo: userId,
      _id: { $ne: cc._id }
    });
    const keepExts = new Set(otherCCs.flatMap(c => c.extensions || []));
    const user = await User.findById(userId);
    if (user) {
      // Keep extensions that are in other CCs OR were there before (we can't know, so keep all not in THIS cc unless only source)
      const removeExts = (cc.extensions || []).filter(e => !keepExts.has(e));
      user.clearanceExtensions = user.clearanceExtensions.filter(e => !removeExts.includes(e));
      await user.save();
      await PersonnelRecord.findOneAndUpdate(
        { userId },
        { $set: { clearanceExtensions: user.clearanceExtensions } }
      );
    }

    res.json(cc);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
