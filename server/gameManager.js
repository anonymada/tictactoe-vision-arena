const EventEmitter = require('events');

// Simple Game Manager for a single TicTacToe game
// Responsibilities:
// - register players (X and O)
// - maintain official board
// - enforce rules (turns, occupied cells, no moves after end)
// - detect wins and draws
// - keep simple statistics (moves count, avg response time)
// - emit 'update' events when state changes

class GameManager extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    this.players = {
      X: null, // { name, socketId, connected, moves:[], responseTimes:[], lastMoveAt }
      O: null,
    };
    this.currentPlayer = 'X';
    this.winner = null; // 'X' | 'O' | 'draw' | null
    this.moveCount = 0;
    this.startTime = null;
    this.status = 'waiting'; // 'waiting'|'in_progress'|'finished'
    this.log = [];
  }

  register(name, socketId) {
    // If X empty assign X, else O if empty
    let assigned = null;
    if (!this.players.X) {
      this.players.X = { name, socketId, connected: true, moves: [], responseTimes: [], lastMoveAt: null };
      assigned = 'X';
      this._log(`Player registered: ${name} as X`);
    } else if (!this.players.O) {
      this.players.O = { name, socketId, connected: true, moves: [], responseTimes: [], lastMoveAt: null };
      assigned = 'O';
      this._log(`Player registered: ${name} as O`);
    } else {
      throw new Error('Two players already registered');
    }

    // start game when both registered
    if (this.players.X && this.players.O) {
      this.status = 'in_progress';
      this.startTime = Date.now();
      this.currentPlayer = 'X';
      this.winner = null;
      this.moveCount = 0;
      this._log('Game started');
    }

    this.emit('update', this.getState());
    return assigned;
  }

  move(player, row, col) {
    // Validate inputs
    if (!['X', 'O'].includes(player)) throw new Error('Invalid player');
    if (this.status === 'waiting') throw new Error('Game not started');
    if (this.status === 'finished') throw new Error('Game already finished');
    if (player !== this.currentPlayer) throw new Error("Not player's turn");
    if (row < 0 || row > 2 || col < 0 || col > 2) throw new Error('Invalid cell');
    if (this.board[row][col] !== null) throw new Error('Cell already occupied');

    const now = Date.now();
    const pl = this.players[player];
    if (pl) {
      if (pl.lastMoveAt) {
        const delta = now - pl.lastMoveAt;
        pl.responseTimes.push(delta);
        // keep last 100 samples
        if (pl.responseTimes.length > 100) pl.responseTimes.shift();
      }
      pl.lastMoveAt = now;
      pl.moves.push({ row, col, at: now });
    }

    this.board[row][col] = player;
    this.moveCount++;
    this._log(`Move by ${player}: (${row},${col})`);

    // check win/draw
    const result = this._checkWin();
    if (result === 'X' || result === 'O') {
      this.winner = result;
      this.status = 'finished';
      this._log(`Victory: ${result}`);
    } else if (result === 'draw') {
      this.winner = 'draw';
      this.status = 'finished';
      this._log(`Draw`);
    } else {
      // continue
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    const state = this.getState();
    this.emit('update', state);
    return state;
  }

  getPlayerInfo(p) {
    const pl = this.players[p];
    if (!pl) return { name: null, connected: false, avgResponse: null };
    const avg = pl.responseTimes.length ? Math.round(pl.responseTimes.reduce((a, b) => a + b, 0) / pl.responseTimes.length) : null;
    return { name: pl.name, connected: !!pl.connected, avgResponse: avg };
  }

  getState() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      status: this.status,
      moveCount: this.moveCount,
      timeElapsed: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
      players: {
        X: this.getPlayerInfo('X'),
        O: this.getPlayerInfo('O'),
      },
      log: this.log.slice(0, 100),
    };
  }

  unregisterBySocket(socketId) {
    // mark player disconnected if socket matches
    ['X', 'O'].forEach(p => {
      const pl = this.players[p];
      if (pl && pl.socketId === socketId) {
        pl.connected = false;
        this._log(`Player disconnected: ${pl.name} (${p})`);
      }
    });
    this.emit('update', this.getState());
  }

 _checkWin() {
    const b = this.board;
    const lines = [
      // rows
      [b[0][0], b[0][1], b[0][2]],
      [b[1][0], b[1][1], b[1][2]],
      [b[2][0], b[2][1], b[2][2]],
      // cols
      [b[0][0], b[1][0], b[2][0]],
      [b[0][1], b[1][1], b[2][1]],
      [b[0][2], b[1][2], b[2][2]],
      // diags
      [b[0][0], b[1][1], b[2][2]],
      [b[0][2], b[1][1], b[2][0]],
    ];

    for (const line of lines) {
      if (line[0] && line[0] === line[1] && line[1] === line[2]) {
        return line[0];
      }
    }
    // draw if full
    const full = this.board.every(row => row.every(cell => cell !== null));
    if (full) return 'draw';
    return null;
  }

   _log(entry) {
    const time = new Date().toISOString();
    this.log.unshift(`[${time}] ${entry}`);
    // keep last 200 entries
    if (this.log.length > 200) this.log.length = 200;
  }
}

module.exports = GameManager;
