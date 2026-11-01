import {
  ChatMessage,
  DisputedClue,
  FilteredGameState,
  GameMode,
  Player,
  PlayerSuggestion,
  PublicScore,
  RoundRecord,
  Team,
  TeamNotes,
  TransmissionData,
} from '../src/types.js';
import { InternalGameState, InternalPlayer, store } from './store.js';
import { generateCode, getRandomKeywords } from './words.js';

function createLobbyId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function createNewGame(hostSessionId: string, hostName: string): InternalGameState {
  const lobbyId = createLobbyId();
  const hostPlayerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const hostPlayer: InternalPlayer = {
    id: hostPlayerId,
    sessionId: hostSessionId,
    name: hostName.trim() || 'Player 1',
    team: 'blue',
    isHost: true,
    isReady: false,
    connected: true,
    joinedAt: now,
  };

  const initialKeywords = getRandomKeywords();

  const game: InternalGameState = {
    lobbyId,
    mode: 'traditional',
    phase: 'LOBBY',
    round: 1,
    maxRounds: 8,
    hostId: hostPlayerId,
    players: [hostPlayer],

    blueKeywords: initialKeywords.blue,
    redKeywords: initialKeywords.red,

    blueEncryptorOrder: [],
    redEncryptorOrder: [],
    blueEncryptorIndex: 0,
    redEncryptorIndex: 0,

    blueCurrentCode: null,
    redCurrentCode: null,

    bluePreparedClues: null,
    redPreparedClues: null,

    currentTransmission: null,

    scores: {
      blue: { interceptions: 0, miscommunications: 0 },
      red: { interceptions: 0, miscommunications: 0 },
    },

    blueCluesHistory: { 1: [], 2: [], 3: [], 4: [] },
    redCluesHistory: { 1: [], 2: [], 3: [], 4: [] },

    blueNotes: { 1: '', 2: '', 3: '', 4: '' },
    redNotes: { 1: '', 2: '', 3: '', 4: '' },

    blueSuggestions: {},
    redSuggestions: {},

    chatMessages: [
      {
        id: `sys_${Date.now()}`,
        team: 'blue',
        senderId: 'system',
        senderName: 'HQ Cipher Room',
        text: `Lobby created by ${hostPlayer.name}. Welcome to Decrypto.`,
        isSystem: true,
        timestamp: now,
      },
      {
        id: `sys_red_${Date.now()}`,
        team: 'red',
        senderId: 'system',
        senderName: 'HQ Cipher Room',
        text: `Lobby created by ${hostPlayer.name}. Welcome to Decrypto.`,
        isSystem: true,
        timestamp: now,
      },
    ],
    history: [],

    blueUsedCodes: [],
    redUsedCodes: [],

    winner: null,
    endingReason: null,

    tiebreaker: null,
    disputedClues: [],

    createdAt: now,
    updatedAt: now,
  };

  store.setGame(game);
  return game;
}

export function addPlayerToGame(game: InternalGameState, sessionId: string, playerName: string): InternalPlayer {
  // Check if player with this session already exists
  const existing = game.players.find((p) => p.sessionId === sessionId);
  if (existing) {
    existing.connected = true;
    if (playerName.trim() && playerName.trim() !== existing.name) {
      existing.name = playerName.trim();
    }
    store.setGame(game);
    return existing;
  }

  // Assign team with fewer players, or blue by default
  const blueCount = game.players.filter((p) => p.team === 'blue').length;
  const redCount = game.players.filter((p) => p.team === 'red').length;
  const team: Team = blueCount <= redCount ? 'blue' : 'red';

  const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newPlayer: InternalPlayer = {
    id: playerId,
    sessionId,
    name: playerName.trim() || `Agent ${game.players.length + 1}`,
    team: game.phase === 'LOBBY' ? team : null, // Locked if game started
    isHost: game.players.length === 0,
    isReady: false,
    connected: true,
    joinedAt: Date.now(),
  };

  game.players.push(newPlayer);
  if (newPlayer.isHost) {
    game.hostId = newPlayer.id;
  }

  addSystemMessage(game, `${newPlayer.name} joined the frequency.`, newPlayer.team);
  store.setGame(game);
  return newPlayer;
}

export function handlePlayerDisconnect(sessionId: string): { game?: InternalGameState; player?: InternalPlayer } {
  const mapping = store.getPlayerBySession(sessionId);
  if (!mapping) return {};

  const game = store.getGame(mapping.lobbyId);
  if (!game) return {};

  const player = game.players.find((p) => p.id === mapping.playerId);
  if (!player) return { game };

  player.connected = false;

  // If host disconnected, reassign to another connected player if available
  if (player.isHost) {
    const nextHost = game.players.find((p) => p.connected && p.id !== player.id);
    if (nextHost) {
      player.isHost = false;
      nextHost.isHost = true;
      game.hostId = nextHost.id;
      addSystemMessage(game, `Host reassigned to ${nextHost.name}.`);
    }
  }

  store.setGame(game);
  return { game, player };
}

