const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Request = require('../models/Request');
const { auth, requireRole } = require('../middleware/auth');
const createLog = require('../utils/createLog');

// POST /api/twins/request — заявка на создание твинк-аккаунта
router.post('/request', auth, async (req, res) => {
  const { desiredLogin, desiredFio, reason } = req.body;
  if (!desiredLogin || !desiredFio) {
    return res.status(400).json({ error: 'Укажите desiredLogin и desiredFio' });
  }

  const request = await Request.create({
    type: 'twin_account',
    requestedBy: req.user._id,
    payload: { desiredLogin, desiredFio, reason },
    status: 'pending',
  });

  await createLog({ user: req.user, action: 'twin_request', objectType: 'request', objectId: request._id, details: `Заявка на твинк-аккаунт: ${desiredLogin}` });

  res.status(201).json({ request });
});

// GET /api/twins/my — твинки текущего пользователя
router.get('/my', auth, async (req, res) => {
  const twins = await User.find({ parentAccount: req.user._id }, '-passwordHash');
  res.json({ twins });
});

module.exports = router;
