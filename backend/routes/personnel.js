const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const PersonnelRecord = require('../models/PersonnelRecord');

router.use(auth);

const STATUS_LABELS = {
  active: 'Активен', inactive: 'Неактивен', kia: 'Погиб',
  mia: 'Пропал без вести', suspended: 'Отстранён',
  archived: 'Архивирован', classified: 'Засекречен', fake: 'Подделка'
};

// GET /api/personnel
router.get('/', async (req, res) => {
  try {
    const { search, fractionType, personnelStatus } = req.query;
    const filter = {};
    if (fractionType) filter.fractionType = fractionType;
    if (personnelStatus) filter.personnelStatus = personnelStatus;
    if (search) {
      filter.$or = [
        { fio: { $regex: search, $options: 'i' } },
        { callsign: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { fraction: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await PersonnelRecord.find(filter).sort('fio');
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    const result = records.map(r => {
      const canView = isAdmin || req.user.clearanceLevel >= r.minClearanceToView;
      if (!canView || r.isClassified && !isAdmin) {
        return {
          _id: r._id,
          callsign: '[ЗАСЕКРЕЧЕНО]',
          fio: '[ЗАСЕКРЕЧЕНО]',
          fraction: r.fraction,
          fractionType: r.fractionType,
          clearanceLevel: r.clearanceLevel,
          personnelStatus: r.personnelStatus,
          minClearanceToView: r.minClearanceToView,
          isRedacted: true
        };
      }
      return r.toObject();
    });

    res.json(result);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/personnel/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await PersonnelRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const canView = isAdmin || req.user.clearanceLevel >= record.minClearanceToView;
    
    if (!canView) return res.status(403).json({ message: 'Insufficient clearance' });
    res.json(record);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/personnel - create record (admin+)
router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const record = new PersonnelRecord({ ...req.body, createdBy: req.user._id });
    await record.save();
    res.status(201).json(record);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/personnel/:id
router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const record = await PersonnelRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/personnel/:id
router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await PersonnelRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
