const mongoose = require('mongoose');

const factionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['combat', 'civilian'], default: 'civilian' },
  leader: { type: String, default: '' },
  membersCount: { type: Number, default: 0 },
  logo: { type: String, default: '' },
  minClearanceLevel: { type: Number, default: 0 },
  color: { type: String, default: '#00b4d8' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Faction', factionSchema);
