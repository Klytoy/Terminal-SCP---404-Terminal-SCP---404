const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/users — общий список сотрудников (карточки)
router.get('/', auth, async (req, res) => {
  const users = await User.find({}, '-passwordHash').sort({ fio: 1 });
  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  const user = await User.findById(req.params.id, '-passwordHash');
  if (!user) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json({ user });
});

// ---------------------------------------------------------------------
// Личное дело: нарушения / поощрения (п.3)
// ---------------------------------------------------------------------

function canViewNotes(reqUser, targetUser) {
  if (isAdmin(reqUser)) return true;
  if (hasExtension(reqUser, 'АпАИБ')) return true;
  if (String(reqUser._id) === String(targetUser._id)) return true;
  return false;
}

function canEditNotes(reqUser) {
  return isAdmin(reqUser) || hasExtension(reqUser, 'АпАИБ');
}

// GET /api/users/:id/notes
router.get('/:id/notes', auth, async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Сотрудник не найден' });
  if (!canViewNotes(req.user, target)) return res.status(403).json({ error: 'Нет доступа' });
  res.json({ notes: target.personnelNotes });
});

// POST /api/users/:id/notes
router.post('/:id/notes', auth, async (req, res) => {
  if (!canEditNotes(req.user)) return res.status(403).json({ error: 'Нет доступа' });
  const { type, text } = req.body;
  if (!type || !text) return res.status(400).json({ error: 'Укажите type и text' });

  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Сотрудник не найден' });

  const note = {
    type,
    text,
    author: req.user._id,
    authorName: req.user.callsign || req.user.fio,
    createdAt: new Date(),
  };
  target.personnelNotes.push(note);
  await target.save();

  await createLog({
    user: req.user,
    action: 'personnel_note_add',
    objectType: 'user',
    objectId: target._id,
    details: `Добавлена запись (${type}) в личное дело ${target.fio}`,
    meta: { type, text },
  });

  res.status(201).json({ notes: target.personnelNotes });
});

// DELETE /api/users/:id/notes/:noteId
router.delete('/:id/notes/:noteId', auth, requireRole('superadmin'), async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Сотрудник не найден' });

  const note = target.personnelNotes.id(req.params.noteId);
  if (!note) return res.status(404).json({ error: 'Запись не найдена' });
  note.deleteOne();
  await target.save();

  await createLog({
    user: req.user,
    action: 'personnel_note_delete',
    objectType: 'user',
    objectId: target._id,
    details: `Удалена запись из личного дела ${target.fio}`,
    meta: { noteId: req.params.noteId },
  });

  res.json({ notes: target.personnelNotes });
});

// ---------------------------------------------------------------------
// Фальшивые удостоверения (п.5)
// ---------------------------------------------------------------------

// PATCH /api/users/me/fake-identity — сам сотрудник (при наличии СО)
router.patch('/me/fake-identity', auth, async (req, res) => {
  if (!hasExtension(req.user, 'СО') && !isAdmin(req.user)) {
    return res.status(403).json({ error: 'Нет доступа: требуется расширение СО' });
  }
  const { enabled, fakeFraction, fakePosition, fakeFio, fakeCallsign, fakeEmployeeId } = req.body;
  req.user.fakeIdentity = {
    enabled: !!enabled,
    fakeFraction: fakeFraction ?? req.user.fakeIdentity?.fakeFraction ?? '',
    fakePosition: fakePosition ?? req.user.fakeIdentity?.fakePosition ?? '',
    fakeFio: fakeFio ?? req.user.fakeIdentity?.fakeFio ?? '',
    fakeCallsign: fakeCallsign ?? req.user.fakeIdentity?.fakeCallsign ?? '',
    fakeEmployeeId: fakeEmployeeId ?? req.user.fakeIdentity?.fakeEmployeeId ?? '',
  };
  await req.user.save();

  await createLog({
    user: req.user,
    action: 'fake_identity_update',
    objectType: 'user',
    objectId: req.user._id,
    details: `Обновлено фальшивое удостоверение (enabled=${!!enabled})`,
  });

  res.json({ fakeIdentity: req.user.fakeIdentity });
});

// PATCH /api/users/:id/fake-identity — админ выставляет за другого сотрудника
router.patch('/:id/fake-identity', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Сотрудник не найден' });

  const { enabled, fakeFraction, fakePosition, fakeFio, fakeCallsign, fakeEmployeeId } = req.body;
  target.fakeIdentity = {
    enabled: !!enabled,
    fakeFraction: fakeFraction ?? target.fakeIdentity?.fakeFraction ?? '',
    fakePosition: fakePosition ?? target.fakeIdentity?.fakePosition ?? '',
    fakeFio: fakeFio ?? target.fakeIdentity?.fakeFio ?? '',
    fakeCallsign: fakeCallsign ?? target.fakeIdentity?.fakeCallsign ?? '',
    fakeEmployeeId: fakeEmployeeId ?? target.fakeIdentity?.fakeEmployeeId ?? '',
  };
  await target.save();

  await createLog({
    user: req.user,
    action: 'fake_identity_admin_update',
    objectType: 'user',
    objectId: target._id,
    details: `Админ обновил фальшивое удостоверение для ${target.fio}`,
  });

  res.json({ fakeIdentity: target.fakeIdentity });
});

// PATCH /api/users/:id/status — изменение личного статуса (в т.ч. vacation, п.11)
router.patch('/:id/status', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const { personnelStatus, vacationUntil } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Сотрудник не найден' });

  target.personnelStatus = personnelStatus || target.personnelStatus;
  target.vacationUntil = personnelStatus === 'vacation' ? vacationUntil || null : null;
  await target.save();

  await createLog({
    user: req.user,
    action: 'status_change',
    objectType: 'user',
    objectId: target._id,
    details: `Статус сотрудника ${target.fio} изменён на ${target.personnelStatus}`,
  });

  res.json({ user: target.toSafeJSON() });
});

// PATCH /api/users/:id/clearance — изменение УД (только выше уровнем)
router.patch('/:id/clearance', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const { clearanceLevel, clearanceExtensions } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Сотрудник не найден' });

  const before = { level: target.clearanceLevel, ext: target.clearanceExtensions };
  if (clearanceLevel !== undefined) target.clearanceLevel = clearanceLevel;
  if (clearanceExtensions !== undefined) target.clearanceExtensions = clearanceExtensions;
  await target.save();

  await createLog({
    user: req.user,
    action: 'clearance_change',
    objectType: 'clearance',
    objectId: target._id,
    details: `УД сотрудника ${target.fio} изменён: ${before.level} → ${target.clearanceLevel}`,
    meta: { before, after: { level: target.clearanceLevel, ext: target.clearanceExtensions } },
  });

  res.json({ user: target.toSafeJSON() });
});

module.exports = router;
