import fs from 'fs';
import path from 'path';
import {
  ClueItem,
  ChatMessage,
  DisputedClue,
  GameMode,
  GamePhase,
  Player,
  PlayerSuggestion,
  PublicScore,
  RoundRecord,
  Team,
  TeamNotes,
  TiebreakerData,
  TransmissionData,
} from '../src/types.js';

export interface InternalPlayer extends Player {
  sessionId: string;
}

export interface InternalGameState {
  lobbyId: string;
  mode: GameMode;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  hostId: string;
  players: InternalPlayer[];

  blueKeywords: { 1: string; 2: string; 3: string; 4: string };
  redKeywords: { 1: string; 2: string; 3: string; 4: string };

  blueEncryptorOrder: string[];
  redEncryptorOrder: string[];
  blueEncryptorIndex: number;
  redEncryptorIndex: number;

  blueCurrentCode: [number, number, number] | null;
  redCurrentCode: [number, number, number] | null;

  bluePreparedClues: [string, string, string] | null;
  redPreparedClues: [string, string, string] | null;

  currentTransmission: TransmissionData | null;

  scores: {
    blue: PublicScore;
    red: PublicScore;
  };

  blueCluesHistory: { 1: ClueItem[]; 2: ClueItem[]; 3: ClueItem[]; 4: ClueItem[] };
  redCluesHistory: { 1: ClueItem[]; 2: ClueItem[]; 3: ClueItem[]; 4: ClueItem[] };

  blueNotes: TeamNotes;
  redNotes: TeamNotes;

  blueSuggestions: Record<string, PlayerSuggestion>;
  redSuggestions: Record<string, PlayerSuggestion>;

  chatMessages: ChatMessage[];
  history: RoundRecord[];

  lastBlueTransmissionRecord?: {
    decodingGuess: [number, number, number] | null;
    decodingSuccess: boolean;
    interceptionGuess: [number, number, number] | null;
    interceptionSuccess: boolean | null;
  };

  blueUsedCodes: string[];
  redUsedCodes: string[];

  winner: Team | 'tie' | null;
  endingReason: string | null;

  tiebreaker: TiebreakerData | null;
  disputedClues: DisputedClue[];

  createdAt: number;
  updatedAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'decrypto_games.json');

class GameStore {
  private games: Map<string, InternalGameState> = new Map();
  private sessionToPlayer: Map<string, { lobbyId: string; playerId: string }> = new Map();
  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Record<string, InternalGameState>;
        for (const [id, game] of Object.entries(parsed)) {
          this.games.set(id, game);
          for (const p of game.players) {
            this.sessionToPlayer.set(p.sessionId, { lobbyId: id, playerId: p.id });
          }
        }
        console.log(`[Store] Loaded ${this.games.size} saved games from disk.`);
      }
    } catch (err) {
      console.error('[Store] Failed to load data from disk:', err);
    }
  }

  public saveToDisk() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;

    try {
      const obj: Record<string, InternalGameState> = {};
      for (const [id, game] of this.games.entries()) {
        obj[id] = game;
      }
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(obj, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('[Store] Error persisting to disk:', err);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.saveToDisk();
      }
    }
  }

  public getGame(lobbyId: string): InternalGameState | undefined {
    return this.games.get(lobbyId);
  }

  public setGame(game: InternalGameState): void {
    game.updatedAt = Date.now();
    this.games.set(game.lobbyId, game);
    for (const p of game.players) {
      this.sessionToPlayer.set(p.sessionId, { lobbyId: game.lobbyId, playerId: p.id });
    }
    this.saveToDisk();
  }

  public getPlayerBySession(sessionId: string): { lobbyId: string; playerId: string } | undefined {
    return this.sessionToPlayer.get(sessionId);
  }

  public registerSession(sessionId: string, lobbyId: string, playerId: string): void {
    this.sessionToPlayer.set(sessionId, { lobbyId, playerId });
  }

  public deleteGame(lobbyId: string): void {
    this.games.delete(lobbyId);
    this.saveToDisk();
  }
}

export const store = new GameStore();
