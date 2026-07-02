require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../db');
const User = require('../models/User');
const seedFactions = require('./factions');

async function run() {
  await connectDB();
  await seedFactions();

  const existing = await User.findOne({ login: 'o5-1' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('changeme123', 10);
    await User.create({
      login: 'o5-1',
      passwordHash,
      fio: 'Совет O5 — Место №1',
      callsign: 'O5-1',
      fraction: 'Совет O5',
      position: 'Член Совета O5',
      role: 'superadmin',
      clearanceLevel: 6,
      clearanceExtensions: ['O5', 'АпАИБ'],
      employeeId: 'SITE81-000001',
    });
    console.log('[SEED] Создан суперадмин: login=o5-1 password=changeme123 (СМЕНИТЕ ПАРОЛЬ)');
  }

  console.log('[SEED] Готово.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[SEED] Ошибка:', err);
  process.exit(1);
});
