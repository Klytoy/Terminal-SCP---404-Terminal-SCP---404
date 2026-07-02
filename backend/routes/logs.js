const express = require('express');
const router = express.Router();

const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');

function canViewLogs(user) {
  return isAdmin(user) || hasExtension(user, 'АпАИБ');
}

// GET /api/logs?userId=&dateFrom=&dateTo=&action=&objectType=
router.get('/', auth, async (req, res) => {
  if (!canViewLogs(req.user)) return res.status(403).json({ error: 'Нет доступа' });

  const { userId, dateFrom, dateTo, action, objectType, limit } = req.query;
  const filter = {};
  if (userId) filter.user = userId;
  if (action) filter.action = action;
  if (objectType) filter.objectType = objectType;
  if (dateFrom || dateTo) {
    filter.at = {};
    if (dateFrom) filter.at.$gte = new Date(dateFrom);
    if (dateTo) filter.at.$lte = new Date(dateTo);
  }

  const logs = await ActivityLog.find(filter)
    .sort({ at: -1 })
    .limit(Math.min(parseInt(limit, 10) || 200, 1000));

  res.json({ logs });
});

module.exports = router;
