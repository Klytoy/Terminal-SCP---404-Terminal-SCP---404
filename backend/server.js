require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', site: 'SITE-81 // TERMINAL_CORE' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/personnel-records', require('./routes/personnelRecords'));
app.use('/api/personnel', require('./routes/personnel'));
app.use('/api/twins', require('./routes/twins'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/terminal', require('./routes/terminal'));
app.use('/api/factions', require('./routes/factions'));
app.use('/api/blackmarket', require('./routes/blackmarket'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/wanted', require('./routes/wanted'));
app.use('/api/clearance', require('./routes/clearance'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Маршрут не найден' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', details: err.message });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[SITE-81] Терминал запущен на порту ${PORT}`));
  })
  .catch((err) => {
    console.error('[DB] Ошибка подключения:', err.message);
    process.exit(1);
  });

module.exports = app;
