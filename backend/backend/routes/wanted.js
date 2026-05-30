const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const WantedPerson = require('../models/WantedPerson');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { status, dangerLevel } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dangerLevel) filter.dangerLevel = dangerLevel;
    const wanted = await WantedPerson.find(filter).sort('-createdAt');
    const result = wanted.map(w => ({
      ...w.toObject(),
      canAccess: req.user.role === 'superadmin' || req.user.role === 'admin' || req.user.clearanceLevel >= w.minClearanceLevel
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const w = new WantedPerson({ ...req.body, createdBy: req.user._id });
    await w.save();
    res.status(201).json(w);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const w = await WantedPerson.findByIdAndUpdate(
      req.params.id, { ...req.body, updatedAt: new Date() }, { new: true }
    );
    res.json(w);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await WantedPerson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
