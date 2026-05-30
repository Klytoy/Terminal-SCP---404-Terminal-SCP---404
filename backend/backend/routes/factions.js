const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Faction = require('../models/Faction');

// Public route - get faction names for registration form (no auth)
router.get('/public', async (req, res) => {
  try {
    const factions = await Faction.find({}, 'name type').sort('name');
    res.json(factions);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const factions = await Faction.find(filter).sort('name');
    const result = factions.map(f => ({
      ...f.toObject(),
      canAccess: req.user.role === 'superadmin' || req.user.role === 'admin' || req.user.clearanceLevel >= f.minClearanceLevel
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const faction = new Faction({ ...req.body, createdBy: req.user._id });
    await faction.save();
    res.status(201).json(faction);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const f = await Faction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(f);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await Faction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
