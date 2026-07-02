const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const STATUS_LABELS = {
  active: 'Активен',
  inactive: 'Неактивен',
  kia: 'Погиб (KIA)',
  mia: 'Пропал без вести (MIA)',
  suspended: 'Отстранён',
  archived: 'В архиве',
  classified: 'Засекречен',
  fake: 'Фиктивный профиль',
  vacation: 'В отпуске',
};

const STATUS_COLORS = {
  active: 'green',
  vacation: 'blue',
  suspended: 'orange',
  inactive: 'grey',
  archived: 'grey',
  kia: 'black',
  mia: 'black',
  classified: 'red',
  fake: 'red',
};

// GET /api/personnel/status-labels
router.get('/status-labels', auth, async (req, res) => {
  res.json({ labels: STATUS_LABELS, colors: STATUS_COLORS });
});

module.exports = router;
module.exports.STATUS_LABELS = STATUS_LABELS;
module.exports.STATUS_COLORS = STATUS_COLORS;
