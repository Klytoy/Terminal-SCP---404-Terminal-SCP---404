const mongoose = require('mongoose');

const CLEARANCE_EXT_ENUM = ['A', 'M', 'SI', 'I', 'T', 'O', 'H', 'P', 'ET', 'S', 'R4', 'T4', 'O5', 'КпЭ', 'АпАИБ', 'СО', 'МТФ', 'НРП', 'ФФ'];
const PERSONNEL_STATUS_ENUM = ['active', 'inactive', 'kia', 'mia', 'suspended', 'archived', 'classified', 'fake', 'vacation'];

const personnelNoteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['violation', 'commendation', 'note', 'warning'], required: true },
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const fakeIdentitySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    fakeFraction: String,
    fakePosition: String,
    fakeFio: String,
    fakeCallsign: String,
    fakeEmployeeId: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    login: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fio: { type: String, required: true },
    callsign: { type: String },
    fraction: { type: String },
    position: { type: String },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },

    clearanceLevel: { type: Number, min: 0, max: 6, default: 0 },
    clearanceExtensions: [{ type: String, enum: CLEARANCE_EXT_ENUM }],

    fakeIdentity: { type: fakeIdentitySchema, default: () => ({}) },
    infiltratedFraction: { type: String, default: null }, // легенда внедрения СО

    isTwin: { type: Boolean, default: false },
    parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isFactionLeader: { type: Boolean, default: false },

    personnelNotes: [personnelNoteSchema],

    balance: { type: Number, default: 0 },
    terminalKey: { type: mongoose.Schema.Types.ObjectId, ref: 'TerminalKey', default: null },

    personnelStatus: { type: String, enum: PERSONNEL_STATUS_ENUM, default: 'active' },
    vacationUntil: { type: Date, default: null },

    employeeId: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.CLEARANCE_EXT_ENUM = CLEARANCE_EXT_ENUM;
module.exports.PERSONNEL_STATUS_ENUM = PERSONNEL_STATUS_ENUM;
