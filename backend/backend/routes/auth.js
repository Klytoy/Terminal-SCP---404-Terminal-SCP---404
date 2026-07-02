const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Request = require('../models/Request');

// Экранирует спецсимволы regex, чтобы искать username буквально
const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Регистронезависимый точный поиск по username (телефоны авто-капитализируют первую букву)
const findByUsernameCI = (username) =>
  User.findOne({ username: new RegExp(`^${escapeRegex((username || '').trim())}$`, 'i') });

// POST /api/auth/register - Submit registration form (creates pending request)
router.post('/register', async (req, res) => {
  try {
    const {
      username, password, discordNick, fio, callsign,
      fraction, fractionType, position, clearanceLevel,
      suggestion
    } = req.body;

    // Validate required fields
    if (!username || !password || !discordNick || !fio || !callsign || !fraction || !position) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Check username exists (регистронезависимо)
    const existingUser = await findByUsernameCI(username);
    if (existingUser) return res.status(400).json({ message: 'Username already taken' });

    // Validate discord nick format
    if (!discordNick.startsWith('@')) {
      return res.status(400).json({ message: 'Discord nick must start with @' });
    }

    // Validate clearance level
    const cl = parseInt(clearanceLevel);
    if (isNaN(cl) || cl < 0 || cl > 6) {
      return res.status(400).json({ message: 'Clearance level must be 0-6' });
    }

    // Create pending request with registration data
    const request = new Request({
      type: 'registration',
      registrationData: {
        username, password, discordNick, fio, callsign,
        fraction, fractionType: fractionType || 'civilian',
        position, clearanceLevel: cl,
        suggestion: suggestion || ''
      }
    });

    await request.save();
    res.status(201).json({ message: 'Registration submitted. Awaiting superadmin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await findByUsernameCI(username);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Account pending approval' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Registration rejected' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Account banned' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'scp_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
