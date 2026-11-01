import React, { useState } from 'react';
import { FilteredGameState, GameMode, Team } from '../types.js';
import {
  Users,
  Shuffle,
  Play,
  Copy,
  Check,
  Shield,
  HelpCircle,
  Radio,
  Wifi,
  WifiOff,
  UserCheck,
} from 'lucide-react';

interface LobbyViewProps {
  gameState: FilteredGameState;
  onSetTeam: (team: Team) => void;
  onRandomiseTeams: () => void;
  onSetMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onOpenRules: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  onSetTeam,
  onRandomiseTeams,
  onSetMode,
  onStartGame,
  onOpenRules,
}) => {
  const { lobbyId, mode, players, myPlayerId, hostId } = gameState;
  const isHost = myPlayerId === hostId;

  const [copied, setCopied] = useState(false);

  const bluePlayers = players.filter((p) => p.team === 'blue');
  const redPlayers = players.filter((p) => p.team === 'red');
  const unassigned = players.filter((p) => !p.team);

  const canStart = bluePlayers.length >= 2 && redPlayers.length >= 2 && players.length <= 8;

  const copyInviteLink = () => {
    const url = `${window.location.origin}?lobby=${lobbyId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-mono text-stone-800 dark:text-stone-100 space-y-6">
      {/* Top Banner & Lobby Code */}
      <div className="bg-stone-900 border-2 border-stone-700 rounded-xl p-5 shadow-xl text-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white">
              DECRYPTO OPERATIONS ROOM
            </h1>
          </div>
          <p className="text-xs text-stone-400 font-mono">
            Assemble 4 to 8 agents into Blue & Red intelligence units (min 2 per team).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
          <div className="text-right">
            <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">
              Lobby Frequency Code
            </span>
            <span className="text-xl font-black tracking-widest text-amber-400 font-mono">
              {lobbyId}
            </span>
          </div>
          <button
            type="button"
            onClick={copyInviteLink}
            className="p-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Copy shareable invite link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Game Mode Configuration (Host only for editing) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Code-Generation Protocol Mode
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="text-xs text-stone-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Clue Rules Manual
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Traditional */}
          <div
            onClick={() => isHost && onSetMode('traditional')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              mode === 'traditional'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-stone-50 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 opacity-60'
            } ${!isHost ? 'cursor-default' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase font-mono text-stone-900 dark:text-stone-100">
                1. Traditional (Official)
              </span>
              {mode === 'traditional' && (
                <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">
                  Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              Draw independently each round. Repeated sequences (e.g. 4-2-1 in round 1 and round 4)
              are permitted.
            </p>
          </div>

          {/* No-Repeat */}
          <div
            onClick={() => isHost && onSetMode('no-repeat')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              mode === 'no-repeat'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-stone-50 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 opacity-60'
            } ${!isHost ? 'cursor-default' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase font-mono text-stone-900 dark:text-stone-100">
                2. No-Repeat House Rule
              </span>
              {mode === 'no-repeat' && (
                <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">
                  Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              Sequences are never reused within the same team. Eliminates previously drawn codes from
              the remaining pool.
            </p>
          </div>
        </div>
        {!isHost && (
          <p className="text-[10px] text-stone-400 mt-2 italic text-right">
            Host controls the code-generation mode.
          </p>
        )}
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blue Team */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                  Blue Team ({bluePlayers.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSetTeam('blue')}
                className="text-[11px] font-bold px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Join Blue
              </button>
            </div>

            <div className="space-y-2 min-h-[140px]">
              {bluePlayers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-stone-400 text-xs italic py-8">
                  No agents on Blue team yet (min 2 required)
                </div>
              ) : (
                bluePlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                        {p.name}
                      </span>
                      {p.id === myPlayerId && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                      {p.isHost && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500">
                      {p.connected ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px]">
                          <Wifi className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-stone-400 text-[10px]">
                          <WifiOff className="w-3 h-3" /> Disconnected
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800 text-[11px] font-mono text-stone-500 flex justify-between">
            <span>Minimum required: 2 players</span>
            <span className={bluePlayers.length >= 2 ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
              {bluePlayers.length >= 2 ? 'Ready' : 'Needs players'}
            </span>
          </div>
        </div>

        {/* Red Team */}
        <div className="bg-red-50/70 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-red-200 dark:border-red-800/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-900 dark:text-red-200">
                  Red Team ({redPlayers.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSetTeam('red')}
                className="text-[11px] font-bold px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Join Red
              </button>
            </div>

            <div className="space-y-2 min-h-[140px]">
              {redPlayers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-stone-400 text-xs italic py-8">
                  No agents on Red team yet (min 2 required)
                </div>
              ) : (
                redPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-red-200 dark:border-red-900 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                        {p.name}
                      </span>
                      {p.id === myPlayerId && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                      {p.isHost && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500">
                      {p.connected ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px]">
                          <Wifi className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-stone-400 text-[10px]">
                          <WifiOff className="w-3 h-3" /> Disconnected
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-red-200 dark:border-red-800 text-[11px] font-mono text-stone-500 flex justify-between">
            <span>Minimum required: 2 players</span>
            <span className={redPlayers.length >= 2 ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
              {redPlayers.length >= 2 ? 'Ready' : 'Needs players'}
            </span>
          </div>
        </div>
      </div>

      {/* Host Controls & Start Bar */}
      <div className="bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              type="button"
              onClick={onRandomiseTeams}
              className="px-3.5 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 font-mono text-xs font-semibold flex items-center gap-2 transition-colors"
              title="Evenly balance players across both teams"
            >
              <Shuffle className="w-4 h-4 text-amber-600" />
              <span>Randomise Teams</span>
            </button>
          )}

          <div className="text-xs text-stone-500 font-mono">
            <span>Total Agents: </span>
            <strong className="text-stone-900 dark:text-stone-100 font-mono">
              {players.length} / 8
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isHost ? (
            <button
              type="button"
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Mission</span>
            </button>
          ) : (
            <div className="text-xs text-stone-500 font-mono italic">
              Waiting for host to start the mission...
            </div>
          )}
        </div>
      </div>

      {!canStart && (
        <p className="text-center text-xs font-mono text-amber-600 dark:text-amber-400">
          * Decrypto requires at least 2 players on Blue and 2 players on Red to begin (4 players minimum).
        </p>
      )}
    </div>
  );
};
