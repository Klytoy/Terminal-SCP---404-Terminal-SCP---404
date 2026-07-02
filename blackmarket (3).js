const express = require('express');
const router = express.Router();

const TerminalKey = require('../models/TerminalKey');
const Document = require('../models/Document');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

// GET /api/terminal/keys — ключи своей фракции
router.get('/keys', auth, async (req, res) => {
  const keys = await TerminalKey.find({ ownerFraction: req.user.fraction }).populate('holders', 'fio callsign');
  res.json({ keys });
});

// GET /api/terminal/keys/all — все ключи (АпАИБ/admin)
router.get('/keys/all', auth, async (req, res) => {
  if (!isAdmin(req.user) && !hasExtension(req.user, 'АпАИБ')) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  const keys = await TerminalKey.find().populate('holders', 'fio callsign');
  res.json({ keys });
});

// POST /api/terminal/keys — создание ключа (superadmin)
router.post('/keys', auth, requireRole('superadmin'), async (req, res) => {
  const { code, ownerFraction, accessibleDocumentCategories } = req.body;
  if (!code || !ownerFraction) return res.status(400).json({ error: 'Укажите code и ownerFraction' });

  const key = await TerminalKey.create({
    code,
    ownerFraction,
    accessibleDocumentCategories: accessibleDocumentCategories || [],
    usageLog: [{ user: req.user._id, action: 'created', at: new Date(), details: 'Ключ создан' }],
  });

  await createLog({ user: req.user, action: 'terminal_key_create', objectType: 'terminalKey', objectId: key._id, details: `Создан ключ ${code} для фракции ${ownerFraction}` });

  res.status(201).json({ key });
});

// POST /api/terminal/keys/:id/steal — кража ключа (СО), только если СО-агент внедрён в фракцию-владельца
router.post('/keys/:id/steal', auth, async (req, res) => {
  if (!hasExtension(req.user, 'СО') && !isAdmin(req.user)) {
    return res.status(403).json({ error: 'Нет доступа: требуется расширение СО' });
  }

  const key = await TerminalKey.findById(req.params.id);
  if (!key) return res.status(404).json({ error: 'Ключ не найден' });

  if (!isAdmin(req.user)) {
    if (!req.user.infiltratedFraction || req.user.infiltratedFraction !== key.ownerFraction) {
      return res.status(403).json({
        error: `Нет доступа: для кражи ключа фракции "${key.ownerFraction}" необходимо быть внедрённым именно в эту фракцию (infiltratedFraction)`,
      });
    }
  }

  key.isCompromised = true;
  key.stolenAt = new Date();
  key.stolenBy = req.user._id;
  if (!key.holders.includes(req.user._id)) key.holders.push(req.user._id);
  key.usageLog.push({ user: req.user._id, action: 'steal', at: new Date(), details: `Ключ похищен агентом СО (легенда: ${req.user.infiltratedFraction || 'admin-override'})` });
  await key.save();

  await createLog({
    user: req.user,
    action: 'terminal_key_stolen',
    objectType: 'terminalKey',
    objectId: key._id,
    details: `Ключ ${key.code} (фракция ${key.ownerFraction}) украден агентом СО ${req.user.callsign || req.user.fio}`,
  });

  res.json({ key });
});

// POST /api/terminal/keys/:id/access — использование ключа: список документов
router.post('/keys/:id/access', auth, async (req, res) => {
  const key = await TerminalKey.findById(req.params.id);
  if (!key) return res.status(404).json({ error: 'Ключ не найден' });

  const holds = key.holders.map(String).includes(String(req.user._id));
  if (!holds && !isAdmin(req.user)) {
    return res.status(403).json({ error: 'Нет доступа: вы не владеете этим ключом' });
  }

  const filter = {};
  if (key.accessibleDocumentCategories?.length) filter.category = { $in: key.accessibleDocumentCategories };
  if (key.ownerFraction) filter.$or = [{ fraction: key.ownerFraction }, { fraction: null }];

  const documents = await Document.find(filter).select('title category minClearance objectClass createdAt');

  key.usageLog.push({ user: req.user._id, action: 'access', at: new Date(), details: `Открыт список документов (${documents.length})` });
  await key.save();

  await createLog({
    user: req.user,
    action: 'terminal_key_access',
    objectType: 'terminalKey',
    objectId: key._id,
    details: `Ключ ${key.code} использован для просмотра документов`,
  });

  res.json({ documents, key: { code: key.code, isCompromised: key.isCompromised } });
});

