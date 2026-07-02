const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'scp_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.status !== 'approved') return res.status(403).json({ message: 'Account not approved' });
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

const requireClearance = (level, extensions = []) => (req, res, next) => {
  if (req.user.clearanceLevel < level) {
    return res.status(403).json({ message: 'Insufficient clearance level', needsRequest: true });
  }
  if (extensions.length > 0) {
    const hasExt = extensions.every(ext => req.user.clearanceExtensions?.includes(ext));
    if (!hasExt) {
      return res.status(403).json({ message: 'Missing clearance extensions', needsRequest: true });
    }
  }
  next();
};

module.exports = { auth, requireRole, requireClearance };
