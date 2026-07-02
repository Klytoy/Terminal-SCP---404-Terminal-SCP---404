const mongoose = require('mongoose');

const blackMarketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['info', 'access', 'item', 'service', 'key', 'other'], required: true },
    price: { type: Number, required: true, min: 0 },
    minClearance: { type: Number, min: 0, max: 6, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerCallsign: { type: String },
    anonymous: { type: Boolean, default: false },
    linkedKey: { type: mongoose.Schema.Types.ObjectId, ref: 'TerminalKey', default: null }, // для category: 'key'
    status: { type: String, enum: ['active', 'sold', 'withdrawn'], default: 'active' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    soldAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlackMarket', blackMarketSchema);
