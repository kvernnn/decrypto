import crypto from 'crypto';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {
  addPlayerToGame,
  confirmTiebreakerOverride,
  createNewGame,
  filterStateForPlayer,
  handlePlayerDisconnect,
  lockGuess,
  randomiseTeams,
  reassignSubmitter,
  reportDisputedClue,
  sendChatMessage,
  setGameMode,
  setPlayerTeam,
  startGame,
  submitClues,
  submitSuggestion,
  submitTiebreakerGuesses,
  updateTeamNotes,
} from './server/gameMachine.js';
import { store } from './server/store.js';
import { WSClientMessage, WSServerMessage } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

interface ClientSocket extends WebSocket {
  lobbyId?: string;
  sessionId?: string;
  playerId?: string;
  isAlive?: boolean;
}

// REST Endpoints
app.post('/api/lobby/create', (req: Request, res: Response) => {
  try {
    const hostName = (req.body?.hostName || '').trim() || 'Agent 1';
    const sessionId = crypto.randomUUID();
    const game = createNewGame(sessionId, hostName);
    const hostPlayer = game.players[0];

    store.registerSession(sessionId, game.lobbyId, hostPlayer.id);

    res.json({
      success: true,
      lobbyId: game.lobbyId,
      sessionId,
      playerId: hostPlayer.id,
      game: filterStateForPlayer(game, hostPlayer.id),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/lobby/join', (req: Request, res: Response) => {
  try {
    const lobbyId = (req.body?.lobbyId || '').trim().toUpperCase();
    const playerName = (req.body?.playerName || '').trim() || 'Agent';
    let sessionId = req.body?.sessionId || '';

    const game = store.getGame(lobbyId);
    if (!game) {
      res.status(404).json({ success: false, error: `Lobby "${lobbyId}" not found.` });
      return;
    }

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    const player = addPlayerToGame(game, sessionId, playerName);
    store.registerSession(sessionId, lobbyId, player.id);

    broadcastLobbyState(lobbyId);

    res.json({
      success: true,
      lobbyId,
      sessionId,
      playerId: player.id,
      game: filterStateForPlayer(game, player.id),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/session/validate', (req: Request, res: Response) => {
  try {
    const sessionId = req.body?.sessionId;
    if (!sessionId) {
      res.status(400).json({ success: false, error: 'Session ID required' });
      return;
    }

    const mapping = store.getPlayerBySession(sessionId);
    if (!mapping) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const game = store.getGame(mapping.lobbyId);
    if (!game) {
      res.status(404).json({ success: false, error: 'Game not found' });
      return;
    }

    const player = game.players.find((p) => p.id === mapping.playerId);
    if (!player) {
      res.status(404).json({ success: false, error: 'Player not found in game' });
      return;
    }

    player.connected = true;
    store.setGame(game);

    res.json({
      success: true,
      lobbyId: game.lobbyId,
      playerId: player.id,
      sessionId,
      game: filterStateForPlayer(game, player.id),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Broadcast state to all connected clients in a lobby, filtering appropriately for each player
export function broadcastLobbyState(lobbyId: string) {
  const game = store.getGame(lobbyId);
  if (!game) return;

  wss.clients.forEach((client) => {
    const cs = client as ClientSocket;
    if (cs.readyState === WebSocket.OPEN && cs.lobbyId === lobbyId && cs.playerId) {
      const filtered = filterStateForPlayer(game, cs.playerId);
      const msg: WSServerMessage = {
        type: 'state_update',
        state: filtered,
      };
      cs.send(JSON.stringify(msg));
    }
  });
}

// WebSocket Connection handling
wss.on('connection', (ws: ClientSocket, req) => {
  ws.isAlive = true;

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const lobbyId = (url.searchParams.get('lobbyId') || '').toUpperCase();
  const sessionId = url.searchParams.get('sessionId') || '';
  const playerName = url.searchParams.get('playerName') || 'Agent';

  if (lobbyId && sessionId) {
    const game = store.getGame(lobbyId);
    if (game) {
      const player = addPlayerToGame(game, sessionId, playerName);
      ws.lobbyId = lobbyId;
      ws.sessionId = sessionId;
      ws.playerId = player.id;
      player.connected = true;
      store.setGame(game);

      // Send initial state to this client
      const initial = filterStateForPlayer(game, player.id);
      ws.send(JSON.stringify({ type: 'state_update', state: initial }));

      // Notify other teammates of reconnection
      broadcastLobbyState(lobbyId);
    }
  }

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as WSClientMessage;
      handleSocketMessage(ws, msg);
    } catch (err) {
      console.error('Error handling WS message:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Malformed message format' }));
    }
  });

  ws.on('close', () => {
    if (ws.sessionId) {
      const { game } = handlePlayerDisconnect(ws.sessionId);
      if (game) {
        broadcastLobbyState(game.lobbyId);
      }
    }
  });
});

function handleSocketMessage(ws: ClientSocket, msg: WSClientMessage) {
  if (msg.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong' }));
    return;
  }

  if (msg.type === 'join') {
    const lobbyId = msg.lobbyId.toUpperCase();
    const game = store.getGame(lobbyId);
    if (!game) {
      ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }));
      return;
    }
    const player = addPlayerToGame(game, msg.sessionId, msg.playerName);
    ws.lobbyId = lobbyId;
    ws.sessionId = msg.sessionId;
    ws.playerId = player.id;
    player.connected = true;
    store.setGame(game);
    broadcastLobbyState(lobbyId);
    return;
  }

  // All other actions require an authenticated session in a lobby
  if (!ws.lobbyId || !ws.playerId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not connected to a lobby.' }));
    return;
  }

  const game = store.getGame(ws.lobbyId);
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Game session expired.' }));
    return;
  }

  let result: { success: boolean; error?: string } = { success: true };

  switch (msg.type) {
    case 'set_team':
      result = setPlayerTeam(game, ws.playerId, msg.team);
      break;

    case 'randomise_teams':
      result = randomiseTeams(game, ws.playerId);
      break;

    case 'set_mode':
      result = setGameMode(game, ws.playerId, msg.mode);
      break;

    case 'start_game':
      result = startGame(game, ws.playerId);
      break;

    case 'submit_clues':
      result = submitClues(game, ws.playerId, msg.clues);
      break;

    case 'suggest_code':
      result = submitSuggestion(game, ws.playerId, msg.guess);
      break;

    case 'lock_guess':
      result = lockGuess(game, ws.playerId, msg.guess);
      break;

    case 'reassign_submitter':
      result = reassignSubmitter(game, ws.playerId, msg.targetPlayerId);
      break;

    case 'update_notes':
      result = updateTeamNotes(game, ws.playerId, msg.digit, msg.text);
      break;

    case 'send_chat':
      result = sendChatMessage(game, ws.playerId, msg.text);
      break;

    case 'report_clue':
      result = reportDisputedClue(game, ws.playerId, msg.clueIndex, msg.clueText, msg.reason);
      break;

    case 'submit_tiebreaker_guesses':
      result = submitTiebreakerGuesses(game, ws.playerId, msg.guesses);
      break;

    case 'confirm_tiebreaker_override':
      result = confirmTiebreakerOverride(game, ws.playerId, msg.key, msg.valid);
      break;

    default:
      result = { success: false, error: 'Unknown command' };
  }

  if (!result.success) {
    ws.send(JSON.stringify({ type: 'error', message: result.error || 'Action failed.' }));
  } else {
    broadcastLobbyState(ws.lobbyId);
  }
}

// Keepalive heartbeat
const pingInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    const cs = client as ClientSocket;
    if (cs.isAlive === false) {
      cs.terminate();
      return;
    }
    cs.isAlive = false;
    cs.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Decrypto Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
