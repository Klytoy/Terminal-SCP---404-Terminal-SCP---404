const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Нет токена' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'scp_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Пользователь не найден' });
    req.user = { ...decoded, role: user.role, clearanceLevel: user.clearanceLevel };
    next();
  } catch { res.status(401).json({ message: 'Недействительный токен' }); }
};

const adminOnly = (req, res, next) => {
  if (!['superadmin', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Нет доступа' });
  next();
};

module.exports = { auth, adminOnly };
