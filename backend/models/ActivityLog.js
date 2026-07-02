const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userCallsign: String,
    action: { type: String, required: true },
    objectType: {
      type: String,
      enum: ['user', 'faction', 'terminalKey', 'document', 'blackmarket', 'request', 'clearance', 'personnelRecord', 'wanted', 'other'],
      default: 'other',
    },
    objectId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ objectType: 1 });
activityLogSchema.index({ at: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
