require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const docRoutes = require('./routes/documents');
const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');
const twinRoutes = require('./routes/twins');
const scpRoutes = require('./routes/scp');
const factionsRoutes = require('./routes/factions');
const wantedRoutes = require('./routes/wanted');
const linkedOrgsRoutes = require('./routes/linkedorgs');
const logsRoutes = require('./routes/logs');
const personnelRoutes = require('./routes/personnel');

const { socketHandler } = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/twins', twinRoutes);
app.use('/api/scp', scpRoutes);
app.use('/api/factions', factionsRoutes);
app.use('/api/wanted', wantedRoutes);
app.use('/api/linked-orgs', linkedOrgsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/personnel', personnelRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '3.0' }));

socketHandler(io);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scp_portal')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
