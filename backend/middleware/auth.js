const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasExtension, isAdmin } = require('../config/extensions');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Нет доступа: токен не предоставлен' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Нет доступа: пользователь не найден' });

    // Автопродление статуса из отпуска
    if (user.personnelStatus === 'vacation' && user.vacationUntil && new Date(user.vacationUntil) <= new Date()) {
      user.personnelStatus = 'active';
      user.vacationUntil = null;
      await user.save();
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Нет доступа: недействительный токен' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Нет доступа: недостаточно прав' });
    }
    next();
  };
}

function requireExtension(...codes) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Нет доступа' });
    if (isAdmin(req.user)) return next();
    const ok = codes.some((c) => hasExtension(req.user, c));
    if (!ok) return res.status(403).json({ error: 'Нет доступа: требуется специальное расширение допуска' });
    next();
  };
}

function requireClearance(minLevel) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Нет доступа' });
    if (isAdmin(req.user)) return next();
    if ((req.user.clearanceLevel || 0) < minLevel) {
      return res.status(403).json({ error: `Нет доступа: требуется уровень допуска ${minLevel}` });
    }
    next();
  };
}

module.exports = { auth, requireRole, requireExtension, requireClearance };