export function addSystemMessage(game: InternalGameState, text: string, team?: Team | null) {
  const now = Date.now();
  if (team) {
    game.chatMessages.push({
      id: `sys_${now}_${Math.random().toString(36).substring(2, 5)}`,
      team,
      senderId: 'system',
      senderName: 'Decrypto HQ',
      text,
      isSystem: true,
      timestamp: now,
    });
  } else {
    game.chatMessages.push({
      id: `sys_b_${now}_${Math.random().toString(36).substring(2, 5)}`,
      team: 'blue',
      senderId: 'system',
      senderName: 'Decrypto HQ',
      text,
      isSystem: true,
      timestamp: now,
    });
    game.chatMessages.push({
      id: `sys_r_${now}_${Math.random().toString(36).substring(2, 5)}`,
      team: 'red',
      senderId: 'system',
      senderName: 'Decrypto HQ',
      text,
      isSystem: true,
      timestamp: now,
    });
  }
}

export function randomiseTeams(game: InternalGameState, requestingPlayerId: string): { success: boolean; error?: string } {
  if (game.phase !== 'LOBBY') {
    return { success: false, error: 'Teams are locked once the game starts.' };
  }
  const requester = game.players.find((p) => p.id === requestingPlayerId);
  if (!requester || !requester.isHost) {
    return { success: false, error: 'Only the host can randomise teams.' };
  }

  // Shuffle all players
  const shuffled = [...game.players].sort(() => Math.random() - 0.5);
  // Split evenly
  const half = Math.ceil(shuffled.length / 2);
  shuffled.forEach((p, idx) => {
    p.team = idx < half ? 'blue' : 'red';
  });

  addSystemMessage(game, `Host randomised team assignments.`);
  store.setGame(game);
  return { success: true };
}

export function setPlayerTeam(game: InternalGameState, playerId: string, newTeam: Team): { success: boolean; error?: string } {
  if (game.phase !== 'LOBBY') {
    return { success: false, error: 'Teams cannot be changed after the game has started.' };
  }
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: 'Player not found.' };

  player.team = newTeam;
  store.setGame(game);
  return { success: true };
}

export function setGameMode(game: InternalGameState, playerId: string, mode: GameMode): { success: boolean; error?: string } {
  if (game.phase !== 'LOBBY') {
    return { success: false, error: 'Cannot change mode after game start.' };
  }
  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.isHost) {
    return { success: false, error: 'Only the host can change game mode.' };
  }
  game.mode = mode;
  addSystemMessage(game, `Game mode set to ${mode === 'traditional' ? 'Traditional' : 'No-repeat house rule'}.`);
  store.setGame(game);
  return { success: true };
}

export function startGame(game: InternalGameState, playerId: string): { success: boolean; error?: string } {
  if (game.phase !== 'LOBBY') {
    return { success: false, error: 'Game is already in progress.' };
  }
  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.isHost) {
    return { success: false, error: 'Only the host can start the game.' };
  }

  const bluePlayers = game.players.filter((p) => p.team === 'blue');
  const redPlayers = game.players.filter((p) => p.team === 'red');

  if (bluePlayers.length < 2 || redPlayers.length < 2) {
    return { success: false, error: 'Both Blue and Red teams must have at least 2 players to start.' };
  }
  if (game.players.length > 8) {
    return { success: false, error: 'Maximum 8 players supported.' };
  }

  // Setup turn orders
  game.blueEncryptorOrder = bluePlayers.map((p) => p.id);
  game.redEncryptorOrder = redPlayers.map((p) => p.id);
  game.blueEncryptorIndex = 0;
  game.redEncryptorIndex = 0;

  // Fresh keywords
  const kw = getRandomKeywords();
  game.blueKeywords = kw.blue;
  game.redKeywords = kw.red;

  game.round = 1;
  game.scores = {
    blue: { interceptions: 0, miscommunications: 0 },
    red: { interceptions: 0, miscommunications: 0 },
  };

  startNewRound(game);
  store.setGame(game);
  return { success: true };
}

export function startNewRound(game: InternalGameState) {
  // Generate secret codes for both teams
  game.blueCurrentCode = generateCode(game.mode, game.blueUsedCodes);
  game.redCurrentCode = generateCode(game.mode, game.redUsedCodes);

  game.bluePreparedClues = null;
  game.redPreparedClues = null;
  game.currentTransmission = null;

  game.blueSuggestions = {};
  game.redSuggestions = {};

  game.phase = 'ROUND_CLUES';

  const blueEncryptor = game.players.find((p) => p.id === game.blueEncryptorOrder[game.blueEncryptorIndex]);
  const redEncryptor = game.players.find((p) => p.id === game.redEncryptorOrder[game.redEncryptorIndex]);

  addSystemMessage(game, `=== ROUND ${game.round} INITIATED ===`);
  addSystemMessage(game, `Blue Encryptor: ${blueEncryptor?.name || 'Unknown'}. Red Encryptor: ${redEncryptor?.name || 'Unknown'}.`);
  addSystemMessage(game, `Encryptors are now preparing three secret clues.`);
}

