const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const LinkedOrg = require('../models/LinkedOrg');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const orgs = await LinkedOrg.find().sort('name');
    const result = orgs.map(o => ({
      ...o.toObject(),
      canAccess: req.user.role === 'superadmin' || req.user.role === 'admin' || req.user.clearanceLevel >= o.minClearanceLevel,
      documentLink: req.user.clearanceLevel >= 5 || req.user.role === 'superadmin' ? o.documentLink : undefined
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const org = new LinkedOrg({ ...req.body, createdBy: req.user._id });
    await org.save();
    res.status(201).json(org);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const org = await LinkedOrg.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(org);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await LinkedOrg.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
