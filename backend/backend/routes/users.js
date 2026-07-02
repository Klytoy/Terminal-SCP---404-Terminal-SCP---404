const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Все пользователи (для админа)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Персонал — с фильтром по УД
router.get('/personnel', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.userId);
    const myLevel = me?.clearanceLevel || 0;
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const users = await User.find({ status: 'approved' }).select('-password');

    const result = users.map(u => {
      if (!isAdmin && u.clearanceLevel > myLevel) {
        return {
          _id: u._id, callsign: '█████', fio: '█████ █████',
          position: '█████', fraction: u.fraction, fractionType: u.fractionType,
          clearanceLevel: u.clearanceLevel, personnelStatus: u.personnelStatus,
          classified: true
        };
      }
      // Показать фальшивую личность если включена
      const obj = u.toSafeObject();
      if (u.fakeIdentity?.enabled && !isAdmin) {
        obj.fraction = u.fakeIdentity.fakeFraction || u.fraction;
        obj.position = u.fakeIdentity.fakePosition || u.position;
        obj.fio = u.fakeIdentity.fakeFio || u.fio;
        obj.callsign = u.fakeIdentity.fakeCallsign || u.callsign;
        obj.employeeId = u.fakeIdentity.fakeEmployeeId || u.employeeId;
        obj.hasAltIdentity = false; // скрываем факт подмены
      }
      return obj;
    });
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Один пользователь
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Не найден' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Полное редактирование (только админ/суперадмин)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const update = { ...rest, updatedAt: new Date() };
    if (password) update.password = await bcrypt.hash(password, 12);

    // Только суперадмин может менять роль
    if (rest.role && req.user.role !== 'superadmin') delete update.role;

    // Не даём изменять суперадмина обычному админу
    const target = await User.findById(req.params.id);
    if (target?.role === 'superadmin' && req.user.role !== 'superadmin')
      return res.status(403).json({ message: 'Нет доступа' });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Добавить пометку в личное дело
router.post('/:id/notes', auth, adminOnly, async (req, res) => {
  try {
    const me = await User.findById(req.user.userId);
    const { type, text } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { personnelNotes: { type, text, author: req.user.userId, authorName: me.callsign } } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Удалить пометку
router.delete('/:id/notes/:noteId', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { personnelNotes: { _id: req.params.noteId } } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Начислить/снять баланс
router.patch('/:id/balance', auth, adminOnly, async (req, res) => {
  try {
    const { amount, operation } = req.body; // operation: 'add' | 'subtract' | 'set'
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Не найден' });
    if (operation === 'add') user.balance = (user.balance || 0) + amount;
    else if (operation === 'subtract') user.balance = Math.max(0, (user.balance || 0) - amount);
    else user.balance = amount;
    await user.save();
    res.json({ balance: user.balance });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Удалить пользователя (только суперадмин)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Только суперадмин' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Удалён' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
