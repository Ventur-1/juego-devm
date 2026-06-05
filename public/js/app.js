// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  role: null,       // 'caller' | 'player'
  myId: null,
  myName: null,
  myGrid: [],       // array of card objects {id, name, emoji, desc}
  markedCells: new Array(9).fill(false),
  calledCards: [],  // array of card objects
  currentCard: null,
  players: [],
  round: 1,
  gameStatus: 'waiting'
};

// ─── SOCKET ───────────────────────────────────────────────────────────────────
const socket = io();

// ─── DOM HELPERS ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const show = el => { if (el) el.classList.remove('hidden'); };
const hide = el => { if (el) el.classList.add('hidden'); };

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  const v = $(viewId);
  if (v) {
    v.classList.remove('hidden');
    v.classList.add('active');
  }
}

function showError(elId, msg) {
  const el = $(elId);
  if (!el) return;
  el.textContent = msg;
  show(el);
  setTimeout(() => hide(el), 4000);
}

function setConnectionStatus(status) {
  const badge = $('connection-status');
  if (!badge) return;
  badge.className = `connection-badge ${status}`;
  const text = { connected: 'Conectado', connecting: 'Conectando...', disconnected: 'Desconectado' };
  badge.querySelector('.conn-text').textContent = text[status] || status;
}

// ─── WELCOME BUTTONS ──────────────────────────────────────────────────────────
$('btn-be-caller').addEventListener('click', () => {
  state.role = 'caller';
  socket.emit('join_as_caller');
});

$('btn-be-player').addEventListener('click', () => {
  showView('view-player-setup');
  setTimeout(() => $('input-player-name').focus(), 100);
});

$('btn-back-welcome').addEventListener('click', () => showView('view-welcome'));

$('btn-join-game').addEventListener('click', joinAsPlayer);

$('input-player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinAsPlayer();
});

function joinAsPlayer() {
  const name = $('input-player-name').value.trim();
  if (!name) {
    showError('join-error', 'Escribe tu nombre, crack');
    return;
  }
  state.role = 'player';
  state.myName = name;
  socket.emit('join_as_player', { name });
}

// ─── SOCKET EVENTS: CALLER ────────────────────────────────────────────────────
socket.on('caller_confirmed', ({ players, round, calledCards, currentCard }) => {
  state.players = players || [];
  state.round = round || 1;
  state.calledCards = calledCards || [];
  state.currentCard = currentCard;
  showView('view-caller');
  renderCallerPlayers();
  renderCalledCardsCaller();
  if (currentCard) updateCallerCurrentCard(currentCard);
  $('caller-round-num').textContent = state.round;
  $('caller-card-count').textContent = `${state.calledCards.length} / 54`;
});

$('btn-draw-card').addEventListener('click', () => {
  socket.emit('draw_card');
});

socket.on('card_called', ({ card, calledCards }) => {
  state.currentCard = card;
  state.calledCards = calledCards;
  $('caller-card-count').textContent = `${calledCards.length} / 54`;

  if (state.role === 'caller') {
    updateCallerCurrentCard(card);
    renderCalledCardsCaller();
    $('caller-status').textContent = `"${card.name}" — ¡${getRandomGrito(card)}!`;
  }

  if (state.role === 'player') {
    updatePlayerCurrentCall(card);
    addToPlayerHistory(card);
    checkAutoHighlight(card.id);
  }
});

function updateCallerCurrentCard(card) {
  const emojiEl = $('caller-current-emoji');
  const nameEl  = $('caller-current-name');
  const descEl  = $('caller-current-desc');

  emojiEl.textContent = card.emoji;
  nameEl.textContent  = card.name;
  descEl.textContent  = card.desc || '';

  // Force reflow to re-trigger CSS animations
  [emojiEl, nameEl].forEach(el => {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = null;
  });
}

function renderCallerPlayers() {
  const list = $('caller-players-list');
  list.innerHTML = '';
  if (state.players.length === 0) {
    list.innerHTML = '<li class="no-players">Esperando jugadores...</li>';
    return;
  }
  state.players.forEach(p => {
    const li = document.createElement('li');
    li.className = `caller-player-item${p.hasWon ? ' won' : ''}`;
    li.dataset.pid = p.id;
    li.innerHTML = `<span class="p-icon">${p.hasWon ? '👑' : '🎴'}</span><span>${p.name}</span>`;
    list.appendChild(li);
  });
}

function renderCalledCardsCaller() {
  const grid = $('caller-called-cards');
  grid.innerHTML = '';
  state.calledCards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'called-mini';
    div.title = card.name;
    div.innerHTML = `<span class="mini-emoji">${card.emoji}</span><span class="mini-name">${card.name}</span>`;
    grid.prepend(div);
  });
}

function getRandomGrito(card) {
  const gritos = [
    `¡El mero ${card.name}!`,
    `¡Ahí viene ${card.name}!`,
    `¡No la amuebles, ${card.name}!`,
    `¡Órale, ${card.name}!`,
    `¡Ándale, ${card.name}!`,
    `¡Aquí va ${card.name}!`,
    `¡Sin querer queriendo, ${card.name}!`,
    `¡Pa' los que no han salido: ${card.name}!`,
  ];
  return gritos[Math.floor(Math.random() * gritos.length)];
}

