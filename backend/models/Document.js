const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['scp', 'documentation', 'order', 'protocol', 'other'],
    default: 'other'
  },
  subcategory: { type: String, default: '' },
  
  // Access control
  minClearanceLevel: { type: Number, default: 0, min: 0, max: 6 },
  requiredExtensions: [{ type: String }], // must have these extensions
  allowedFractions: [{ type: String }],   // empty = all fractions
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  isArchived: { type: Boolean, default: false },
  tags: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
