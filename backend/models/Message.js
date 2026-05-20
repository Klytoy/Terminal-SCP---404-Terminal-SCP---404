const mongoose = require('mongoose');

// Individual message
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Conversation (DM or Group)
const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['dm', 'group'], required: true },
  name: { type: String }, // for groups
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // group admins
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isBlocked: { type: Boolean, default: false }, // superadmin can block
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Message: mongoose.model('Message', messageSchema),
  Conversation: mongoose.model('Conversation', conversationSchema)
};
