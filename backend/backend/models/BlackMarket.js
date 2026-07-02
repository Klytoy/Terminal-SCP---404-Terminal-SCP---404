const mongoose = require('mongoose');

const blackMarketSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerCallsign: { type: String },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['info', 'access', 'item', 'service', 'key', 'other'], default: 'other' },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['active', 'sold', 'cancelled'], default: 'active' },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  buyerCallsign: { type: String, default: '' },
  // Минимальный УД для просмотра лота
  minClearance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  soldAt: { type: Date }
});

module.exports = mongoose.model('BlackMarket', blackMarketSchema);
