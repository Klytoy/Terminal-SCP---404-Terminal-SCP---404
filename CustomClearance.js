const mongoose = require('mongoose');

const balanceLogSchema = new mongoose.Schema(
  {
    amount: Number,
    reason: String,
    byUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const factionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['combat', 'civilian'], required: true },
    leader: { type: String, default: '' },
    minClearanceLevel: { type: Number, min: 0, max: 6, default: 0 },
    color: { type: String, default: '#00e639' },

    callsignPrefix: { type: String, default: '' },
    specialization: {
      type: String,
      enum: ['штурм', 'зачистка аномалий', 'эскорт', 'разведка', 'логистика', 'администрирование', 'иное'],
      default: 'иное',
    },
    status: { type: String, enum: ['active', 'disbanded', 'classified'], default: 'active' },

    balance: { type: Number, default: 0 },
    balanceLog: [balanceLogSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faction', factionSchema);