// ─── SOCKET EVENTS: PLAYER ────────────────────────────────────────────────────
socket.on('player_confirmed', ({ id, name, grid, players, round, calledCards, currentCard }) => {
  state.myId   = id;
  state.myName = name;
  state.myGrid = grid;
  state.markedCells = new Array(9).fill(false);
  state.players = players || [];
  state.round = round || 1;
  state.calledCards = calledCards || [];
  state.currentCard = currentCard;

  showView('view-player');
  $('player-name-display').textContent = name;
  $('player-round-num').textContent = round;
  renderPlayerGrid();

  if (currentCard) updatePlayerCurrentCall(currentCard);
  calledCards.forEach(c => addToPlayerHistory(c));
});

function renderPlayerGrid() {
  const grid = $('player-grid');
  grid.innerHTML = '';
  state.markedCells = new Array(9).fill(false);

  state.myGrid.forEach((card, idx) => {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.index = idx;
    cell.innerHTML = `
      <span class="cell-emoji">${card.emoji}</span>
      <span class="cell-name">${card.name}</span>
      <div class="cell-ficha">
        <div class="ficha-coin">⭐</div>
      </div>
    `;
    cell.addEventListener('click', () => onCellClick(idx, cell));
    grid.appendChild(cell);
  });
}

function onCellClick(idx, cell) {
  if (state.markedCells[idx]) return;
  const cardId = state.myGrid[idx].id;
  const isCalled = state.calledCards.some(c => c.id === cardId);
  if (!isCalled) {
    cell.style.animation = 'errorShake 0.3s ease both';
    setTimeout(() => cell.style.animation = '', 400);
    return;
  }
  state.markedCells[idx] = true;
  cell.classList.add('marked');
  socket.emit('sync_marked', { markedCells: state.markedCells });
  checkLoteria();
}

function checkAutoHighlight(calledCardId) {
  const idx = state.myGrid.findIndex(c => c.id === calledCardId);
  if (idx !== -1) {
    const cells = document.querySelectorAll('.grid-cell');
    const cell = cells[idx];
    if (cell && !state.markedCells[idx]) {
      cell.style.boxShadow = '0 0 20px rgba(255,209,102,0.6)';
      cell.style.borderColor = 'rgba(255,209,102,0.8)';
    }
  }
}

function checkLoteria() {
  const markedCount = state.markedCells.filter(Boolean).length;
  const allMarked = markedCount === 9;
  
  if (allMarked) {
    show($('btn-loteria'));
    showToast('🎉 ¡Tienes todas las fichas! ¡Grita LOTERÍA!', 'info');
  } else if (markedCount > 0 && markedCount % 3 === 0 && markedCount < 9) {
    const msgs = ['¡Vas muy bien!', '¡A la mitad!', '¡Solo 3 faltan!'];
    showToast(`✦ ${markedCount}/9 fichas — ${msgs[markedCount/3 - 1] || ''}`, 'info');
  }
}

$('btn-loteria').addEventListener('click', () => {
  const allMarked = state.markedCells.every(Boolean);
  if (allMarked) {
    socket.emit('claim_loteria', { markedCells: state.markedCells });
  }
});

socket.on('loteria_invalid', ({ message }) => {
  showToast(`⚠️ ${message}`, 'error');
});

function updatePlayerCurrentCall(card) {
  const emojiEl = $('current-call-emoji');
  const nameEl  = $('current-call-name');

  emojiEl.textContent = card.emoji;
  nameEl.textContent  = card.name;
  emojiEl.style.animation = 'none';
  void emojiEl.offsetHeight;
  emojiEl.style.animation = null;
}

function addToPlayerHistory(card) {
  const grid = $('called-cards-history');
  if (!grid) return;
  const existing = grid.querySelector(`[data-card-id="${card.id}"]`);
  if (existing) return;

  const div = document.createElement('div');
  div.className = 'called-mini';
  div.dataset.cardId = card.id;
  div.title = card.name;
  div.innerHTML = `<span class="mini-emoji">${card.emoji}</span><span class="mini-name">${card.name}</span>`;
  grid.prepend(div);
}

// ─── SOCKET EVENTS: SHARED ────────────────────────────────────────────────────
socket.on('player_list_updated', ({ players }) => {
  state.players = players;
  if (state.role === 'caller') renderCallerPlayers();
  if (state.role === 'player') updateWaitingList(players);
});

socket.on('game_won', ({ winnerId, winnerName, results }) => {
  state.gameStatus = 'round_end';
  $('winner-name').textContent = winnerName;

  renderGameOverResults(results);

  if (state.role === 'caller') {
    show($('btn-overlay-new-round'));
    hide($('overlay-waiting-msg'));
  } else {
    hide($('btn-overlay-new-round'));
    show($('overlay-waiting-msg'));
  }

  show($('game-over-overlay'));
  hide($('btn-loteria'));

  if (state.role === 'caller') {
    show($('btn-new-round'));
    $('btn-draw-card').disabled = true;
  }
});