export function submitClues(
  game: InternalGameState,
  playerId: string,
  clues: [string, string, string]
): { success: boolean; error?: string } {
  if (game.phase !== 'ROUND_CLUES') {
    return { success: false, error: 'Not currently in the clue preparation phase.' };
  }

  const blueEncryptorId = game.blueEncryptorOrder[game.blueEncryptorIndex];
  const redEncryptorId = game.redEncryptorOrder[game.redEncryptorIndex];

  const trimmedClues: [string, string, string] = [
    clues[0]?.trim() || '',
    clues[1]?.trim() || '',
    clues[2]?.trim() || '',
  ];

  if (!trimmedClues[0] || !trimmedClues[1] || !trimmedClues[2]) {
    return { success: false, error: 'All three clues must be provided.' };
  }

  // Validate clue rules: cannot reuse identical clues from earlier in the game
  const isBlue = playerId === blueEncryptorId;
  const isRed = playerId === redEncryptorId;

  if (!isBlue && !isRed) {
    return { success: false, error: 'Only the active Encryptor can submit clues for their team.' };
  }

  const teamKeywords = isBlue ? game.blueKeywords : game.redKeywords;
  const kwValues = Object.values(teamKeywords).map((w) => w.toLowerCase());

  for (const c of trimmedClues) {
    if (kwValues.includes(c.toLowerCase())) {
      return { success: false, error: `Clue "${c}" matches one of your secret keywords! This is strictly forbidden.` };
    }
  }

  // Check reuse of past clues
  const clueHistory = isBlue ? game.blueCluesHistory : game.redCluesHistory;
  const pastClues = Object.values(clueHistory)
    .flat()
    .map((item) => item.clue.toLowerCase());

  for (const c of trimmedClues) {
    if (pastClues.includes(c.toLowerCase())) {
      return { success: false, error: `Clue "${c}" was already used in a previous round! Clues cannot be reused.` };
    }
  }

  if (isBlue) {
    game.bluePreparedClues = trimmedClues;
    addSystemMessage(game, `Blue Encryptor has encrypted and locked their clues!`, 'blue');
  } else {
    game.redPreparedClues = trimmedClues;
    addSystemMessage(game, `Red Encryptor has encrypted and locked their clues!`, 'red');
  }

  // If both have submitted, proceed to Transmission 1 (Blue)
  if (game.bluePreparedClues && game.redPreparedClues) {
    initiateBlueTransmission(game);
  }

  store.setGame(game);
  return { success: true };
}

function getNextNonEncryptor(players: InternalPlayer[], team: Team, encryptorId: string): string {
  const teamMembers = players.filter((p) => p.team === team && p.id !== encryptorId && p.connected);
  if (teamMembers.length > 0) {
    return teamMembers[0].id;
  }
  // Fallback to any teammate
  const anyTeammate = players.find((p) => p.team === team && p.id !== encryptorId);
  return anyTeammate ? anyTeammate.id : encryptorId;
}

function initiateBlueTransmission(game: InternalGameState) {
  game.phase = 'TRANSMISSION_BLUE';
  const blueEncryptor = game.players.find((p) => p.id === game.blueEncryptorOrder[game.blueEncryptorIndex]);

  const decodingSubmitter = getNextNonEncryptor(game.players, 'blue', blueEncryptor?.id || '');
  // For interception, default to any red member
  const redEncryptor = game.players.find((p) => p.id === game.redEncryptorOrder[game.redEncryptorIndex]);
  const interceptionSubmitter = getNextNonEncryptor(game.players, 'red', redEncryptor?.id || '') || redEncryptor?.id || '';

  game.currentTransmission = {
    team: 'blue',
    encryptorId: blueEncryptor?.id || '',
    encryptorName: blueEncryptor?.name || 'Blue Encryptor',
    clues: game.bluePreparedClues!,
    decodingSubmitterId: decodingSubmitter,
    interceptionSubmitterId: interceptionSubmitter,
    decodingLocked: false,
    interceptionLocked: game.round === 1 ? true : false, // Round 1 has NO interception attempt
    resolved: false,
    decodingGuess: null,
    interceptionGuess: null,
    actualCodeRevealed: null,
    interceptionSuccess: null,
    decodingSuccess: null,
  };

  game.blueSuggestions = {};
  game.redSuggestions = {};

  addSystemMessage(game, `>>> TRANSMISSION 1: BLUE FREQUENCY ACTIVE <<<`);
  addSystemMessage(game, `Blue clues transmitted: 1) "${game.bluePreparedClues![0]}"  2) "${game.bluePreparedClues![1]}"  3) "${game.bluePreparedClues![2]}"`);
  if (game.round === 1) {
    addSystemMessage(game, `Round 1: Interception is disabled. Blue team must decode their own frequency.`);
  } else {
    addSystemMessage(game, `Red team: attempt interception! Blue team: decode your frequency!`);
  }
}

