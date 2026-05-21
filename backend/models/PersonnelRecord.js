const mongoose = require('mongoose');

// Отдельная запись персонала — может быть не связана с аккаунтом
const personnelRecordSchema = new mongoose.Schema({
  // Link to user account (optional)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  fio: { type: String, required: true },
  callsign: { type: String, required: true },
  position: { type: String, default: '' },
  fraction: { type: String, default: '' },
  fractionType: { type: String, enum: ['civilian', 'combat', 'general'], default: 'general' },
  
  clearanceLevel: { type: Number, default: 0, min: 0, max: 6 },
  clearanceExtensions: [{ type: String }],
  employeeId: { type: String, default: '' },
  discordNick: { type: String, default: '' },
  
  // Personnel status
  personnelStatus: {
    type: String,
    enum: ['active', 'inactive', 'kia', 'mia', 'suspended', 'archived', 'classified', 'fake'],
    default: 'active'
  },
  
  biography: { type: String, default: '' },
  photo: { type: String, default: '' },
  
  // Service IDs
  serviceIds: [{
    service: String,
    idNumber: String,
  }],
  
  // Visibility
  minClearanceToView: { type: Number, default: 0 },
  isClassified: { type: Boolean, default: false },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PersonnelRecord', personnelRecordSchema);
