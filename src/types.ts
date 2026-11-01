export type Team = 'blue' | 'red';

export type GameMode = 'traditional' | 'no-repeat';

export type GamePhase =
  | 'LOBBY'
  | 'ROUND_CLUES'
  | 'TRANSMISSION_BLUE'
  | 'TRANSMISSION_RED'
  | 'TIEBREAKER_KEYWORDS'
  | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  team: Team | null;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  joinedAt: number;
}

export interface ClueItem {
  round: number;
  digit: number;
  clue: string;
  encryptorName: string;
}

export interface TeamNotes {
  1: string;
  2: string;
  3: string;
  4: string;
}

export interface PlayerSuggestion {
  playerId: string;
  playerName: string;
  guess: [number, number, number];
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  team: Team;
  senderId: string;
  senderName: string;
  text: string;
  isSystem: boolean;
  timestamp: number;
}

export interface TransmissionData {
  team: Team;
  encryptorId: string;
  encryptorName: string;
  clues: [string, string, string];
  decodingSubmitterId: string;
  interceptionSubmitterId: string;
  decodingLocked: boolean;
  interceptionLocked: boolean;
  resolved: boolean;
  // Private guesses before lock, public/revealed after lock
  decodingGuess: [number, number, number] | null;
  interceptionGuess: [number, number, number] | null;
  actualCodeRevealed: [number, number, number] | null;
  interceptionSuccess: boolean | null;
  decodingSuccess: boolean | null;
}

export interface RoundTransmissionRecord {
  encryptorId: string;
  encryptorName: string;
  clues: [string, string, string];
  actualCode: [number, number, number];
  decodingGuess: [number, number, number] | null;
  decodingSuccess: boolean;
  interceptionGuess: [number, number, number] | null;
  interceptionSuccess: boolean | null;
}

export interface RoundRecord {
  roundNumber: number;
  blue: RoundTransmissionRecord;
  red: RoundTransmissionRecord;
}

export interface DisputedClue {
  id: string;
  round: number;
  transmittingTeam: Team;
  clueIndex: number;
  clueText: string;
  reportedByPlayerName: string;
  reason: string;
  status: 'pending' | 'resolved';
}

export interface TiebreakerData {
  blueKeywordGuesses: { 1: string; 2: string; 3: string; 4: string };
  redKeywordGuesses: { 1: string; 2: string; 3: string; 4: string };
  blueLocked: boolean;
  redLocked: boolean;
  blueKeywordMatches?: number;
  redKeywordMatches?: number;
  confirmedAdjustments?: Record<string, boolean>; // e.g. "blue_1": true
}

export interface PublicScore {
  interceptions: number;
  miscommunications: number;
}

export interface FilteredGameState {
  lobbyId: string;
  mode: GameMode;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  hostId: string;
  players: Player[];
  myPlayerId: string;
  myTeam: Team | null;

  // Encryptors for current round
  blueEncryptorId: string | null;
  redEncryptorId: string | null;

  // Active transmission info
  currentTransmission: TransmissionData | null;

  // Ready states during ROUND_CLUES
  blueCluesSubmitted: boolean;
  redCluesSubmitted: boolean;

  // Keywords:
  // For own team, always visible during game.
  // For opponent team, only visible if GAME_OVER or tiebreaker reveal!
  ourKeywords: { 1: string; 2: string; 3: string; 4: string } | null;
  opponentKeywordsRevealed: { 1: string; 2: string; 3: string; 4: string } | null;

  // Secret code for current round:
  // Only non-null for the team's active Encryptor while transmission is active / clues phase
  mySecretCode: [number, number, number] | null;

  // Scores
  scores: {
    blue: PublicScore;
    red: PublicScore;
  };

  // Clue histories by digit (1-4)
  blueCluesHistory: { 1: ClueItem[]; 2: ClueItem[]; 3: ClueItem[]; 4: ClueItem[] };
  redCluesHistory: { 1: ClueItem[]; 2: ClueItem[]; 3: ClueItem[]; 4: ClueItem[] };

  // Team notes (only own team's notes)
  ourNotes: TeamNotes;

  // Suggestions for current active transmission (only own team's suggestions)
  activeSuggestions: PlayerSuggestion[];

  // Chat messages (only own team's chat + system messages)
  chatMessages: ChatMessage[];

  // Completed rounds history
  history: RoundRecord[];

  // Used codes in no-repeat mode
  blueUsedCodes: string[];
  redUsedCodes: string[];

  // Game over state
  winner: Team | 'tie' | null;
  endingReason: string | null;

  // Tiebreaker state (if in tiebreaker or game over)
  tiebreaker: TiebreakerData | null;

  // Disputed clues
  disputedClues: DisputedClue[];
}

export type WSClientMessage =
  | { type: 'join'; lobbyId: string; sessionId: string; playerName: string }
  | { type: 'set_team'; team: Team }
  | { type: 'randomise_teams' }
  | { type: 'toggle_ready' }
  | { type: 'set_mode'; mode: GameMode }
  | { type: 'start_game' }
  | { type: 'submit_clues'; clues: [string, string, string] }
  | { type: 'suggest_code'; guess: [number, number, number] }
  | { type: 'lock_guess'; guess: [number, number, number] }
  | { type: 'reassign_submitter'; targetPlayerId: string }
  | { type: 'update_notes'; digit: 1 | 2 | 3 | 4; text: string }
  | { type: 'send_chat'; text: string }
  | { type: 'report_clue'; clueIndex: number; clueText: string; reason: string }
  | { type: 'submit_tiebreaker_guesses'; guesses: { 1: string; 2: string; 3: string; 4: string } }
  | { type: 'confirm_tiebreaker_override'; key: string; valid: boolean }
  | { type: 'ping' };

export type WSServerMessage =
  | { type: 'state_update'; state: FilteredGameState }
  | { type: 'chat_message'; message: ChatMessage }
  | { type: 'error'; message: string }
  | { type: 'pong' };
