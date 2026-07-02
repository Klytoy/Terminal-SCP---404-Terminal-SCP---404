const express = require('express');
const router = express.Router();

const PersonnelRecord = require('../models/PersonnelRecord');
const { auth, requireRole } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/personnel-records
router.get('/', auth, async (req, res) => {
  const records = await PersonnelRecord.find().sort({ fio: 1 });
  const visible = records.filter((r) => isAdmin(req.user) || (req.user.clearanceLevel || 0) >= r.minClearanceToView);
  res.json({ records: visible });
});

// GET /api/personnel-records/:id
router.get('/:id', auth, async (req, res) => {
  const record = await PersonnelRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Личное дело не найдено' });
  if (!isAdmin(req.user) && (req.user.clearanceLevel || 0) < record.minClearanceToView) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  res.json({ record });
});

// POST /api/personnel-records
router.post('/', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const record = await PersonnelRecord.create(req.body);
  await createLog({ user: req.user, action: 'personnel_record_create', objectType: 'personnelRecord', objectId: record._id, details: `Создано личное дело: ${record.fio}` });
  res.status(201).json({ record });
});

// PATCH /api/personnel-records/:id
router.patch('/:id', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const record = await PersonnelRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) return res.status(404).json({ error: 'Личное дело не найдено' });
  await createLog({ user: req.user, action: 'personnel_record_update', objectType: 'personnelRecord', objectId: record._id, details: `Обновлено личное дело: ${record.fio}` });
  res.json({ record });
});

function canEditNotes(reqUser) {
  return isAdmin(reqUser) || hasExtension(reqUser, 'АпАИБ');
}

// GET /api/personnel-records/:id/notes
router.get('/:id/notes', auth, async (req, res) => {
  const record = await PersonnelRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Личное дело не найдено' });
  if (!isAdmin(req.user) && !hasExtension(req.user, 'АпАИБ') && (req.user.clearanceLevel || 0) < record.minClearanceToView) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  res.json({ notes: record.notes });
});

// POST /api/personnel-records/:id/notes
router.post('/:id/notes', auth, async (req, res) => {
  if (!canEditNotes(req.user)) return res.status(403).json({ error: 'Нет доступа' });
  const { type, text } = req.body;
  if (!type || !text) return res.status(400).json({ error: 'Укажите type и text' });

  const record = await PersonnelRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Личное дело не найдено' });

  record.notes.push({ type, text, author: req.user._id, authorName: req.user.callsign || req.user.fio, createdAt: new Date() });
  await record.save();

  await createLog({ user: req.user, action: 'personnel_record_note_add', objectType: 'personnelRecord', objectId: record._id, details: `Добавлена запись (${type}) в дело ${record.fio}` });

  res.status(201).json({ notes: record.notes });
});

// DELETE /api/personnel-records/:id/notes/:noteId
router.delete('/:id/notes/:noteId', auth, requireRole('superadmin'), async (req, res) => {
  const record = await PersonnelRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Личное дело не найдено' });

  const note = record.notes.id(req.params.noteId);
  if (!note) return res.status(404).json({ error: 'Запись не найдена' });
  note.deleteOne();
  await record.save();

  await createLog({ user: req.user, action: 'personnel_record_note_delete', objectType: 'personnelRecord', objectId: record._id, details: `Удалена запись из дела ${record.fio}` });

  res.json({ notes: record.notes });
});

module.exports = router;
