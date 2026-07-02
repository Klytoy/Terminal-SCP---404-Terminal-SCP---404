const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    category: { type: String, default: 'general' },
    minClearance: { type: Number, min: 0, max: 6, default: 0 },
    requiredExtension: { type: String, default: null }, // напр. 'НРП'
    fraction: { type: String, default: null },
    objectClass: { type: String, enum: ['SAFE', 'EUCLID', 'KETER', 'THAUMIEL', 'NEUTRALIZED', 'APOLLYON', null], default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
