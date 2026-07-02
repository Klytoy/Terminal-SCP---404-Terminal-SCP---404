const mongoose = require('mongoose');

// Кастомные УД — суперадмин создаёт свои уровни допуска
const customClearanceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Название УД
  code: { type: String, required: true, unique: true }, // Короткий код, напр. "ALPHA-1"
  level: { type: Number, required: true }, // Базовый числовой уровень (0-6)
  extensions: [{ type: String }], // Расширения A, M, O5 и т.д.
  color: { type: String, default: '#FFD700' }, // Цвет бейджа
  description: { type: String, default: '' },
  // Права доступа
  permissions: {
    canViewDocuments: { type: Boolean, default: true },
    canCreateDocuments: { type: Boolean, default: false },
    canViewSCP: { type: Boolean, default: true },
    canEditSCP: { type: Boolean, default: false },
    canViewPersonnel: { type: Boolean, default: true },
    canEditPersonnel: { type: Boolean, default: false },
    canViewFactions: { type: Boolean, default: true },
    canManageChat: { type: Boolean, default: false },
    maxDocumentLevel: { type: Number, default: 2 }, // Макс УД документов которые видит
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomClearance', customClearanceSchema);
