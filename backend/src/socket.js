/**
 * ============================================
 * STSMS — Real-Time WebSocket Server (Socket.IO)
 * ============================================
 * Provides pub-sub event broadcasting for live traffic telemetry:
 *   - 'incident:new' & 'incident:updated'
 *   - 'violation:new'
 *   - 'traffic:update'
 *   - 'signal:phase_change'
 */

const { Server } = require('socket.io');

let io = null;

/**
 * Initializes Socket.IO with the HTTP server instance
 * @param {import('http').Server} httpServer
 * @param {string} clientUrl
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer, clientUrl = 'http://localhost:5173') {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 WebSocket Client connected: ${socket.id}`);

    // Join specific surveillance room (e.g. 'downtown', 'highway-101')
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`📡 Socket ${socket.id} joined channel: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', (reason) => {
      console.log(`⚡ WebSocket Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get active Socket.IO server instance
 * @returns {import('socket.io').Server | null}
 */
function getIO() {
  return io;
}

/**
 * Helper to safely broadcast events to all connected clients or specific rooms
 * @param {string} event - Event name
 * @param {any} data - Payload data
 * @param {string} [room] - Optional room name
 */
function broadcastEvent(event, data, room = null) {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  broadcastEvent,
};
