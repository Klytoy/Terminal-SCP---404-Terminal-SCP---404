const express = require('express');
const router = express.Router();

const Document = require('../models/Document');
const { auth, requireRole } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/documents — с фильтрацией по УД и requiredExtension
router.get('/', auth, async (req, res) => {
  const docs = await Document.find({ minClearance: { $lte: req.user.clearanceLevel || 0 } }).sort({ createdAt: -1 });

  const visible = docs.filter((d) => {
    if (!d.requiredExtension) return true;
    return isAdmin(req.user) || hasExtension(req.user, d.requiredExtension);
  });

  res.json({ documents: visible });
});

// GET /api/documents/:id
router.get('/:id', auth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Документ не найден' });
  if ((req.user.clearanceLevel || 0) < doc.minClearance) return res.status(403).json({ error: 'Нет доступа: недостаточный уровень допуска' });
  if (doc.requiredExtension && !isAdmin(req.user) && !hasExtension(req.user, doc.requiredExtension)) {
    return res.status(403).json({ error: `Нет доступа: требуется расширение ${doc.requiredExtension}` });
  }
  res.json({ document: doc });
});

// POST /api/documents — admin/superadmin
router.post('/', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const doc = await Document.create({ ...req.body, createdBy: req.user._id });
  await createLog({ user: req.user, action: 'document_create', objectType: 'document', objectId: doc._id, details: `Создан документ "${doc.title}"` });
  res.status(201).json({ document: doc });
});

module.exports = router;
