const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');

router.use(auth);

// POST /api/twins/request - request a twin account
router.post('/request', async (req, res) => {
  try {
    const { twinUsername, twinPassword, twinFio, twinCallsign, twinPosition, twinDiscordNick } = req.body;

    if (!twinUsername || !twinPassword || !twinFio || !twinCallsign || !twinDiscordNick) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Check username not taken (регистронезависимо)
    const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await User.findOne({ username: new RegExp(`^${escapeRegex(twinUsername.trim())}$`, 'i') });
    if (existing) return res.status(400).json({ message: 'Username already taken' });

    const pending = await Request.findOne({
      requester: req.user._id,
      type: 'twin_account',
      status: 'pending'
    });
    if (pending) return res.status(400).json({ message: 'You already have a pending twin request' });

    const request = new Request({
      type: 'twin_account',
      requester: req.user._id,
      twinUsername,
      twinPassword,
      twinFio,
      twinCallsign,
      twinPosition: twinPosition || req.user.position,
      twinDiscordNick,
      twinFraction: req.user.fraction
    });

    await request.save();
    res.status(201).json({ message: 'Twin account request submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/twins/my - get my twin accounts
router.get('/my', async (req, res) => {
  try {
    const twins = await User.find({ parentAccount: req.user._id })
      .select('-password');
    res.json(twins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
