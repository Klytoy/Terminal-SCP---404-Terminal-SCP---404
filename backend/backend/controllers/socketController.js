const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'scp_secret_key');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || user.status !== 'approved') return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    // Join personal room
    socket.join(`user:${userId}`);
    
    console.log(`User connected: ${socket.user.username}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        user: { username: socket.user.username, callsign: socket.user.callsign }
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = { socketHandler };
