const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const { auth } = require('../middleware/auth');
const createLog = require('../utils/createLog');

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { login, password, fio, callsign, fraction, position } = req.body;
    if (!login || !password || !fio) {
      return res.status(400).json({ error: 'Заполните обязательные поля: login, password, fio' });
    }
    const exists = await User.findOne({ login });
    if (exists) return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      login,
      passwordHash,
      fio,
      callsign,
      fraction,
      position,
      employeeId: `SITE81-${Math.floor(100000 + Math.random() * 899999)}`,
    });

    await createLog({ user, action: 'register', objectType: 'user', objectId: user._id, details: `Регистрация нового сотрудника: ${fio}` });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ login });
    if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Неверный логин или пароль' });

    await createLog({ user, action: 'login', objectType: 'user', objectId: user._id, details: `Вход в систему: ${user.callsign || user.fio}` });

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

module.exports = router;