function initiateRedTransmission(game: InternalGameState) {
  game.phase = 'TRANSMISSION_RED';
  const redEncryptor = game.players.find((p) => p.id === game.redEncryptorOrder[game.redEncryptorIndex]);

  const decodingSubmitter = getNextNonEncryptor(game.players, 'red', redEncryptor?.id || '');
  const blueEncryptor = game.players.find((p) => p.id === game.blueEncryptorOrder[game.blueEncryptorIndex]);
  const interceptionSubmitter = getNextNonEncryptor(game.players, 'blue', blueEncryptor?.id || '') || blueEncryptor?.id || '';

  game.currentTransmission = {
    team: 'red',
    encryptorId: redEncryptor?.id || '',
    encryptorName: redEncryptor?.name || 'Red Encryptor',
    clues: game.redPreparedClues!,
    decodingSubmitterId: decodingSubmitter,
    interceptionSubmitterId: interceptionSubmitter,
    decodingLocked: false,
    interceptionLocked: game.round === 1 ? true : false, // Round 1 has NO interception
    resolved: false,
    decodingGuess: null,
    interceptionGuess: null,
    actualCodeRevealed: null,
    interceptionSuccess: null,
    decodingSuccess: null,
  };

  game.blueSuggestions = {};
  game.redSuggestions = {};

  addSystemMessage(game, `>>> TRANSMISSION 2: RED FREQUENCY ACTIVE <<<`);
  addSystemMessage(game, `Red clues transmitted: 1) "${game.redPreparedClues![0]}"  2) "${game.redPreparedClues![1]}"  3) "${game.redPreparedClues![2]}"`);
  if (game.round === 1) {
    addSystemMessage(game, `Round 1: Interception is disabled. Red team must decode their own frequency.`);
  } else {
    addSystemMessage(game, `Blue team: attempt interception! Red team: decode your frequency!`);
  }
}

export function submitSuggestion(
  game: InternalGameState,
  playerId: string,
  guess: [number, number, number]
): { success: boolean; error?: string } {
  if (game.phase !== 'TRANSMISSION_BLUE' && game.phase !== 'TRANSMISSION_RED') {
    return { success: false, error: 'No active transmission to submit suggestions for.' };
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.team) return { success: false, error: 'Player not on a team.' };

  const trans = game.currentTransmission;
  if (!trans || trans.resolved) return { success: false, error: 'Transmission is already resolved.' };

  // Encryptor restrictions:
  // "The current Encryptor cannot suggest or submit a decoding guess for their own transmission.
  // The Encryptor may help intercept the opponent's transmission."
  if (player.team === trans.team && player.id === trans.encryptorId) {
    return { success: false, error: 'You are the Encryptor for this transmission; you cannot offer suggestions or guesses to your teammates!' };
  }

  // Validate guess: exactly 3 distinct digits 1..4
  if (!isValidGuess(guess)) {
    return { success: false, error: 'A guess must contain exactly 3 distinct digits from 1 to 4.' };
  }

  const suggestion: PlayerSuggestion = {
    playerId: player.id,
    playerName: player.name,
    guess,
    updatedAt: Date.now(),
  };

  if (player.team === 'blue') {
    game.blueSuggestions[player.id] = suggestion;
  } else {
    game.redSuggestions[player.id] = suggestion;
  }

  store.setGame(game);
  return { success: true };
}

function isValidGuess(guess: any): guess is [number, number, number] {
  if (!Array.isArray(guess) || guess.length !== 3) return false;
  const set = new Set(guess);
  if (set.size !== 3) return false;
  return guess.every((d) => typeof d === 'number' && d >= 1 && d <= 4);
}

export function lockGuess(
  game: InternalGameState,
  playerId: string,
  guess: [number, number, number]
): { success: boolean; error?: string } {
  if (game.phase !== 'TRANSMISSION_BLUE' && game.phase !== 'TRANSMISSION_RED') {
    return { success: false, error: 'No active transmission.' };
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.team) return { success: false, error: 'Player not recognized.' };

  const trans = game.currentTransmission;
  if (!trans || trans.resolved) return { success: false, error: 'Transmission already resolved.' };

  if (!isValidGuess(guess)) {
    return { success: false, error: 'A locked guess must contain exactly 3 distinct digits from 1 to 4.' };
  }

  const isTransmittingTeam = player.team === trans.team;

  if (isTransmittingTeam) {
    if (trans.decodingLocked) {
      return { success: false, error: 'Decoding guess already locked.' };
    }
    // Must be designated submitter or host (if reassigning on the fly)
    if (player.id !== trans.decodingSubmitterId && !player.isHost) {
      return { success: false, error: 'Only the designated submitter can lock the final decoding guess.' };
    }
    if (player.id === trans.encryptorId) {
      return { success: false, error: 'The Encryptor cannot submit decoding guesses!' };
    }

    trans.decodingGuess = guess;
    trans.decodingLocked = true;
    addSystemMessage(game, `${player.team === 'blue' ? 'Blue' : 'Red'} locked their decoding guess!`);
  } else {
    // Intercepting team
    if (game.round === 1) {
      return { success: false, error: 'Interceptions are disabled in Round 1.' };
    }
    if (trans.interceptionLocked) {
      return { success: false, error: 'Interception guess already locked.' };
    }
    if (player.id !== trans.interceptionSubmitterId && !player.isHost) {
      return { success: false, error: 'Only the designated interceptor can lock the final interception guess.' };
    }

    trans.interceptionGuess = guess;
    trans.interceptionLocked = true;
    addSystemMessage(game, `${player.team === 'blue' ? 'Blue' : 'Red'} locked their interception guess!`);
  }

  // Check if both required guesses are locked
  if (trans.decodingLocked && trans.interceptionLocked && !trans.resolved) {
    resolveTransmission(game);
  }

  store.setGame(game);
  return { success: true };
}

