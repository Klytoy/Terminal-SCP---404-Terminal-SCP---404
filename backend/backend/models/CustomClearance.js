const mongoose = require('mongoose');

// Кастомный УД — суперадмин создаёт свои уровни с настраиваемыми правами
const customClearanceSchema = new mongoose.Schema({
  name: { type: String, required: true },         // Название, напр. "Альфа-1 Красная Рука"
  code: { type: String, required: true },          // Код, напр. "A1-RRH"
  description: { type: String, default: '' },
  baseLevel: { type: Number, default: 0, min: 0, max: 6 }, // Базовый уровень УД
  extensions: [{ type: String }],                  // Расширения которые идут с этим УД
  color: { type: String, default: '#00b4d8' },

  // Права доступа
  permissions: {
    canViewPersonnel: { type: Boolean, default: true },
    canViewSCP: { type: Boolean, default: true },
    canViewDocuments: { type: Boolean, default: true },
    canViewFactions: { type: Boolean, default: true },
    canViewWanted: { type: Boolean, default: true },
    canViewLinkedOrgs: { type: Boolean, default: false },
    canSendMessages: { type: Boolean, default: true },
    canCreateRequests: { type: Boolean, default: true },
    maxViewableClearance: { type: Number, default: 0 }, // макс УД который видит
  },

  // Кому назначен
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomClearance', customClearanceSchema);
