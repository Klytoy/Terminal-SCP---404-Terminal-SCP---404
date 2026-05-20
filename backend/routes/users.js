const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');

router.use(auth);

// GET /api/users - search users
router.get('/', async (req, res) => {
  try {
    const { search, fraction, clearanceLevel } = req.query;
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
    if (clearanceLevel) filter.clearanceLevel = parseInt(clearanceLevel);
    
    const users = await User.find(filter)
      .select('username fio callsign employeeId fraction fractionType position clearanceLevel clearanceExtensions discordNick isTwin serviceIds')
      .sort('fio');
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('parentAccount', 'username fio employeeId');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/callsign - change callsign (nickname)
router.patch('/me/callsign', async (req, res) => {
  try {
    const { callsign } = req.body;
    if (!callsign) return res.status(400).json({ message: 'Callsign required' });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { callsign, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/mute - mute/unmute a conversation
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

module.exports = router;
