const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');
const Request = require('../models/Request');
const { auth, requireRole } = require('../middleware/auth');
const createLog = require('../utils/createLog');

// GET /api/admin/requests
router.get('/requests', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const requests = await Request.find(filter).populate('requestedBy', 'fio callsign login').sort({ createdAt: -1 });
  res.json({ requests });
});

// POST /api/admin/requests/:id/approve
router.post('/requests/:id/approve', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const request = await Request.findById(req.params.id).populate('requestedBy');
  if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
  if (request.status !== 'pending') return res.status(400).json({ error: 'Заявка уже обработана' });

  if (request.type === 'twin_account') {
    const parent = request.requestedBy;
    const { desiredLogin, desiredFio } = request.payload;

    const exists = await User.findOne({ login: desiredLogin });
    if (exists) return res.status(409).json({ error: 'Логин уже занят' });

    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const twin = await User.create({
      login: desiredLogin,
      passwordHash,
      fio: desiredFio,
      fraction: parent.fraction,
      // Твинк не может получить УД выше родительского аккаунта
      clearanceLevel: Math.min(parent.clearanceLevel, parent.clearanceLevel),
      parentAccount: parent._id,
      isTwin: true,
      employeeId: `SITE81-T-${Math.floor(100000 + Math.random() * 899999)}`,
    });

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    await request.save();

    await createLog({
      user: req.user,
      action: 'twin_approved',
      objectType: 'user',
      objectId: twin._id,
      details: `Твинк-аккаунт ${desiredLogin} одобрен для ${parent.fio}`,
      meta: { tempPassword },
    });

    return res.json({ request, twin: twin.toSafeJSON(), tempPassword });
  }

  // Универсальная обработка прочих типов заявок
  request.status = 'approved';
  request.reviewedBy = req.user._id;
  await request.save();

  await createLog({ user: req.user, action: 'request_approved', objectType: 'request', objectId: request._id, details: `Заявка (${request.type}) одобрена` });

  res.json({ request });
});

// POST /api/admin/requests/:id/reject
router.post('/requests/:id/reject', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
  request.status = 'rejected';
  request.reviewedBy = req.user._id;
  request.reviewComment = req.body.comment || '';
  await request.save();

  await createLog({ user: req.user, action: 'request_rejected', objectType: 'request', objectId: request._id, details: `Заявка (${request.type}) отклонена` });

  res.json({ request });
});

// GET /api/admin/twins/:userId — связь твинк↔основной аккаунт, доступно админу по чужому id
router.get('/twins/:userId', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const twins = await User.find({ parentAccount: req.params.userId }, '-passwordHash');
  res.json({ twins });
});

module.exports = router;
