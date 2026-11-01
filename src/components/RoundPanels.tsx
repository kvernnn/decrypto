import React from 'react';
import { RoundRecord, Team, TransmissionData } from '../types.js';
import { Check, X, Clock, AlertCircle, Flag } from 'lucide-react';

interface RoundPanelsProps {
  sheetType: 'our' | 'opponent';
  viewerTeam: Team | null;
  history: RoundRecord[];
  currentRound: number;
  currentTransmission: TransmissionData | null;
  blueCluesSubmitted: boolean;
  redCluesSubmitted: boolean;
  onReportClue?: (round: number, clueIndex: number, clueText: string) => void;
}

export const RoundPanels: React.FC<RoundPanelsProps> = ({
  sheetType,
  viewerTeam,
  history,
  currentRound,
  currentTransmission,
  onReportClue,
}) => {
  const isOurSheet = sheetType === 'our';
  const targetTeam: Team = isOurSheet ? (viewerTeam || 'blue') : (viewerTeam === 'blue' ? 'red' : 'blue');

  // Total 8 rounds in two columns × 4 rows
  // Left column: Rounds 1 to 4; Right column: Rounds 5 to 8
  const rounds = [1, 2, 3, 4, 5, 6, 7, 8];

  const getRoundData = (rNum: number) => {
    // 1. Check completed history
    const past = history.find((h) => h.roundNumber === rNum);
    if (past) {
      const data = past[targetTeam];
      return {
        status: 'completed' as const,
        encryptorName: data.encryptorName,
        clues: data.clues,
        actualCode: data.actualCode,
        // If our sheet, our guess is decoding guess. If opponent sheet, our guess is interception guess!
        guess: isOurSheet ? data.decodingGuess : data.interceptionGuess,
        isSuccess: isOurSheet ? data.decodingSuccess : data.interceptionSuccess,
        isRound1InterceptionDisabled: !isOurSheet && rNum === 1,
      };
    }

    // 2. Check current round
    if (rNum === currentRound && currentTransmission && currentTransmission.team === targetTeam) {
      const t = currentTransmission;
      return {
        status: t.resolved ? ('completed' as const) : ('active' as const),
        encryptorName: t.encryptorName,
        clues: t.clues,
        actualCode: t.actualCodeRevealed,
        guess: isOurSheet ? t.decodingGuess : t.interceptionGuess,
        isSuccess: isOurSheet ? t.decodingSuccess : t.interceptionSuccess,
        isRound1InterceptionDisabled: !isOurSheet && rNum === 1,
      };
    }

    // 3. Pending future round
    return {
      status: 'pending' as const,
      encryptorName: '---',
      clues: ['', '', ''] as [string, string, string],
      actualCode: null,
      guess: null,
      isSuccess: null,
      isRound1InterceptionDisabled: !isOurSheet && rNum === 1,
    };
  };

  return (
    <div className="w-full bg-amber-50/50 dark:bg-stone-900/60 p-3 sm:p-4 rounded-lg border border-amber-200/80 dark:border-stone-800 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 dark:border-stone-800 pb-2">
        <h3 className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <span>{isOurSheet ? 'Our Transmission Records' : 'Opponent Transmission Records'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded font-normal bg-amber-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            {targetTeam.toUpperCase()} FREQUENCY
          </span>
        </h3>
        <span className="text-[11px] font-mono text-stone-500">
          {isOurSheet ? 'Tracking: Decoding Accuracy' : 'Tracking: Interception Accuracy'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {rounds.map((rNum) => {
          const data = getRoundData(rNum);
          const isCurrent = rNum === currentRound;

          return (
            <div
              key={rNum}
              className={`rounded border p-2.5 sm:p-3 transition-all relative ${
                isCurrent
                  ? 'bg-white dark:bg-stone-800/90 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : data.status === 'completed'
                  ? 'bg-white/90 dark:bg-stone-800/60 border-stone-300 dark:border-stone-700'
                  : 'bg-stone-100/50 dark:bg-stone-900/30 border-dashed border-stone-300 dark:border-stone-800 opacity-70'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700/80 pb-1.5 mb-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    ROUND {rNum}
                  </span>
                  <span className="text-[10px] text-stone-500 truncate max-w-[110px]">
                    Enc: {data.encryptorName}
                  </span>
                </div>

                {/* Status indicator */}
                <div>
                  {data.status === 'completed' ? (
                    data.isRound1InterceptionDisabled ? (
                      <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-500">
                        No Intercept (R1)
                      </span>
                    ) : data.isSuccess ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> {isOurSheet ? 'Decoded' : 'Intercepted!'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <X className="w-3 h-3" /> {isOurSheet ? 'Miscommunication' : 'Failed'}
                      </span>
                    )
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" /> In Progress
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-mono">Pending</span>
                  )}
                </div>
              </div>

              {/* 3 Clue Rows */}
              <div className="space-y-1.5">
                {[0, 1, 2].map((idx) => {
                  const clueText = data.clues[idx];
                  const guessDigit = data.guess ? data.guess[idx] : null;
                  const actualDigit = data.actualCode ? data.actualCode[idx] : null;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 text-xs bg-stone-50 dark:bg-stone-900/50 px-2 py-1.5 rounded border border-stone-200/60 dark:border-stone-800"
                    >
                      {/* Clue Index & Text */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="font-mono text-stone-400 text-[11px] font-semibold">
                          #{idx + 1}
                        </span>
                        {clueText ? (
                          <span className="font-medium text-stone-800 dark:text-stone-200 truncate font-serif italic text-xs sm:text-sm">
                            "{clueText}"
                          </span>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">waiting for transmission...</span>
                        )}

                        {clueText && onReportClue && (
                          <button
                            type="button"
                            onClick={() => onReportClue(rNum, idx, clueText)}
                            className="text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 ml-auto transition-colors"
                            title="Flag or dispute clue rule violation"
                          >
                            <Flag className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Submitted guess beside each clue & correct digit once revealed */}
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        {/* Submitted guess */}
                        <div
                          className={`px-1.5 py-0.5 rounded border text-[11px] min-w-[24px] text-center ${
                            guessDigit
                              ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 text-stone-800 dark:text-stone-200 font-bold'
                              : 'border-dashed border-stone-300 text-stone-300'
                          }`}
                          title={isOurSheet ? 'Our decoding guess' : 'Interception guess'}
                        >
                          {data.isRound1InterceptionDisabled ? '-' : guessDigit || '?'}
                        </div>

                        {/* Arrow separator */}
                        <span className="text-stone-400 text-[10px]">→</span>

                        {/* Actual revealed digit */}
                        <div
                          className={`px-1.5 py-0.5 rounded border text-[11px] min-w-[24px] text-center font-bold ${
                            actualDigit
                              ? actualDigit === guessDigit
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-stone-200 dark:bg-stone-800 border-stone-300 text-stone-400'
                          }`}
                          title="Actual digit once revealed"
                        >
                          {actualDigit || '•'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
