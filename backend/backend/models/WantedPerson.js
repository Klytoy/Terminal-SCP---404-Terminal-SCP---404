const mongoose = require('mongoose');

const wantedPersonSchema = new mongoose.Schema({
  fio: { type: String, required: true },
  alias: { type: String, default: '' },
  photo: { type: String, default: '' },
  description: { type: String, default: '' },
  crimes: { type: String, default: '' },
  article: { type: String, default: '' },
  dangerLevel: { type: String, enum: ['low', 'medium', 'high', 'extreme'], default: 'medium' },
  status: { type: String, enum: ['active', 'captured', 'eliminated', 'closed'], default: 'active' },
  reward: { type: String, default: '' },
  minClearanceLevel: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WantedPerson', wantedPersonSchema);
