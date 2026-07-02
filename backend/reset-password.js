// Запусти этот скрипт в папке backend:
// node reset-password.js
// Он сбросит пароль пользователя Empa1r на: NewPass123!

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'ВСТАВЬ_СЮДА_MONGO_URI';
const USERNAME = 'Empa1r'; // твой логин
const NEW_PASSWORD = 'NewPass123!'; // новый пароль

async function reset() {
  await mongoose.connect(MONGO_URI);
  const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { username: USERNAME },
    { $set: { password: hashed } }
  );
  if (result.modifiedCount > 0) {
    console.log(`✓ Пароль для "${USERNAME}" изменён на: ${NEW_PASSWORD}`);
  } else {
    console.log(`✗ Пользователь "${USERNAME}" не найден`);
  }
  await mongoose.disconnect();
}

reset().catch(console.error);
