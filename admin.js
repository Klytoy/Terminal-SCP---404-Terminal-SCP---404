const express = require('express');
const router = express.Router();

const Faction = require('../models/Faction');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/factions
router.get('/', auth, async (req, res) => {
  const factions = await Faction.find().sort({ type: 1, name: 1 });
  res.json({ factions });
});

// GET /api/factions/:id
router.get('/:id', auth, async (req, res) => {
  const faction = await Faction.findById(req.params.id);
  if (!faction) return res.status(404).json({ error: 'Отряд/фракция не найдены' });
  res.json({ faction });
});

// POST /api/factions — superadmin
router.post('/', auth, requireRole('superadmin'), async (req, res) => {
  const faction = await Faction.create(req.body);
  await createLog({ user: req.user, action: 'faction_create', objectType: 'faction', objectId: faction._id, details: `Создана фракция ${faction.name}` });
  res.status(201).json({ faction });
});

// PATCH /api/factions/:id — superadmin
router.patch('/:id', auth, requireRole('superadmin'), async (req, res) => {
  const faction = await Faction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faction) return res.status(404).json({ error: 'Фракция не найдена' });
  await createLog({ user: req.user, action: 'faction_update', objectType: 'faction', objectId: faction._id, details: `Обновлена фракция ${faction.name}` });
  res.json({ faction });
});

function isFactionLeaderOf(user, faction) {
  if (isAdmin(user)) return true;
  if (!user.fraction || user.fraction !== faction.name) return false;
  return user.isFactionLeader || faction.leader === user.callsign || faction.leader === user.fio;
}

// GET /api/factions/:id/balance
router.get('/:id/balance', auth, async (req, res) => {
  const faction = await Faction.findById(req.params.id);
  if (!faction) return res.status(404).json({ error: 'Фракция не найдена' });
  if (!isFactionLeaderOf(req.user, faction)) return res.status(403).json({ error: 'Нет доступа: только руководитель фракции' });
  res.json({ balance: faction.balance, balanceLog: faction.balanceLog });
});

// POST /api/factions/:id/balance/transfer — со счёта фракции на личный счёт сотрудника
router.post('/:id/balance/transfer', auth, async (req, res) => {
  const faction = await Faction.findById(req.params.id);
  if (!faction) return res.status(404).json({ error: 'Фракция не найдена' });
  if (!isFactionLeaderOf(req.user, faction)) return res.status(403).json({ error: 'Нет доступа: только руководитель фракции' });

  const { toUserId, amount, reason } = req.body;
  if (!toUserId || !amount || amount <= 0) return res.status(400).json({ error: 'Укажите toUserId и amount > 0' });
  if (faction.balance < amount) return res.status(400).json({ error: 'Недостаточно средств на счёте фракции' });

  const targetUser = await User.findById(toUserId);
  if (!targetUser) return res.status(404).json({ error: 'Сотрудник не найден' });

  faction.balance -= amount;
  faction.balanceLog.push({ amount: -amount, reason: reason || 'Перевод сотруднику', byUser: req.user._id, at: new Date() });
  await faction.save();

  targetUser.balance += amount;
  await targetUser.save();

  await createLog({
    user: req.user,
    action: 'faction_balance_transfer',
    objectType: 'faction',
    objectId: faction._id,
    details: `Перевод ${amount} со счёта фракции ${faction.name} сотруднику ${targetUser.fio}`,
    meta: { amount, toUserId, reason },
  });

  res.json({ faction, targetUser: targetUser.toSafeJSON() });
});

// POST /api/factions/:id/balance/deposit — начисление на счёт фракции (superadmin)
router.post('/:id/balance/deposit', auth, requireRole('superadmin'), async (req, res) => {
  const faction = await Faction.findById(req.params.id);
  if (!faction) return res.status(404).json({ error: 'Фракция не найдена' });

  const { amount, reason } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount должен быть > 0' });

  faction.balance += amount;
  faction.balanceLog.push({ amount, reason: reason || 'Начисление (ивент)', byUser: req.user._id, at: new Date() });
  await faction.save();

  await createLog({ user: req.user, action: 'faction_balance_deposit', objectType: 'faction', objectId: faction._id, details: `Начислено ${amount} на счёт фракции ${faction.name}`, meta: { amount, reason } });

  res.json({ faction });
});

module.exports = router;
