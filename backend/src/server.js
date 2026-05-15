/**
 * ============================================
 * STSMS — Server Entry Point with Socket.IO
 * ============================================
 * Connects to MongoDB, attaches WebSocket engine, then starts HTTP server.
 */

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { PORT, NODE_ENV, CLIENT_URL } = require('./config/env');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Create HTTP server wrapping Express
const httpServer = http.createServer(app);

// Initialize WebSockets
const io = initSocket(httpServer, CLIENT_URL);
app.set('io', io);

// Connect to database, then start listening
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\n🚦 STSMS Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Auth API:     http://localhost:${PORT}/api/auth`);
    console.log(`   WebSockets:   ws://localhost:${PORT} [Socket.IO Ready]\n`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION 💥 Shutting down...');
    console.error(err.name, err.message);
    httpServer.close(() => process.exit(1));
  });
});
