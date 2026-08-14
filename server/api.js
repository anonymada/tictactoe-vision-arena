const express = require('express');
const router = express.Router();

// Expects a GameManager instance to be passed in when mounting
// Mount in server.js with: app.use('/', api(gameManager, io))

module.exports = function api(gameManager, io) {
  // register
  router.post('/register', (req, res) => {
    try {
      const { name, socketId } = req.body;
      if (!name) return res.status(400).json({ error: 'Missing name' });
      const player = gameManager.register(name, socketId || null);
      const state = gameManager.getState();
      // broadcast
      if (io) io.emit('state', state);
      return res.json({ player });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  // move
  router.post('/move', (req, res) => {
    try {
      const { player, row, col } = req.body;
      if (typeof player === 'undefined' || typeof row === 'undefined' || typeof col === 'undefined') {
        return res.status(400).json({ error: 'Missing fields' });
      }
      const state = gameManager.move(player, Number(row), Number(col));
      if (io) io.emit('state', state);
      return res.json({ success: true, board: state.board, nextPlayer: state.currentPlayer, winner: state.winner });
    } catch (err) {
      // log and broadcast error as part of log
      gameManager._log && typeof gameManager._log === 'function' && gameManager._log(`Error: ${err.message}`);
      const state = gameManager.getState();
      if (io) io.emit('state', state);
      return res.status(400).json({ success: false, error: err.message, board: state.board, nextPlayer: state.currentPlayer, winner: state.winner });
    }
  });

  // state
  router.get('/state', (req, res) => {
    return res.json(gameManager.getState());
  });

  // reset
  router.post('/reset', (req, res) => {
    try {
      gameManager.reset();
      const state = gameManager.getState();
      gameManager._log && typeof gameManager._log === 'function' && gameManager._log('Game reset via API');
      if (io) io.emit('state', state);
      return res.json({ success: true, state });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
