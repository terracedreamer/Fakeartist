require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const validateEnv = require('./config/env');
const logger = require('./utils/logger');
const healthRoutes = require('./routes/health');
const entitlementRoutes = require('./routes/entitlement');
const registerGameSocket = require('./sockets/gameSocket');

validateEnv();

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: clientUrl }));
app.use(helmet());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use('/', healthRoutes);
app.use('/api', entitlementRoutes);

registerGameSocket(io);

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Client URL: ${clientUrl}`);
  });
};

start();
