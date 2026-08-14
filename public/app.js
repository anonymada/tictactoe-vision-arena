// Client-side code for the monitoring UI
// Connects to Socket.IO and updates the page when server broadcasts state

const socket = io();

const el = (id) => document.getElementById(id);
const boardEl = el('board');
const logList = el('logList');

// build 3x3 grid
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = r;
    cell.dataset.col = c;
    cell.id = `cell-${r}-${c}`;
    boardEl.appendChild(cell);
  }
}

// add fixed grid lines for a clearer printed board
const gridLines = [
  { className: 'grid-line vertical line-1' },
  { className: 'grid-line vertical line-2' },
  { className: 'grid-line horizontal line-1' },
  { className: 'grid-line horizontal line-2' },
];
for (const line of gridLines) {
  const elLine = document.createElement('div');
  elLine.className = line.className;
  boardEl.appendChild(elLine);
}

function renderState(state) {
  // players
  el('nameX').textContent = state.players.X.name || '-';
  el('statusX').textContent = state.players.X.connected ? 'Connecté' : 'Déconnecté';
  el('avgX').textContent = state.players.X.avgResponse !== null ? state.players.X.avgResponse + ' ms' : '— ms';

  el('nameO').textContent = state.players.O.name || '-';
  el('statusO').textContent = state.players.O.connected ? 'Connecté' : 'Déconnecté';
  el('avgO').textContent = state.players.O.avgResponse !== null ? state.players.O.avgResponse + ' ms' : '— ms';

  // board cells
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = state.board[r][c];
      const cell = el(`cell-${r}-${c}`);
      if (cell) {
        cell.textContent = val || '';
      }
    }
  }

  // small flash animation for the last move: detect by comparing moveCount and presence of last log entry containing "Move by"
  const last = state.log[0] || '';
  if (last && last.includes('Move by')) {
    // parse coordinates e.g. Move by X: (1,2)
    const m = last.match(/\((\d),(\d)\)/);
    if (m) {
      const rr = m[1], cc = m[2];
      const cell = el(`cell-${rr}-${cc}`);
      if (cell) {
        cell.classList.add('flash');
        setTimeout(() => cell.classList.remove('flash'), 350);
      }
    }
  }

  el('currentPlayer').textContent = state.currentPlayer || '-';
  el('moveCount').textContent = state.moveCount;
  el('timeElapsed').textContent = state.timeElapsed + 's';
  const statusText = state.status === 'waiting' ? 'En attente' : state.status === 'in_progress' ? 'En cours' : state.winner === 'draw' ? 'Match nul' : `Victoire ${state.winner}`;
  el('gameStatus').textContent = statusText;

  // log
  logList.innerHTML = '';
  (state.log || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    logList.appendChild(li);
  });
}

// receive updates
socket.on('state', (state) => {
  renderState(state);
});

// initial fetch as fallback
fetch('/state').then(r => r.json()).then(s => renderState(s)).catch(()=>{});

// reset button handler
const resetBtn = el('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    resetBtn.disabled = true;
    try {
      const r = await fetch('/reset', { method: 'POST' });
      const j = await r.json();
      // server will broadcast new state via websocket, but update immediately if provided
      if (j && j.state) renderState(j.state);
    } catch (e) {
      console.error('Reset failed', e);
      alert('Erreur lors de la réinitialisation');
    } finally {
      resetBtn.disabled = false;
    }
  });
}
