const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String }, // 'access' | 'steal' | 'revoke' | 'created'
    at: { type: Date, default: Date.now },
    details: String,
  },
  { _id: false }
);

const terminalKeySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    ownerFraction: { type: String, required: true },
    holders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isCompromised: { type: Boolean, default: false },
    stolenAt: { type: Date, default: null },
    stolenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    usageLog: [usageLogSchema],
    accessibleDocumentCategories: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TerminalKey', terminalKeySchema);
