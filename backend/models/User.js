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
    enum: ['A', 'M', 'SI', 'I', 'T', 'O', 'H', 'P', 'ET', 'S', 'R4', 'T4', 'O5']
  }],

  employeeId: { type: String, unique: true, sparse: true },

  // Account status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'banned'], 
    default: 'pending' 
  },

  // Personnel record status (отдельно от аккаунта)
  personnelStatus: {
    type: String,
    enum: ['active', 'inactive', 'kia', 'mia', 'suspended', 'archived'],
    default: 'active'
  },

  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'user'], 
    default: 'user' 
  },

  // Biography / notes
  biography: { type: String, default: '' },
  photo: { type: String, default: '' },

  parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isTwin: { type: Boolean, default: false },
  suggestion: { type: String, default: '' },

  serviceIds: [{
    service: String,
    idNumber: String,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now }
  }],

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
