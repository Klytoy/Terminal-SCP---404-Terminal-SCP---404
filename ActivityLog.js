const mongoose = require('mongoose');
const { PERSONNEL_STATUS_ENUM } = require('./User');

const noteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['violation', 'commendation', 'note', 'warning'], required: true },
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const personnelRecordSchema = new mongoose.Schema(
  {
    linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fio: { type: String, required: true },
    callsign: String,
    fraction: String,
    position: String,
    employeeId: String,
    clearanceLevel: { type: Number, min: 0, max: 6, default: 0 },
    personnelStatus: { type: String, enum: PERSONNEL_STATUS_ENUM, default: 'active' },
    vacationUntil: { type: Date, default: null },
    notes: [noteSchema],
    minClearanceToView: { type: Number, min: 0, max: 6, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PersonnelRecord', personnelRecordSchema);