// POST /api/terminal/keys/:id/revoke — отозвать скомпрометированный ключ (superadmin/АпАИБ)
router.post('/keys/:id/revoke', auth, async (req, res) => {
  if (!isAdmin(req.user) && !hasExtension(req.user, 'АпАИБ')) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  const key = await TerminalKey.findById(req.params.id);
  if (!key) return res.status(404).json({ error: 'Ключ не найден' });

  key.holders = [];
  key.isCompromised = false;
  key.stolenAt = null;
  key.stolenBy = null;
  key.usageLog.push({ user: req.user._id, action: 'revoke', at: new Date(), details: 'Ключ отозван у всех держателей' });
  await key.save();

  await createLog({ user: req.user, action: 'terminal_key_revoke', objectType: 'terminalKey', objectId: key._id, details: `Ключ ${key.code} отозван у всех держателей` });

  res.json({ key });
});

// GET /api/terminal/violations — скомпрометированные ключи для АпАИБ
router.get('/violations', auth, async (req, res) => {
  if (!isAdmin(req.user) && !hasExtension(req.user, 'АпАИБ')) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  const keys = await TerminalKey.find({ isCompromised: true }).populate('holders stolenBy', 'fio callsign');
  res.json({ keys });
});

// GET /api/terminal/verify/:employeeId — проверка удостоверения на терминале (п.5)
router.get('/verify/:employeeId', auth, async (req, res) => {
  const target = await User.findOne({ employeeId: req.params.employeeId });
  if (!target) return res.status(404).json({ error: 'Сотрудник с таким ID не найден' });

  const canSeeBoth = isAdmin(req.user) || hasExtension(req.user, 'АпАИБ');
  const usesFake = target.fakeIdentity?.enabled;

  await createLog({
    user: req.user,
    action: 'fake_identity_check',
    objectType: 'user',
    objectId: target._id,
    details: `Проверка пропуска ${target.employeeId} на терминале`,
    meta: { usesFake, byPrivileged: canSeeBoth },
  });

  if (!usesFake) {
    return res.json({
      employeeId: target.employeeId,
      fio: target.fio,
      fraction: target.fraction,
      position: target.position,
      callsign: target.callsign,
      flagged: false,
    });
  }

  if (canSeeBoth) {
    return res.json({
      employeeId: target.employeeId,
      flagged: true,
      warning: '⚠ ОБНАРУЖЕНО НЕСООТВЕТСТВИЕ',
      real: {
        fio: target.fio,
        fraction: target.fraction,
        position: target.position,
        callsign: target.callsign,
      },
      fake: {
        fio: target.fakeIdentity.fakeFio,
        fraction: target.fakeIdentity.fakeFraction,
        position: target.fakeIdentity.fakePosition,
        callsign: target.fakeIdentity.fakeCallsign,
      },
    });
  }

  // Обычный проверяющий видит только фейковые данные
  return res.json({
    employeeId: target.fakeIdentity.fakeEmployeeId || target.employeeId,
    fio: target.fakeIdentity.fakeFio,
    fraction: target.fakeIdentity.fakeFraction,
    position: target.fakeIdentity.fakePosition,
    callsign: target.fakeIdentity.fakeCallsign,
    flagged: false,
  });
});

module.exports = router;
