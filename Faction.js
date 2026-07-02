const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['twin_account', 'clearance_change', 'vacation', 'fake_identity', 'other'], required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewComment: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
