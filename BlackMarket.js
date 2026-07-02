const mongoose = require('mongoose');

const linkedOrgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, default: 'GOI' }, // group of interest
    relation: { type: String, enum: ['враждебная', 'нейтральная', 'союзная', 'неизвестна'], default: 'неизвестна' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LinkedOrg', linkedOrgSchema);
