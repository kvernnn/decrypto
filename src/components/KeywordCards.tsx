import React from 'react';
import { Lock, EyeOff, ShieldCheck } from 'lucide-react';
import { Team } from '../types.js';

interface KeywordCardsProps {
  sheetType: 'our' | 'opponent';
  ourKeywords: { 1: string; 2: string; 3: string; 4: string } | null;
  opponentKeywordsRevealed: { 1: string; 2: string; 3: string; 4: string } | null;
  viewerTeam: Team | null;
}

export const KeywordCards: React.FC<KeywordCardsProps> = ({
  sheetType,
  ourKeywords,
  opponentKeywordsRevealed,
  viewerTeam,
}) => {
  const isOurSheet = sheetType === 'our';
  const effectiveTeam = isOurSheet ? viewerTeam : (viewerTeam === 'blue' ? 'red' : 'blue');

  const getWordForSlot = (num: 1 | 2 | 3 | 4) => {
    if (isOurSheet) {
      return ourKeywords?.[num] || `KEYWORD ${num}`;
    }
    // Opponent sheet
    if (opponentKeywordsRevealed?.[num]) {
      return opponentKeywordsRevealed[num];
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {([1, 2, 3, 4] as const).map((num) => {
          const word = getWordForSlot(num);
          const isRevealed = !!word;

          return (
            <div
              key={num}
              className={`relative overflow-hidden rounded-md border p-2 sm:p-3 text-center transition-all shadow-sm ${
                effectiveTeam === 'blue'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                  : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800'
              } ${!isRevealed ? 'border-dashed' : ''}`}
            >
              {/* Paper Top Tab / Brass rivet */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-1 mb-1.5">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-mono font-black ${
                    effectiveTeam === 'blue'
                      ? 'bg-blue-600 text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                      : 'bg-red-600 text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  {num}
                </span>

                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500">
                  {isOurSheet ? 'Our Secret' : 'Target Code'}
                </span>
              </div>

              {/* Keyword Display */}
              <div className="min-h-[38px] sm:min-h-[44px] flex items-center justify-center">
                {isRevealed ? (
                  <div className="animate-in fade-in duration-300">
                    <span className="text-xs sm:text-base font-black tracking-wider uppercase font-mono text-stone-900 dark:text-stone-100">
                      {word}
                    </span>
                    {!isOurSheet && (
                      <span className="block text-[9px] text-emerald-600 font-mono font-medium">
                        (REVEALED)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 py-1">
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                      <span className="tracking-widest">••••••</span>
                    </div>
                    <span className="text-[9px] text-stone-500 font-mono flex items-center gap-0.5">
                      <EyeOff className="w-2.5 h-2.5" /> Concealed
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom decorative bar */}
              <div
                className={`h-0.5 w-full mt-1 rounded-full ${
                  effectiveTeam === 'blue' ? 'bg-blue-400/40' : 'bg-red-400/40'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
