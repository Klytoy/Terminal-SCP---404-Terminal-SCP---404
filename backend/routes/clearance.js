const router = require('express').Router();
const { auth } = require('./auth');
const CustomClearance = require('../models/CustomClearance');

const superOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Только суперадмин' });
  next();
};

// Все кастомные УД
router.get('/', auth, async (req, res) => {
  try {
    const list = await CustomClearance.find().sort({ level: 1 });
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Создать кастомный УД
router.post('/', auth, superOnly, async (req, res) => {
  try {
    const cl = await CustomClearance.create({ ...req.body, createdBy: req.user.id });
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Обновить
router.put('/:id', auth, superOnly, async (req, res) => {
  try {
    const cl = await CustomClearance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Удалить
router.delete('/:id', auth, superOnly, async (req, res) => {
  try {
    await CustomClearance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Удалён' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
