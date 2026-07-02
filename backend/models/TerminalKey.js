const mongoose = require('mongoose');

// Ключи доступа к терминалу — у каждой фракции свои ключи к определённым документам
const terminalKeySchema = new mongoose.Schema({
  keyCode: { type: String, required: true, unique: true }, // Уникальный код ключа
  name: { type: String, required: true },
  ownerFraction: { type: String, required: true }, // Фракция-владелец
  accessLevel: { type: Number, default: 1 }, // К каким документам даёт доступ
  accessCategories: [{ type: String }], // Категории документов
  isCompromised: { type: Boolean, default: false }, // Украден ли ключ
  compromisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  holders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // У кого есть ключ
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TerminalKey', terminalKeySchema);