export function reassignSubmitter(
  game: InternalGameState,
  hostPlayerId: string,
  targetPlayerId: string
): { success: boolean; error?: string } {
  const host = game.players.find((p) => p.id === hostPlayerId);
  if (!host || !host.isHost) {
    return { success: false, error: 'Only the lobby host can reassign guess submitters.' };
  }

  const target = game.players.find((p) => p.id === targetPlayerId);
  if (!target || !target.team || !target.connected) {
    return { success: false, error: 'Target player is not available.' };
  }

  const trans = game.currentTransmission;
  if (!trans || trans.resolved) {
    return { success: false, error: 'No active transmission to reassign.' };
  }

  if (target.team === trans.team) {
    if (target.id === trans.encryptorId) {
      return { success: false, error: 'The Encryptor cannot be assigned as the decoding submitter!' };
    }
    trans.decodingSubmitterId = target.id;
    addSystemMessage(game, `Host assigned ${target.name} as decoding submitter for ${target.team}.`);
  } else {
    trans.interceptionSubmitterId = target.id;
    addSystemMessage(game, `Host assigned ${target.name} as interception submitter for ${target.team}.`);
  }

  store.setGame(game);
  return { success: true };
}

function resolveTransmission(game: InternalGameState) {
  const trans = game.currentTransmission;
  if (!trans) return;

  const isBlueTrans = trans.team === 'blue';
  const actualCode = isBlueTrans ? game.blueCurrentCode! : game.redCurrentCode!;
  trans.actualCodeRevealed = actualCode;
  trans.resolved = true;

  const actualStr = actualCode.join('-');

  // 1. Evaluate Interception (Round 2+)
  if (game.round > 1 && trans.interceptionGuess) {
    const interceptStr = trans.interceptionGuess.join('-');
    const success = interceptStr === actualStr;
    trans.interceptionSuccess = success;

    const interceptingTeam: Team = isBlueTrans ? 'red' : 'blue';
    if (success) {
      game.scores[interceptingTeam].interceptions += 1;
      addSystemMessage(game, `🚨 CRITICAL INTERCEPTION! ${interceptingTeam.toUpperCase()} intercepted code [${actualStr}] (+1 Interception Token)!`);
    } else {
      addSystemMessage(game, `${interceptingTeam.toUpperCase()} attempted interception with [${interceptStr}] but failed.`);
    }
  }

  // 2. Evaluate Decoding
  if (trans.decodingGuess) {
    const decodeStr = trans.decodingGuess.join('-');
    const success = decodeStr === actualStr;
    trans.decodingSuccess = success;

    const transmittingTeam = trans.team;
    if (success) {
      addSystemMessage(game, `✅ ${transmittingTeam.toUpperCase()} successfully decoded their transmission [${actualStr}]!`);
    } else {
      game.scores[transmittingTeam].miscommunications += 1;
      addSystemMessage(game, `❌ MISCOMMUNICATION! ${transmittingTeam.toUpperCase()} guessed [${decodeStr}], but code was [${actualStr}] (+1 Miscommunication Token)!`);
    }
  }

  // 3. Update Clue History
  const encryptor = game.players.find((p) => p.id === trans.encryptorId);
  const encryptorName = encryptor?.name || 'Encryptor';

  const historyStore = isBlueTrans ? game.blueCluesHistory : game.redCluesHistory;
  for (let i = 0; i < 3; i++) {
    const digit = actualCode[i] as 1 | 2 | 3 | 4;
    const clue = trans.clues[i];
    historyStore[digit].push({
      round: game.round,
      digit,
      clue,
      encryptorName,
    });
  }

  // In no-repeat mode, record used code
  if (isBlueTrans) {
    if (!game.blueUsedCodes.includes(actualStr)) game.blueUsedCodes.push(actualStr);
    game.lastBlueTransmissionRecord = {
      decodingGuess: trans.decodingGuess,
      decodingSuccess: trans.decodingSuccess ?? false,
      interceptionGuess: trans.interceptionGuess,
      interceptionSuccess: trans.interceptionSuccess,
    };
    initiateRedTransmission(game);
  } else {
    if (!game.redUsedCodes.includes(actualStr)) game.redUsedCodes.push(actualStr);
    completeRound(game);
  }
}

