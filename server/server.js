/*
  Server entrypoint
  - HTTP Express server (HTTPS optional)
  - Mounts REST API
  - Serves public/ static UI
  - Socket.IO for realtime updates

  Note: This server intentionally contains NO vision or AI logic.
  Smartphones are expected to POST /register and /move only.
*/

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const GameManager = require('./gameManager');
const hostDetector = require('./hostDetector');
const documentationRouter = require("../docs/docs");
let detectedHostUrl = null;
try { detectedHostUrl = hostDetector.getHostUrl(); } catch (e) { detectedHostUrl = null; }

const app = express();
app.use(express.json());

// CORS: allow any origin (per requirement)
// This middleware sets permissive CORS headers. It intentionally allows any origin,
// and responds to OPTIONS preflight requests for browsers.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  // Optional: allow credentials if needed (not used here)
  // res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    // Preflight request
    return res.sendStatus(204);
  }
  next();
});

// static UI
app.use(express.static(path.join(__dirname, '..', 'public')));

// create HTTP server (simple, for local development)
let server = http.createServer(app);
console.log('HTTP server configured (no HTTPS)');

// Note: browser camera access (getUserMedia) requires HTTPS in production.
// For local testing, use the browser's "Allow insecure localhost" option or
// run the server with HTTPS and valid certs if needed.

// Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// game manager
const gm = new GameManager();

// detect CLI flags
const useWebnative = process.argv.includes('--webnative');
if (useWebnative) {
  console.log('Launching server with --webnative flag: webnative plugin mode enabled');
  gm._log && typeof gm._log === 'function' && gm._log('Server started in webnative plugin mode');
}

// Mount API with access to gm and io
const apiRouter = require('./api')(gm, io);
app.use('/', apiRouter);

// Host discovery endpoint (no QR): returns simple host URL that clients can use to connect
app.get('/host', (req, res) => {
  try {
    const url = detectedHostUrl || hostDetector.getHostUrl();
    return res.json({ server: url });
  } catch (e) {
    return res.json({ server: `http://localhost:${process.env.PORT || 3000}` });
  }
});

// Documentation
app.use("/docs", documentationRouter);

// Socket connections for UI (monitor) and optionally to link smartphone websockets
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // send current state immediately
  socket.emit('state', gm.getState());

  // handle optional client messages to mark a socket as associated with a player
  socket.on('registerSocket', (data) => {
    // data: { player: 'X'|'O' }
    if (!data || !data.player) return;
    const p = data.player;
    if (gm.players[p]) {
      gm.players[p].socketId = socket.id;
      gm.players[p].connected = true;
      gm._log && gm._log(`Socket associated: ${gm.players[p].name} -> ${socket.id}`);
      io.emit('state', gm.getState());
    }
  });

  socket.on('disconnect', () => {
    // mark player disconnected if needed
    gm.unregisterBySocket(socket.id);
    io.emit('state', gm.getState());
  });
});

// forward gm updates to sockets
gm.on('update', (state) => {
  io.emit('state', state);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TicTacToe Vision Arena server running on http://localhost:${PORT}`);
});


