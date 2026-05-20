const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Message, Conversation } = require('../models/Message');
const User = require('../models/User');

router.use(auth);

// Check if comms are globally blocked
const checkComms = (req, res, next) => {
  if (global.commsBlocked) {
    return res.status(403).json({ message: 'All communications are currently blocked' });
  }
  next();
};

// GET /api/messages/conversations - list all my conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'username fio callsign employeeId clearanceLevel')
      .populate('lastMessage')
      .populate('createdBy', 'username')
      .sort('-lastActivity');
    
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/conversations/dm - start or get DM
router.post('/conversations/dm', checkComms, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    // Check if DM already exists
    let conv = await Conversation.findOne({
      type: 'dm',
      participants: { $all: [req.user._id, targetUserId], $size: 2 }
    }).populate('participants', 'username fio callsign employeeId');
    
    if (!conv) {
      conv = new Conversation({
        type: 'dm',
        participants: [req.user._id, targetUserId],
        createdBy: req.user._id
      });
      await conv.save();
      await conv.populate('participants', 'username fio callsign employeeId');
    }
    
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/conversations/group - create group
router.post('/conversations/group', checkComms, async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    
    const allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];
    
    const conv = new Conversation({
      type: 'group',
      name,
      participants: allParticipants,
      admins: [req.user._id],
      createdBy: req.user._id
    });
    
    await conv.save();
    await conv.populate('participants', 'username fio callsign employeeId');
    
    const io = req.app.get('io');
    allParticipants.forEach(pid => {
      io.to(`user:${pid}`).emit('new_conversation', conv);
    });
    
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/conversations/:id/participants - add to group
router.post('/conversations/:id/participants', checkComms, async (req, res) => {
  try {
    const { userIds } = req.body;
    const conv = await Conversation.findById(req.params.id);
    
    if (!conv || conv.type !== 'group') return res.status(404).json({ message: 'Group not found' });
    if (!conv.admins.includes(req.user._id)) return res.status(403).json({ message: 'Not an admin' });
    
    conv.participants = [...new Set([...conv.participants.map(p => p.toString()), ...userIds])];
    await conv.save();
    
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!conv.participants.includes(req.user._id) && req.user.role === 'user') {
      return res.status(403).json({ message: 'Not a participant' });
    }
    
    const messages = await Message.find({ 
      conversation: req.params.id,
      isDeleted: false
    })
      .populate('sender', 'username fio callsign employeeId')
      .populate('replyTo')
      .sort('createdAt')
      .limit(100);
    
    // Mark as read
    await Message.updateMany(
      { conversation: req.params.id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/conversations/:id/messages - send message
router.post('/conversations/:id/messages', checkComms, async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (conv.isBlocked) return res.status(403).json({ message: 'Conversation is blocked' });
    if (!conv.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not a participant' });
    }
    
    const message = new Message({
      conversation: req.params.id,
      sender: req.user._id,
      content,
      replyTo: replyTo || null,
      readBy: [req.user._id]
    });
    
    await message.save();
    await message.populate('sender', 'username fio callsign employeeId');
    if (replyTo) await message.populate('replyTo');
    
    // Update conversation last activity
    conv.lastMessage = message._id;
    conv.lastActivity = new Date();
    await conv.save();
    
    // Emit to all participants
    const io = req.app.get('io');
    conv.participants.forEach(pid => {
      io.to(`user:${pid}`).emit('new_message', {
        conversationId: req.params.id,
        message
      });
    });
    
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/messages/:id - edit message
router.patch('/:id', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your message' });
    }
    
    msg.content = req.body.content;
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();
    
    const io = req.app.get('io');
    const conv = await Conversation.findById(msg.conversation);
    conv.participants.forEach(pid => {
      io.to(`user:${pid}`).emit('message_edited', { messageId: msg._id, content: msg.content });
    });
    
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages/:id - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString() && req.user.role === 'user') {
      return res.status(403).json({ message: 'Not your message' });
    }
    
    msg.isDeleted = true;
    await msg.save();
    
    const io = req.app.get('io');
    const conv = await Conversation.findById(msg.conversation);
    conv.participants.forEach(pid => {
      io.to(`user:${pid}`).emit('message_deleted', { messageId: msg._id });
    });
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/conversations/:id/block - admin block conversation
router.post('/conversations/:id/block', require('../middleware/auth').requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { blocked } = req.body;
    const conv = await Conversation.findByIdAndUpdate(
      req.params.id,
      { isBlocked: blocked, blockedBy: req.user._id },
      { new: true }
    );
    
    const io = req.app.get('io');
    io.emit('conversation_blocked', { conversationId: req.params.id, blocked });
    
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages/conversations/:id - delete conversation
router.delete('/conversations/:id', async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Not found' });
    if (!conv.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not a participant' });
    }
    
    await Message.deleteMany({ conversation: req.params.id });
    await Conversation.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