function completeRound(game: InternalGameState) {
  const blueEncryptor = game.players.find((p) => p.id === game.blueEncryptorOrder[game.blueEncryptorIndex]);
  const redEncryptor = game.players.find((p) => p.id === game.redEncryptorOrder[game.redEncryptorIndex]);
  const redTrans = game.currentTransmission!;

  const currentRecord: RoundRecord = {
    roundNumber: game.round,
    blue: {
      encryptorId: blueEncryptor?.id || '',
      encryptorName: blueEncryptor?.name || 'Blue Encryptor',
      clues: game.bluePreparedClues!,
      actualCode: game.blueCurrentCode!,
      decodingGuess: game.lastBlueTransmissionRecord?.decodingGuess || null,
      decodingSuccess: game.lastBlueTransmissionRecord?.decodingSuccess ?? true,
      interceptionGuess: game.lastBlueTransmissionRecord?.interceptionGuess || null,
      interceptionSuccess: game.lastBlueTransmissionRecord?.interceptionSuccess ?? null,
    },
    red: {
      encryptorId: redEncryptor?.id || '',
      encryptorName: redEncryptor?.name || 'Red Encryptor',
      clues: redTrans.clues,
      actualCode: redTrans.actualCodeRevealed!,
      decodingGuess: redTrans.decodingGuess,
      decodingSuccess: redTrans.decodingSuccess ?? false,
      interceptionGuess: redTrans.interceptionGuess,
      interceptionSuccess: redTrans.interceptionSuccess,
    },
  };

  game.history.push(currentRecord);

  // Check victory conditions
  const blueInterceptions = game.scores.blue.interceptions;
  const blueMiscomms = game.scores.blue.miscommunications;
  const redInterceptions = game.scores.red.interceptions;
  const redMiscomms = game.scores.red.miscommunications;

  const blueWinsTrigger = blueInterceptions >= 2 || redMiscomms >= 2;
  const redWinsTrigger = redInterceptions >= 2 || blueMiscomms >= 2;

  addSystemMessage(game, `Round ${game.round} concluded. Scores: Blue [${blueInterceptions} Int, ${blueMiscomms} Mis] vs Red [${redInterceptions} Int, ${redMiscomms} Mis].`);

  if (blueWinsTrigger && !redWinsTrigger) {
    declareWinner(game, 'blue', blueInterceptions >= 2 ? 'Blue earned 2 Interception tokens!' : 'Red accumulated 2 Miscommunication tokens!');
    return;
  }
  if (redWinsTrigger && !blueWinsTrigger) {
    declareWinner(game, 'red', redInterceptions >= 2 ? 'Red earned 2 Interception tokens!' : 'Blue accumulated 2 Miscommunication tokens!');
    return;
  }

  // Conflict / Both triggered or Round 8 reached
  if ((blueWinsTrigger && redWinsTrigger) || game.round >= game.maxRounds) {
    // Step 1: Compare Net Score: Interceptions minus Miscommunications
    const blueNet = blueInterceptions - blueMiscomms;
    const redNet = redInterceptions - redMiscomms;

    if (blueNet > redNet) {
      declareWinner(game, 'blue', `Tiebreaker: Blue has higher net score (${blueNet} vs ${redNet}).`);
      return;
    } else if (redNet > blueNet) {
      declareWinner(game, 'red', `Tiebreaker: Red has higher net score (${redNet} vs ${blueNet}).`);
      return;
    } else {
      // Step 2: Tiebreaker keyword deduction phase!
      initiateTiebreakerKeywords(game);
      return;
    }
  }

  // Game continues: advance round and rotate Encryptors!
  game.round += 1;
  game.blueEncryptorIndex = (game.blueEncryptorIndex + 1) % game.blueEncryptorOrder.length;
  game.redEncryptorIndex = (game.redEncryptorIndex + 1) % game.redEncryptorOrder.length;

  startNewRound(game);
}

function initiateTiebreakerKeywords(game: InternalGameState) {
  game.phase = 'TIEBREAKER_KEYWORDS';
  game.tiebreaker = {
    blueKeywordGuesses: { 1: '', 2: '', 3: '', 4: '' },
    redKeywordGuesses: { 1: '', 2: '', 3: '', 4: '' },
    blueLocked: false,
    redLocked: false,
    blueKeywordMatches: 0,
    redKeywordMatches: 0,
    confirmedAdjustments: {},
  };
  addSystemMessage(game, `🚨 ULTIMATE TIEBREAKER INITIATED! Both teams must privately deduce and submit all 4 opponent keywords.`);
}

export function submitTiebreakerGuesses(
  game: InternalGameState,
  playerId: string,
  guesses: { 1: string; 2: string; 3: string; 4: string }
): { success: boolean; error?: string } {
  if (game.phase !== 'TIEBREAKER_KEYWORDS' || !game.tiebreaker) {
    return { success: false, error: 'Not in tiebreaker phase.' };
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.team) return { success: false, error: 'Player not recognized.' };

  const isBlue = player.team === 'blue';
  if (isBlue) {
    if (game.tiebreaker.blueLocked) return { success: false, error: 'Blue keyword guesses already locked.' };
    game.tiebreaker.blueKeywordGuesses = { ...guesses };
    game.tiebreaker.blueLocked = true;
    addSystemMessage(game, `Blue team locked their guesses for Red's keywords!`);
  } else {
    if (game.tiebreaker.redLocked) return { success: false, error: 'Red keyword guesses already locked.' };
    game.tiebreaker.redKeywordGuesses = { ...guesses };
    game.tiebreaker.redLocked = true;
    addSystemMessage(game, `Red team locked their guesses for Blue's keywords!`);
  }

  // Once both teams lock: evaluate matches
  if (game.tiebreaker.blueLocked && game.tiebreaker.redLocked) {
    evaluateTiebreaker(game);
  }

  store.setGame(game);
  return { success: true };
}

