require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/twins', require('./routes/twins'));
app.use('/api/scp', require('./routes/scp'));
app.use('/api/factions', require('./routes/factions'));
app.use('/api/wanted', require('./routes/wanted'));
app.use('/api/linked-orgs', require('./routes/linkedorgs'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/personnel', require('./routes/personnel'));
app.use('/api/blackmarket', require('./routes/blackmarket'));
app.use('/api/terminal', require('./routes/terminal'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '4.0' }));

require('./controllers/socketController').socketHandler(io);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scp_portal')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
