const mongoose = require('mongoose');

const wantedPersonSchema = new mongoose.Schema(
  {
    fio: { type: String, required: true },
    aliases: [{ type: String }],
    description: { type: String, default: '' },
    dangerLevel: { type: String, enum: ['низкий', 'средний', 'высокий', 'критический'], default: 'средний' },
    lastSeen: { type: String, default: '' },
    status: { type: String, enum: ['в розыске', 'задержан', 'нейтрализован', 'закрыто'], default: 'в розыске' },
    relatedFraction: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    nrpVisibility: { type: Boolean, default: false }, // отдельная видимость для НРП
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WantedPerson', wantedPersonSchema);