function evaluateTiebreaker(game: InternalGameState) {
  if (!game.tiebreaker) return;

  // Blue guessed Red keywords: compare with game.redKeywords
  let blueMatches = 0;
  for (let i = 1; i <= 4; i++) {
    const guess = (game.tiebreaker.blueKeywordGuesses[i as 1 | 2 | 3 | 4] || '').trim().toLowerCase();
    const actual = (game.redKeywords[i as 1 | 2 | 3 | 4] || '').trim().toLowerCase();
    const override = game.tiebreaker.confirmedAdjustments?.[`blue_${i}`];
    if (override !== undefined ? override : guess === actual) {
      blueMatches++;
    }
  }

  // Red guessed Blue keywords: compare with game.blueKeywords
  let redMatches = 0;
  for (let i = 1; i <= 4; i++) {
    const guess = (game.tiebreaker.redKeywordGuesses[i as 1 | 2 | 3 | 4] || '').trim().toLowerCase();
    const actual = (game.blueKeywords[i as 1 | 2 | 3 | 4] || '').trim().toLowerCase();
    const override = game.tiebreaker.confirmedAdjustments?.[`red_${i}`];
    if (override !== undefined ? override : guess === actual) {
      redMatches++;
    }
  }

  game.tiebreaker.blueKeywordMatches = blueMatches;
  game.tiebreaker.redKeywordMatches = redMatches;

  if (blueMatches > redMatches) {
    declareWinner(game, 'blue', `Tiebreaker victory: Blue deduced ${blueMatches} opponent keywords vs Red's ${redMatches}!`);
  } else if (redMatches > blueMatches) {
    declareWinner(game, 'red', `Tiebreaker victory: Red deduced ${redMatches} opponent keywords vs Blue's ${blueMatches}!`);
  } else {
    declareWinner(game, 'tie', `Shared victory: Both teams deduced exactly ${blueMatches} opponent keywords!`);
  }
}

export function confirmTiebreakerOverride(
  game: InternalGameState,
  hostPlayerId: string,
  key: string,
  valid: boolean
): { success: boolean; error?: string } {
  const host = game.players.find((p) => p.id === hostPlayerId);
  if (!host || !host.isHost) {
    return { success: false, error: 'Only the host can confirm spelling or keyword overrides.' };
  }
  if (!game.tiebreaker) {
    return { success: false, error: 'Not in tiebreaker phase.' };
  }

  if (!game.tiebreaker.confirmedAdjustments) {
    game.tiebreaker.confirmedAdjustments = {};
  }
  game.tiebreaker.confirmedAdjustments[key] = valid;

  // Re-evaluate tiebreaker
  evaluateTiebreaker(game);
  store.setGame(game);
  return { success: true };
}

function declareWinner(game: InternalGameState, winner: Team | 'tie', reason: string) {
  game.phase = 'GAME_OVER';
  game.winner = winner;
  game.endingReason = reason;

  addSystemMessage(game, `🏆 GAME OVER! ${winner === 'tie' ? 'Shared Victory!' : `${winner.toUpperCase()} WINS!`} Reason: ${reason}`);
}

export function updateTeamNotes(
  game: InternalGameState,
  playerId: string,
  digit: 1 | 2 | 3 | 4,
  text: string
): { success: boolean; error?: string } {
  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.team) return { success: false, error: 'Player not recognized.' };

  // Encryptor note restriction:
  // "While a team’s own transmission is unresolved, its Encryptor cannot send chat messages, reactions, notes, or suggestions that could help decode that transmission."
  if (
    game.currentTransmission &&
    !game.currentTransmission.resolved &&
    player.team === game.currentTransmission.team &&
    player.id === game.currentTransmission.encryptorId
  ) {
    return { success: false, error: 'Encryptor notes are blocked while your transmission is active.' };
  }

  if (player.team === 'blue') {
    game.blueNotes[digit] = text;
  } else {
    game.redNotes[digit] = text;
  }

  store.setGame(game);
  return { success: true };
}

export function sendChatMessage(
  game: InternalGameState,
  playerId: string,
  text: string
): { success: boolean; error?: string } {
  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.team) return { success: false, error: 'Player not on a team.' };

  const cleanText = text.trim();
  if (!cleanText) return { success: false, error: 'Message cannot be empty.' };

  // Encryptor chat restriction:
  // "While a team's own transmission is unresolved, its Encryptor cannot send chat messages, reactions, notes, or suggestions that could help decode that transmission."
  if (
    game.currentTransmission &&
    !game.currentTransmission.resolved &&
    player.team === game.currentTransmission.team &&
    player.id === game.currentTransmission.encryptorId
  ) {
    return {
      success: false,
      error: 'Encryptor transmission blackout in effect: you cannot communicate with your team until your code is resolved.',
    };
  }

  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    team: player.team,
    senderId: player.id,
    senderName: player.name,
    text: cleanText,
    isSystem: false,
    timestamp: Date.now(),
  };

  game.chatMessages.push(msg);
  store.setGame(game);
  return { success: true };
}

export function reportDisputedClue(
  game: InternalGameState,
  playerId: string,
  clueIndex: number,
  clueText: string,
  reason: string
): { success: boolean; error?: string } {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: 'Player not recognized.' };

  const trans = game.currentTransmission;
  const transmittingTeam = trans ? trans.team : 'blue';

  const report: DisputedClue = {
    id: `dispute_${Date.now()}`,
    round: game.round,
    transmittingTeam,
    clueIndex,
    clueText,
    reportedByPlayerName: player.name,
    reason: reason.trim() || 'Suspected rule violation',
    status: 'pending',
  };

  game.disputedClues.push(report);
  addSystemMessage(game, `⚠️ Clue dispute filed by ${player.name} on "${clueText}": ${report.reason}`);
  store.setGame(game);
  return { success: true };
}

