const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const TerminalKey = require('../models/TerminalKey');
const User = require('../models/User');
const Document = require('../models/Document');

// Получить ключи своей фракции
router.get('/keys', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const keys = await TerminalKey.find({ ownerFraction: user.fraction });
    res.json(keys);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Все ключи (для АпАИБ и суперадмина)
router.get('/keys/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const isApaib = user.clearanceExtensions?.includes('АпАИБ');
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    if (!isApaib && !isAdmin) return res.status(403).json({ message: 'Нет доступа' });
    const keys = await TerminalKey.find().populate('holders', 'callsign fraction');
    res.json(keys);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Создать ключ (только суперадмин)
router.post('/keys', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Нет доступа' });
    const key = await TerminalKey.create(req.body);
    res.json(key);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// "Украсть" ключ (для СО — внедрение)
router.post('/keys/:id/steal', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    // СО могут красть ключи
    const isSO = user.clearanceExtensions?.includes('СО');
    if (!isSO && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Нет доступа' });

    const key = await TerminalKey.findById(req.params.id);
    if (!key) return res.status(404).json({ message: 'Ключ не найден' });

    if (!key.holders.includes(req.user.userId)) {
      key.holders.push(req.user.userId);
      key.isCompromised = true;
      key.compromisedBy = req.user.userId;
      await key.save();
    }
    res.json({ message: 'Ключ получен', key });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Использовать ключ для доступа к документам
router.post('/keys/:id/access', auth, async (req, res) => {
  try {
    const key = await TerminalKey.findById(req.params.id);
    if (!key) return res.status(404).json({ message: 'Ключ не найден' });
    const hasKey = key.holders.includes(req.user.userId);
    const user = await User.findById(req.user.userId);
    const ownsFraction = user.fraction === key.ownerFraction;
    if (!hasKey && !ownsFraction) return res.status(403).json({ message: 'У вас нет этого ключа' });

    // Получаем документы доступные по этому ключу
    const docs = await Document.find({
      $or: [
        { terminalKeyRequired: key._id },
        { category: { $in: key.accessCategories } }
      ]
    }).select('title category clearanceLevel createdAt');
    res.json({ key, documents: docs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// АпАИБ — найти нарушителей с чужими ключами
router.get('/violations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const isApaib = user.clearanceExtensions?.includes('АпАИБ');
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    if (!isApaib && !isAdmin) return res.status(403).json({ message: 'Нет доступа' });

    const compromisedKeys = await TerminalKey.find({ isCompromised: true })
      .populate('compromisedBy', 'callsign fio fraction')
      .populate('holders', 'callsign fio fraction');
    res.json(compromisedKeys);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
