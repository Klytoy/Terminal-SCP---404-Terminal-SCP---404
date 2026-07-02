const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  discordNick: { type: String, required: true },
  fio: { type: String, required: true },
  callsign: { type: String, required: true },
  fraction: { type: String, required: true },
  fractionType: { type: String, enum: ['civilian', 'combat'], default: 'civilian' },
  position: { type: String, required: true },
  clearanceLevel: { type: Number, default: 0, min: 0, max: 6 },
  clearanceExtensions: [{
    type: String,
    enum: ['A', 'M', 'SI', 'I', 'T', 'O', 'H', 'P', 'ET', 'S', 'R4', 'T4', 'O5',
           'КпЭ', 'АпАИБ', 'СО', 'МТФ', 'НРП', 'ФФ']
  }],
  employeeId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'banned'], default: 'pending' },
  personnelStatus: {
    type: String,
    enum: ['active', 'inactive', 'kia', 'mia', 'suspended', 'archived', 'classified', 'fake'],
    default: 'active'
  },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  biography: { type: String, default: '' },
  photo: { type: String, default: '' },
  parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isTwin: { type: Boolean, default: false },
  // Фальшивое удостоверение — отображается при проверке вместо реальной фракции
  fakeIdentity: {
    enabled: { type: Boolean, default: false },
    fakeFraction: { type: String, default: '' },
    fakePosition: { type: String, default: '' },
    fakeFio: { type: String, default: '' },
    fakeCallsign: { type: String, default: '' },
    fakeEmployeeId: { type: String, default: '' }
  },
  suggestion: { type: String, default: '' },
  serviceIds: [{
    service: String,
    idNumber: String,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now }
  }],
  // Личные дела — нарушения и пометки
  personnelNotes: [{
    type: { type: String, enum: ['violation', 'commendation', 'note', 'warning'], default: 'note' },
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  // Баланс (внутренняя валюта)
  balance: { type: Number, default: 0 },
  // Ключ доступа к терминалу (для системы терминала)
  terminalKey: { type: String, default: '' },
  mutedConversations: [{ type: mongoose.Schema.Types.ObjectId }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
