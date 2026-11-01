import React from 'react';
import { FilteredGameState, Team } from '../types.js';
import {
  FileText,
  Shield,
  HelpCircle,
  Wifi,
  WifiOff,
  Radio,
  Layers,
  Flag,
} from 'lucide-react';

interface GameBoardHeaderProps {
  gameState: FilteredGameState;
  sheetType: 'our' | 'opponent';
  onSheetChange: (sheet: 'our' | 'opponent') => void;
  onOpenRules: () => void;
  connected: boolean;
}

export const GameBoardHeader: React.FC<GameBoardHeaderProps> = ({
  gameState,
  sheetType,
  onSheetChange,
  onOpenRules,
  connected,
}) => {
  const { lobbyId, mode, round, maxRounds, phase, myTeam, disputedClues } = gameState;
  const isOurSheet = sheetType === 'our';

  const pendingDisputes = disputedClues.filter((d) => d.status === 'pending');

  return (
    <header className="w-full bg-stone-900 border-b border-stone-800 text-stone-100 font-mono shadow-md px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Lobby info */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-black text-base sm:text-lg tracking-widest uppercase text-white font-mono">
              DECRYPTO
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-950 px-2 py-0.5 rounded border border-stone-800 text-xs text-stone-400">
            <span>FREQ:</span>
            <span className="font-bold text-amber-400">{lobbyId}</span>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1 text-[11px]">
            {connected ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[10px]" title="Connected to server">
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1 text-[10px] animate-pulse" title="Reconnecting...">
                <WifiOff className="w-3 h-3" /> Reconnecting
              </span>
            )}
          </div>
        </div>

        {/* Sheet Tabs: "Our Sheet" vs "Opponent Sheet" */}
        <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 shadow-inner">
          <button
            type="button"
            onClick={() => onSheetChange('our')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              isOurSheet
                ? myTeam === 'blue'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-red-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Our Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => onSheetChange('opponent')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              !isOurSheet
                ? myTeam === 'blue'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-blue-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Opponent Sheet</span>
          </button>
        </div>

        {/* Round & Mode Info & Rules Button */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-stone-950 px-2.5 py-1 rounded border border-stone-800 flex items-center gap-1.5">
            <span className="text-stone-400">ROUND:</span>
            <span className="font-bold text-amber-400">{round}/{maxRounds}</span>
          </div>

          <div className="bg-stone-950 px-2.5 py-1 rounded border border-stone-800 text-[11px] text-stone-400 hidden md:block">
            {mode === 'traditional' ? 'Traditional' : 'No-Repeat'}
          </div>

          {pendingDisputes.length > 0 && (
            <button
              type="button"
              onClick={onOpenRules}
              className="bg-amber-950 text-amber-300 border border-amber-700 px-2 py-1 rounded flex items-center gap-1 text-[11px] animate-pulse"
              title={`${pendingDisputes.length} active clue dispute`}
            >
              <Flag className="w-3 h-3 text-amber-400" />
              <span>{pendingDisputes.length} Dispute</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenRules}
            className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Read clue rules manual"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
