const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');

router.use(auth);

// GET /api/users - search users
router.get('/', async (req, res) => {
  try {
    const { search, fraction, clearanceLevel, personnelStatus } = req.query;
    const filter = { status: 'approved' };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fio: { $regex: search, $options: 'i' } },
        { callsign: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    if (fraction) filter.fraction = fraction;
    if (clearanceLevel !== undefined) filter.clearanceLevel = parseInt(clearanceLevel);
    if (personnelStatus) filter.personnelStatus = personnelStatus;
    
    const users = await User.find(filter)
      .select('-password')
      .populate('parentAccount', 'username fio employeeId')
      .sort('fio');
    
    // Non-admins can't see users with higher clearance level details
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const result = users.map(u => {
      const obj = u.toSafeObject();
      if (!isAdmin && u.clearanceLevel > req.user.clearanceLevel) {
        return {
          _id: u._id,
          callsign: '[ЗАСЕКРЕЧЕНО]',
          fio: '[ЗАСЕКРЕЧЕНО]',
          fraction: u.fraction,
          fractionType: u.fractionType,
          clearanceLevel: u.clearanceLevel,
          position: '[ЗАСЕКРЕЧЕНО]',
          personnelStatus: u.personnelStatus,
          isRedacted: true
        };
      }
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('parentAccount', 'username fio employeeId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isSelf = user._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isSelf && user.clearanceLevel > req.user.clearanceLevel) {
      return res.status(403).json({ message: 'Insufficient clearance' });
    }
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/callsign
router.patch('/me/callsign', async (req, res) => {
  try {
    const { callsign } = req.body;
    if (!callsign) return res.status(400).json({ message: 'Callsign required' });
    const user = await User.findByIdAndUpdate(
      req.user._id, { callsign, updatedAt: new Date() }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/mute
router.patch('/me/mute', async (req, res) => {
  try {
    const { conversationId, muted } = req.body;
    const update = muted
      ? { $addToSet: { mutedConversations: conversationId } }
      : { $pull: { mutedConversations: conversationId } };
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/personnel - superadmin full edit
router.patch('/:id/personnel', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const allowed = [
      'fio', 'callsign', 'fraction', 'fractionType', 'position',
      'clearanceLevel', 'clearanceExtensions', 'personnelStatus',
      'biography', 'photo', 'employeeId', 'discordNick', 'serviceIds'
    ];
    // superadmin can also change role and status
    if (req.user.role === 'superadmin') {
      allowed.push('role', 'status');
    }
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();
    
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
