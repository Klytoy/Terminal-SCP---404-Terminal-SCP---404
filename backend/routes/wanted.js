const express = require('express');
const router = express.Router();

const WantedPerson = require('../models/WantedPerson');
const { auth, requireRole } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/wanted
router.get('/', auth, async (req, res) => {
  const all = await WantedPerson.find().sort({ createdAt: -1 });
  const canSeeNrp = isAdmin(req.user) || hasExtension(req.user, 'НРП');
  const visible = all.filter((w) => !w.nrpVisibility || canSeeNrp);
  res.json({ wanted: visible });
});

// POST /api/wanted
router.post('/', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const wanted = await WantedPerson.create({ ...req.body, addedBy: req.user._id });
  await createLog({ user: req.user, action: 'wanted_create', objectType: 'wanted', objectId: wanted._id, details: `Добавлена карточка розыска: ${wanted.fio}` });
  res.status(201).json({ wanted });
});

// PATCH /api/wanted/:id
router.patch('/:id', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const wanted = await WantedPerson.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!wanted) return res.status(404).json({ error: 'Запись не найдена' });
  await createLog({ user: req.user, action: 'wanted_update', objectType: 'wanted', objectId: wanted._id, details: `Обновлена карточка розыска: ${wanted.fio}` });
  res.json({ wanted });
});

module.exports = router;