/**
 * Filter game state for viewer security.
 * CRITICAL Decrypto information boundaries:
 * 1. Opponent keywords are strictly hidden until GAME_OVER or tiebreaker comparison.
 * 2. Unrevealed secret codes are hidden from EVERYONE except the team's active Encryptor.
 * 3. Pending guesses are hidden from opponents until BOTH required guesses are locked.
 * 4. Opponent private chat, notes, and suggestions are NEVER sent.
 */
export function filterStateForPlayer(game: InternalGameState, playerId: string): FilteredGameState {
  const player = game.players.find((p) => p.id === playerId);
  const myTeam = player?.team || null;

  const isGameOver = game.phase === 'GAME_OVER';
  const isTiebreakerRevealed = game.phase === 'TIEBREAKER_KEYWORDS' && game.tiebreaker?.blueLocked && game.tiebreaker?.redLocked;

  // Our keywords vs opponent keywords
  let ourKeywords: { 1: string; 2: string; 3: string; 4: string } | null = null;
  let opponentKeywordsRevealed: { 1: string; 2: string; 3: string; 4: string } | null = null;

  if (myTeam === 'blue') {
    ourKeywords = game.blueKeywords;
    if (isGameOver || isTiebreakerRevealed) {
      opponentKeywordsRevealed = game.redKeywords;
    }
  } else if (myTeam === 'red') {
    ourKeywords = game.redKeywords;
    if (isGameOver || isTiebreakerRevealed) {
      opponentKeywordsRevealed = game.blueKeywords;
    }
  } else {
    // Spectator / no team
    if (isGameOver) {
      ourKeywords = game.blueKeywords;
      opponentKeywordsRevealed = game.redKeywords;
    }
  }

  // Active encryptors
  const blueEncryptorId = game.blueEncryptorOrder[game.blueEncryptorIndex] || null;
  const redEncryptorId = game.redEncryptorOrder[game.redEncryptorIndex] || null;

  // Secret code for current round:
  // ONLY given to the team's active Encryptor!
  let mySecretCode: [number, number, number] | null = null;
  if (playerId === blueEncryptorId) {
    mySecretCode = game.blueCurrentCode;
  } else if (playerId === redEncryptorId) {
    mySecretCode = game.redCurrentCode;
  }

  // Filter transmission data
  let filteredTransmission: TransmissionData | null = null;
  if (game.currentTransmission) {
    const t = game.currentTransmission;
    const isTransmitting = myTeam === t.team;
    const isIntercepting = myTeam && myTeam !== t.team;

    filteredTransmission = {
      team: t.team,
      encryptorId: t.encryptorId,
      encryptorName: t.encryptorName,
      clues: t.clues,
      decodingSubmitterId: t.decodingSubmitterId,
      interceptionSubmitterId: t.interceptionSubmitterId,
      decodingLocked: t.decodingLocked,
      interceptionLocked: t.interceptionLocked,
      resolved: t.resolved,

      // Guess visibility:
      // If resolved: both guesses are public to all.
      // If not resolved:
      // - Decoding guess is only visible to transmitting team once entered/locked
      // - Interception guess is only visible to intercepting team once entered/locked
      decodingGuess: t.resolved ? t.decodingGuess : isTransmitting ? t.decodingGuess : null,
      interceptionGuess: t.resolved ? t.interceptionGuess : isIntercepting ? t.interceptionGuess : null,

      actualCodeRevealed: t.resolved ? t.actualCodeRevealed : null,
      interceptionSuccess: t.resolved ? t.interceptionSuccess : null,
      decodingSuccess: t.resolved ? t.decodingSuccess : null,
    };
  }

  // Notes: only own team
  const ourNotes = myTeam === 'red' ? game.redNotes : game.blueNotes;

  // Suggestions: only own team
  const activeSuggestionsMap = myTeam === 'red' ? game.redSuggestions : game.blueSuggestions;
  const activeSuggestions = Object.values(activeSuggestionsMap);

  // Chat: only own team messages + system messages
  const chatMessages = game.chatMessages.filter((m) => m.isSystem || (myTeam && m.team === myTeam));

  // Public player representations (sanitize sessionIds)
  const publicPlayers: Player[] = game.players.map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    isHost: p.isHost,
    isReady: p.isReady,
    connected: p.connected,
    joinedAt: p.joinedAt,
  }));

  return {
    lobbyId: game.lobbyId,
    mode: game.mode,
    phase: game.phase,
    round: game.round,
    maxRounds: game.maxRounds,
    hostId: game.hostId,
    players: publicPlayers,
    myPlayerId: playerId,
    myTeam,

    blueEncryptorId,
    redEncryptorId,

    currentTransmission: filteredTransmission,

    blueCluesSubmitted: !!game.bluePreparedClues,
    redCluesSubmitted: !!game.redPreparedClues,

    ourKeywords,
    opponentKeywordsRevealed,
    mySecretCode,

    scores: game.scores,

    blueCluesHistory: game.blueCluesHistory,
    redCluesHistory: game.redCluesHistory,

    ourNotes,
    activeSuggestions,
    chatMessages,
    history: game.history,

    blueUsedCodes: game.blueUsedCodes,
    redUsedCodes: game.redUsedCodes,

    winner: game.winner,
    endingReason: game.endingReason,
    tiebreaker: game.tiebreaker,
    disputedClues: game.disputedClues,
  };
}
