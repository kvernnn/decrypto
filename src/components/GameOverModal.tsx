import React from 'react';
import { FilteredGameState, Team } from '../types.js';
import { Trophy, RefreshCw, Eye, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GameOverModalProps {
  gameState: FilteredGameState;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onPlayAgain }) => {
  const { winner, endingReason, scores, history, ourKeywords, opponentKeywordsRevealed, myTeam } = gameState;

  const winnerTitle =
    winner === 'tie'
      ? 'SHARED VICTORY!'
      : winner === 'blue'
      ? 'BLUE TEAM WINS!'
      : 'RED TEAM WINS!';

  const isWinner = winner === myTeam;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-stone-900 border-2 border-amber-500 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-stone-200 font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div
          className={`p-6 text-center border-b ${
            winner === 'blue'
              ? 'bg-blue-950/80 border-blue-700'
              : winner === 'red'
              ? 'bg-red-950/80 border-red-700'
              : 'bg-amber-950/80 border-amber-700'
          }`}
        >
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-white font-mono">
            {winnerTitle}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-mono mt-1 max-w-lg mx-auto">
            {endingReason}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Final Tokens */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-950 p-3 rounded-lg border border-blue-900/60">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-xs block mb-1">
                Blue Team Final Record
              </span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Eye className="w-3.5 h-3.5" /> Interceptions: {scores.blue.interceptions}/2
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Miscomms: {scores.blue.miscommunications}/2
                </span>
              </div>
            </div>

            <div className="bg-stone-950 p-3 rounded-lg border border-red-900/60">
              <span className="font-bold text-red-400 uppercase tracking-wider text-xs block mb-1">
                Red Team Final Record
              </span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Eye className="w-3.5 h-3.5" /> Interceptions: {scores.red.interceptions}/2
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Miscomms: {scores.red.miscommunications}/2
                </span>
              </div>
            </div>
          </div>

          {/* Fully Revealed Keywords for Both Teams */}
          <div className="space-y-3 bg-stone-950 p-4 rounded-lg border border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Intelligence Dossier: Secret Keywords Revealed</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-400 block mb-1">BLUE KEYWORDS:</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                  {([1, 2, 3, 4] as const).map((n) => {
                    const w = myTeam === 'blue' ? ourKeywords?.[n] : opponentKeywordsRevealed?.[n];
                    return (
                      <div key={n} className="bg-blue-950/60 border border-blue-800/80 px-2 py-1 rounded">
                        <span className="text-blue-400 font-bold mr-1">#{n}:</span>
                        <span className="font-bold text-white uppercase">{w || '???'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-red-400 block mb-1">RED KEYWORDS:</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                  {([1, 2, 3, 4] as const).map((n) => {
                    const w = myTeam === 'red' ? ourKeywords?.[n] : opponentKeywordsRevealed?.[n];
                    return (
                      <div key={n} className="bg-red-950/60 border border-red-800/80 px-2 py-1 rounded">
                        <span className="text-red-400 font-bold mr-1">#{n}:</span>
                        <span className="font-bold text-white uppercase">{w || '???'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Past Rounds Summary */}
          <div className="space-y-2 bg-stone-950 p-4 rounded-lg border border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Mission Round Chronology ({history.length} Rounds)
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
              {history.map((h) => (
                <div
                  key={h.roundNumber}
                  className="p-2 rounded bg-stone-900 border border-stone-800 flex items-center justify-between text-[11px]"
                >
                  <span className="font-bold text-stone-300">R{h.roundNumber}</span>
                  <div className="text-blue-400">
                    Blue [{h.blue.actualCode.join('-')}]: {h.blue.decodingSuccess ? 'Decoded' : 'Miscomm'}
                    {h.blue.interceptionSuccess ? ' | Intercepted!' : ''}
                  </div>
                  <div className="text-red-400">
                    Red [{h.red.actualCode.join('-')}]: {h.red.decodingSuccess ? 'Decoded' : 'Miscomm'}
                    {h.red.interceptionSuccess ? ' | Intercepted!' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-4 border-t border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onPlayAgain}
            className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Return to Lobby / New Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
