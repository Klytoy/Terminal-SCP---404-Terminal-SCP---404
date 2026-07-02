const mongoose = require('mongoose');

const permissionsSchema = new mongoose.Schema(
  {
    canViewTerminalKeys: { type: Boolean, default: false },
    canViewViolations: { type: Boolean, default: false },
    canManageFactionBalance: { type: Boolean, default: false },
    canIssueFakeIdentity: { type: Boolean, default: false },
  },
  { _id: false }
);

const customClearanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    grantedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    permissions: { type: permissionsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomClearance', customClearanceSchema);
