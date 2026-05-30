const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  objectType: { 
    type: String, 
    enum: ['scp', 'faction', 'document', 'personnel', 'user', 'system', 'wanted', 'org', 'request'],
    default: 'system'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
