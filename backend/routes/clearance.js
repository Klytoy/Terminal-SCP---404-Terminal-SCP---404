const express = require('express');
const router = express.Router();

const CustomClearance = require('../models/CustomClearance');
const { auth, requireRole } = require('../middleware/auth');
const { EXTENSIONS, CLEARANCE_LEVELS } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/clearance/reference — справочник уровней и расширений для фронтенда
router.get('/reference', auth, async (req, res) => {
  res.json({ levels: CLEARANCE_LEVELS, extensions: Object.values(EXTENSIONS) });
});

// GET /api/clearance/custom — список кастомных допусков
router.get('/custom', auth, async (req, res) => {
  const custom = await CustomClearance.find();
  res.json({ custom });
});

// POST /api/clearance/custom — superadmin
router.post('/custom', auth, requireRole('superadmin'), async (req, res) => {
  const clearance = await CustomClearance.create(req.body);
  await createLog({ user: req.user, action: 'custom_clearance_create', objectType: 'clearance', objectId: clearance._id, details: `Создан кастомный допуск ${clearance.name}` });
  res.status(201).json({ clearance });
});

// PATCH /api/clearance/custom/:id — superadmin
router.patch('/custom/:id', auth, requireRole('superadmin'), async (req, res) => {
  const clearance = await CustomClearance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!clearance) return res.status(404).json({ error: 'Допуск не найден' });
  await createLog({ user: req.user, action: 'custom_clearance_update', objectType: 'clearance', objectId: clearance._id, details: `Обновлён кастомный допуск ${clearance.name}` });
  res.json({ clearance });
});

module.exports = router;
