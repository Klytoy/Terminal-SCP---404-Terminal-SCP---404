const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const SCPObject = require('../models/SCPObject');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { search, objectClass, section } = req.query;
    const filter = {};
    if (objectClass) filter.objectClass = objectClass;
    if (section) filter.section = section;
    if (search) filter.$or = [
      { number: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ];
    const scps = await SCPObject.find(filter).sort('number');
    const result = scps.map(s => ({
      ...s.toObject(),
      canAccess: req.user.role === 'superadmin' || req.user.role === 'admin' || req.user.clearanceLevel >= s.minClearanceLevel
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const scp = await SCPObject.findById(req.params.id);
    if (!scp) return res.status(404).json({ message: 'Not found' });
    const canAccess = req.user.role === 'superadmin' || req.user.role === 'admin' || req.user.clearanceLevel >= scp.minClearanceLevel;
    if (!canAccess) return res.status(403).json({ message: 'Insufficient clearance', canRequest: true });
    res.json(scp);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const scp = new SCPObject({ ...req.body, createdBy: req.user._id });
    await scp.save();
    res.status(201).json(scp);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const scp = await SCPObject.findByIdAndUpdate(
      req.params.id, { ...req.body, updatedBy: req.user._id, updatedAt: new Date() }, { new: true }
    );
    res.json(scp);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await SCPObject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