function renderGameOverResults(results) {
  const container = $('player-results-container');
  container.innerHTML = '';

  results.forEach(r => {
    const card = document.createElement('div');
    card.className = `result-card${r.isWinner ? ' is-winner' : ''}`;

    const miniGrid = r.grid.map((c, idx) => {
      const isMarked   = r.markedCells[idx];
      const isMissed   = r.calledAndMissed ? r.calledAndMissed.some(m => m.id === c.id) : false;
      const isUncalled = r.notYetCalled ? r.notYetCalled.some(nc => nc.id === c.id) : false;

      let cls = '';
      if (isMarked) cls = 'cell-marked';
      else if (isMissed) cls = 'cell-missed';
      else if (isUncalled) cls = 'cell-uncalled';

      return `<div class="result-mini-cell ${cls}">
        <span class="rm-emoji">${c.emoji}</span>
        <span class="rm-name">${c.name}</span>
        ${isMarked ? '<span style="position:absolute;top:2px;right:4px;font-size:0.65rem;color:var(--green)">✓</span>' : ''}
      </div>`;
    }).join('');

    card.innerHTML = `
      <p class="result-player-name">${r.isWinner ? '👑 ' : ''}${r.name}</p>
      <div class="result-mini-grid">${miniGrid}</div>
      <div class="result-legend">
        <div class="legend-item"><span class="legend-dot marked"></span>Marcada con ficha</div>
        <div class="legend-item"><span class="legend-dot missed"></span>Salió pero no marcó</div>
        <div class="legend-item"><span class="legend-dot uncalled"></span>No salió todavía</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── NEW ROUND ────────────────────────────────────────────────────────────────
$('btn-new-round').addEventListener('click', startNewRound);
$('btn-overlay-new-round').addEventListener('click', startNewRound);

function startNewRound() {
  socket.emit('new_round');
}

socket.on('new_round_started', ({ round, players }) => {
  state.round = round;
  state.calledCards = [];
  state.currentCard = null;
  state.gameStatus = 'playing';

  hide($('game-over-overlay'));
  hide($('btn-loteria'));

  if (state.role === 'caller') {
    state.players = players.map(p => ({ id: p.id, name: p.name, hasWon: false }));
    showView('view-caller');
    $('caller-round-num').textContent = round;
    $('caller-card-count').textContent = '0 / 54';
    $('caller-current-emoji').textContent = '🃏';
    $('caller-current-name').textContent = 'Jala la primera carta';
    $('caller-current-desc').textContent = 'Nueva ronda lista';
    $('caller-status').textContent = '';
    $('caller-called-cards').innerHTML = '';
    hide($('btn-new-round'));
    $('btn-draw-card').disabled = false;
    renderCallerPlayers();
  }

  if (state.role === 'player') {
    const myData = players.find(p => p.id === state.myId);
    if (myData) {
      state.myGrid = myData.grid;
      state.markedCells = new Array(9).fill(false);
    }
    showView('view-player');
    $('player-round-num').textContent = round;
    $('current-call-emoji').textContent = '🃏';
    $('current-call-name').textContent = '–';
    $('called-cards-history').innerHTML = '';
    renderPlayerGrid();
  }

  showToast(`🎴 ¡Ronda ${round} comenzando!`);
});

// ─── WAITING ROOM ─────────────────────────────────────────────────────────────
socket.on('error_msg', ({ message }) => {
  if (state.role === 'player' && document.getElementById('view-player-setup').classList.contains('active')) {
    showError('join-error', message);
  } else if (state.role === 'caller') {
    $('caller-status').textContent = `⚠️ ${message}`;
  } else {
    showError('welcome-error', message);
  }
});

socket.on('caller_left', () => {
  showToast('⚠️ El Gritón se fue. Esperando nuevo Gritón...', 'warning');
});

function updateWaitingList(players) {
  const list = $('waiting-player-list');
  if (!list) return;
  list.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.className = 'player-list-item';
    li.innerHTML = `<span class="p-icon">🎴</span><span>${p.name}</span>`;
    list.appendChild(li);
  });
}

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
    z-index: 9999; padding: 0.7rem 1.5rem;
    font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 1px;
    background: ${type === 'error' ? 'rgba(230,57,70,0.9)' : type === 'warning' ? 'rgba(255,209,102,0.9)' : 'rgba(6,214,160,0.9)'};
    color: ${type === 'warning' ? '#000' : '#fff'};
    border-left: 3px solid ${type === 'error' ? '#8B0000' : type === 'warning' ? '#B8860B' : '#04A07A'};
    animation: slideIn 0.3s ease both;
    max-width: 90vw; text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── CONNECTION ───────────────────────────────────────────────────────────────
socket.on('connect', () => setConnectionStatus('connected'));
socket.on('disconnect', () => setConnectionStatus('disconnected'));
socket.on('connect_error', () => setConnectionStatus('disconnected'));
setConnectionStatus('connecting');
