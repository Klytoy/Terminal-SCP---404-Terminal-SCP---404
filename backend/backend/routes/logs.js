const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

router.use(auth);
router.use(requireRole('admin', 'superadmin'));

router.get('/', async (req, res) => {
  try {
    const { objectType } = req.query;
    const filter = {};
    if (objectType) filter.objectType = objectType;
    const logs = await ActivityLog.find(filter)
      .populate('user', 'username callsign employeeId')
      .sort('-createdAt')
      .limit(200);
    res.json(logs);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;

// Helper to create logs
module.exports.createLog = async (userId, username, action, details, objectType) => {
  try {
    await ActivityLog.create({ user: userId, username, action, details, objectType });
  } catch (e) {}
};
