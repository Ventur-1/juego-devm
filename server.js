const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// ─── DECK ───────────────────────────────────────────────────────────────────
const FULL_DECK = [
  { id: 'cpu',         name: 'El CPU',           emoji: '🧠', desc: 'El cerebro de la máquina' },
  { id: 'gpu',         name: 'La GPU',            emoji: '🎮', desc: 'El alma del renderizado' },
  { id: 'ram',         name: 'La RAM',            emoji: '💾', desc: 'La memoria veloz' },
  { id: 'ssd',         name: 'El SSD',            emoji: '📀', desc: 'El almacén silencioso' },
  { id: 'monitor',     name: 'El Monitor',        emoji: '🖥️', desc: 'La ventana digital' },
  { id: 'teclado',     name: 'El Teclado',        emoji: '⌨️', desc: 'El escritorio del coder' },
  { id: 'mouse',       name: 'El Mouse',          emoji: '🖱️', desc: 'La mano del usuario' },
  { id: 'usb',         name: 'El USB',            emoji: '🔋', desc: 'La llave universal' },
  { id: 'hdmi',        name: 'El HDMI',           emoji: '📺', desc: 'El puente visual' },
  { id: 'motherboard', name: 'La Tarjeta Madre',  emoji: '🔩', desc: 'La madre de todo' },
  { id: 'fan',         name: 'El Ventilador',     emoji: '🌀', desc: 'El guardián del calor' },
  { id: 'psu',         name: 'La Fuente',         emoji: '⚡', desc: 'El corazón eléctrico' },
  { id: 'router',      name: 'El Router',         emoji: '📡', desc: 'El portal a internet' },
  { id: 'printer',     name: 'La Impresora',      emoji: '🖨️', desc: 'La enemiga de la oficina' },
  { id: 'cable',       name: 'El Cable',          emoji: '🔗', desc: 'El enredador legendario' },
  { id: 'laptop',      name: 'La Laptop',         emoji: '💻', desc: 'La aliada portátil' },
  { id: 'hdd',         name: 'El Disco Duro',     emoji: '💿', desc: 'El guardián de datos' },
  { id: 'netswitch',   name: 'El Switch',         emoji: '🌐', desc: 'El repartidor de red' },
  { id: 'audifonos',   name: 'Los Audífonos',     emoji: '🎧', desc: 'El escudo del programador' },
  { id: 'webcam',      name: 'La Webcam',         emoji: '📷', desc: 'El ojo de las reuniones' },
  { id: 'bug',         name: 'El Bug',            emoji: '🐛', desc: 'El enemigo jurado' },
  { id: 'git',         name: 'El Git',            emoji: '🌿', desc: 'El guardián del código' },
  { id: 'terminal',    name: 'La Terminal',       emoji: '⬛', desc: 'La cueva del hacker' },
  { id: 'docker',      name: 'El Docker',         emoji: '🐳', desc: 'El contenedor mágico' },
  { id: 'cloud',       name: 'La Nube',           emoji: '☁️', desc: 'El hogar de los datos' },
  { id: 'api',         name: 'La API',            emoji: '🔌', desc: 'El mensajero invisible' },
  { id: 'loop',        name: 'El Loop',           emoji: '🔄', desc: 'El círculo sin fin' },
  { id: 'array',       name: 'El Array',          emoji: '📊', desc: 'La lista ordenada' },
  { id: 'funcion',     name: 'La Función',        emoji: '⚙️', desc: 'La fábrica de código' },
  { id: 'variable',    name: 'La Variable',       emoji: '🏷️', desc: 'La caja de valores' },
  { id: 'db',          name: 'La Base de Datos',  emoji: '🗄️', desc: 'El almacén supremo' },
  { id: 'serv',        name: 'El Servidor',       emoji: '🏢', desc: 'El rey del backend' },
  { id: 'codigo',      name: 'El Código',         emoji: '📝', desc: 'El idioma de las máquinas' },
  { id: 'binario',     name: 'El Binario',        emoji: '🔢', desc: 'El lenguaje original' },
  { id: 'compilador',  name: 'El Compilador',     emoji: '🔨', desc: 'El traductor supremo' },
  { id: 'ide',         name: 'El IDE',            emoji: '🏗️', desc: 'El taller del developer' },
  { id: 'stackoverflow', name: 'Stack Overflow',  emoji: '🆘', desc: 'El salvador legendario' },
  { id: 'deploy',      name: 'El Deploy',         emoji: '🚀', desc: 'El momento de verdad' },
  { id: 'framework',   name: 'El Framework',      emoji: '🏛️', desc: 'Los cimientos del proyecto' },
  { id: 'ia',          name: 'La IA',             emoji: '🤖', desc: 'La reina del futuro' },
  { id: 'python',      name: 'El Python',         emoji: '🐍', desc: 'La serpiente elegante' },
  { id: 'javascript',  name: 'El JavaScript',     emoji: '🟨', desc: 'El rey del browser' },
  { id: 'html',        name: 'El HTML',           emoji: '🧱', desc: 'El esqueleto web' },
  { id: 'css',         name: 'El CSS',            emoji: '🎨', desc: 'El estilista web' },
  { id: 'java',        name: 'El Java',           emoji: '☕', desc: 'El eterno sobreviviente' },
  { id: 'rust',        name: 'El Rust',           emoji: '🦀', desc: 'El cangrejo veloz' },
  { id: 'gopher',      name: 'El Gopher',         emoji: '🐹', desc: 'El concurrent master' },
  { id: 'php',         name: 'El PHP',            emoji: '🐘', desc: 'El elefante web' },
  { id: 'sql',         name: 'El SQL',            emoji: '🔍', desc: 'El interrogador de datos' },
  { id: 'react',       name: 'El React',          emoji: '⚛️', desc: 'El átomo del frontend' },
  { id: 'linux',       name: 'El Linux',          emoji: '🐧', desc: 'El pingüino libre' },
  { id: 'windows',     name: 'El Windows',        emoji: '🪟', desc: 'La ventana de los mortales' },
  { id: 'commit',      name: 'El Commit',         emoji: '📌', desc: 'El punto de no retorno' },
  { id: 'pullrequest', name: 'El Pull Request',   emoji: '🔀', desc: 'La revisión eterna' },
  { id: 'error404',    name: 'El Error 404',      emoji: '❌', desc: 'El fantasma perdido' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCard(id) {
  return FULL_DECK.find(c => c.id === id);
}

function generatePlayerGrid() {
  const picked = shuffle(FULL_DECK).slice(0, 9);
  return picked.map(c => c.id);
}

function getPlayersInfo() {
  return Object.values(gameState.players).map(p => ({
    id: p.id, name: p.name, hasWon: p.hasWon
  }));
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let shuffledDeck = shuffle(FULL_DECK);
let deckIndex = 0;

const gameState = {
  status: 'waiting',
  round: 1,
  callerId: null,
  calledCards: [],
  currentCard: null,
  players: {},
  winnerId: null
};

function resetRound() {
  shuffledDeck = shuffle(FULL_DECK);
  deckIndex = 0;
  gameState.calledCards = [];
  gameState.currentCard = null;
  gameState.winnerId = null;
  gameState.status = 'playing';
  Object.values(gameState.players).forEach(p => {
    p.grid = generatePlayerGrid();
    p.markedCells = new Array(9).fill(false);
    p.hasWon = false;
  });
}

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on('join_as_caller', () => {
    if (gameState.callerId && gameState.callerId !== socket.id && io.sockets.sockets.has(gameState.callerId)) {
      socket.emit('error_msg', { message: 'Ya hay un Gritón en esta partida' });
      return;
    }
    gameState.callerId = socket.id;
    if (gameState.status === 'waiting') gameState.status = 'waiting';
    socket.emit('caller_confirmed', {
      players: getPlayersInfo(),
      round: gameState.round,
      calledCards: gameState.calledCards.map(id => getCard(id)),
      currentCard: gameState.currentCard ? getCard(gameState.currentCard) : null
    });
    console.log(`[GRITÓN] ${socket.id}`);
  });

  socket.on('join_as_player', ({ name }) => {
    if (!name || !name.trim()) {
      socket.emit('error_msg', { message: 'Necesitas un nombre, campeón' });
      return;
    }
    const playerCount = Object.keys(gameState.players).length;
    if (playerCount >= 5 && !gameState.players[socket.id]) {
      socket.emit('error_msg', { message: 'Máximo 5 jugadores, ya está lleno' });
      return;
    }
    if (!gameState.players[socket.id]) {
      gameState.players[socket.id] = {
        id: socket.id,
        name: name.trim(),
        grid: generatePlayerGrid(),
        markedCells: new Array(9).fill(false),
        hasWon: false
      };
    }
    const player = gameState.players[socket.id];
    socket.emit('player_confirmed', {
      id: socket.id,
      name: player.name,
      grid: player.grid.map(id => getCard(id)),
      players: getPlayersInfo(),
      round: gameState.round,
      calledCards: gameState.calledCards.map(id => getCard(id)),
      currentCard: gameState.currentCard ? getCard(gameState.currentCard) : null
    });
    io.emit('player_list_updated', { players: getPlayersInfo() });
    console.log(`[JUGADOR] ${player.name} (${socket.id})`);
  });

  socket.on('draw_card', () => {
    if (socket.id !== gameState.callerId) return;
    if (Object.keys(gameState.players).length === 0) {
      socket.emit('error_msg', { message: 'No hay jugadores aún' });
      return;
    }
    if (deckIndex >= shuffledDeck.length) {
      socket.emit('error_msg', { message: '¡Se acabaron las cartas! Inicia nueva ronda.' });
      return;
    }
    if (gameState.status === 'round_end') {
      socket.emit('error_msg', { message: 'La ronda terminó, inicia una nueva' });
      return;
    }
    if (gameState.status === 'waiting') gameState.status = 'playing';

    const card = shuffledDeck[deckIndex++];
    gameState.currentCard = card.id;
    gameState.calledCards.push(card.id);

    io.emit('card_called', {
      card: card,
      calledCards: gameState.calledCards.map(id => getCard(id))
    });
    console.log(`[CARTA] ${card.name}`);
  });

  socket.on('claim_loteria', ({ markedCells }) => {
    const player = gameState.players[socket.id];
    if (!player || gameState.status !== 'playing') return;

    // Server-side validation: all 9 cells marked AND all 9 cards in player grid were called
    const allMarked = Array.isArray(markedCells) && markedCells.length === 9 && markedCells.every(Boolean);
    const allCalled = player.grid.every(cardId => gameState.calledCards.includes(cardId));

    if (allMarked && allCalled) {
      player.hasWon = true;
      gameState.winnerId = socket.id;
      gameState.status = 'round_end';

      const results = Object.values(gameState.players).map(p => {
        const calledSet = new Set(gameState.calledCards);
        const calledAndMissed = p.grid
          .filter((cardId, idx) => calledSet.has(cardId) && !p.markedCells[idx])
          .map(id => getCard(id));
        const notYetCalled = p.grid
          .filter(cardId => !calledSet.has(cardId))
          .map(id => getCard(id));
        return {
          id: p.id,
          name: p.name,
          grid: p.grid.map(id => getCard(id)),
          markedCells: p.markedCells,
          calledAndMissed,
          notYetCalled,
          isWinner: p.id === socket.id
        };
      });

      io.emit('game_won', { winnerId: socket.id, winnerName: player.name, results });
      console.log(`[LOTERÍA] ${player.name} ganó!`);
    } else {
      socket.emit('loteria_invalid', { message: '¡Trampa detectada! No todas tus cartas han salido.' });
    }
  });

  socket.on('sync_marked', ({ markedCells }) => {
    const player = gameState.players[socket.id];
    if (player && Array.isArray(markedCells) && markedCells.length === 9) {
      player.markedCells = markedCells;
    }
  });

  socket.on('new_round', () => {
    if (socket.id !== gameState.callerId) return;
    gameState.round++;
    resetRound();
    const playersWithGrids = Object.values(gameState.players).map(p => ({
      id: p.id,
      name: p.name,
      grid: p.grid.map(id => getCard(id))
    }));
    io.emit('new_round_started', { round: gameState.round, players: playersWithGrids });
    console.log(`[NUEVA RONDA] Ronda ${gameState.round}`);
  });

  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    if (socket.id === gameState.callerId) {
      gameState.callerId = null;
      io.emit('caller_left');
    }
    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id];
      io.emit('player_list_updated', { players: getPlayersInfo() });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🃏 Tech Lotería corriendo en http://localhost:${PORT}\n`);
});
