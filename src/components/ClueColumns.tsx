import React from 'react';
import { ClueItem, Team, TeamNotes } from '../types.js';
import { BookOpen, Edit3, ShieldAlert } from 'lucide-react';

interface ClueColumnsProps {
  sheetType: 'our' | 'opponent';
  viewerTeam: Team | null;
  blueCluesHistory: { 1: ClueItem[]; 2: ClueItem[]; 3: ClueItem[]; 4: ClueItem[] };
  redCluesHistory: { 1: ClueItem[]; 2: ClueItem[]; 3: ClueItem[]; 4: ClueItem[] };
  ourNotes: TeamNotes;
  onUpdateNote: (digit: 1 | 2 | 3 | 4, text: string) => void;
  isEncryptorLockedOut: boolean;
}

export const ClueColumns: React.FC<ClueColumnsProps> = ({
  sheetType,
  viewerTeam,
  blueCluesHistory,
  redCluesHistory,
  ourNotes,
  onUpdateNote,
  isEncryptorLockedOut,
}) => {
  const isOurSheet = sheetType === 'our';
  const targetTeam: Team = isOurSheet ? (viewerTeam || 'blue') : (viewerTeam === 'blue' ? 'red' : 'blue');
  const historyData = targetTeam === 'blue' ? blueCluesHistory : redCluesHistory;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[700px] grid grid-cols-4 gap-2 sm:gap-3">
        {([1, 2, 3, 4] as const).map((digit) => {
          const revealedClues = historyData[digit] || [];
          const noteText = ourNotes[digit] || '';

          return (
            <div
              key={digit}
              className={`rounded-lg border p-3 flex flex-col justify-between shadow-sm transition-all ${
                targetTeam === 'blue'
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                  : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-xs text-white ${
                      targetTeam === 'blue' ? 'bg-blue-600' : 'bg-red-600'
                    }`}
                  >
                    {digit}
                  </span>
                  <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">
                    CLUE BANK
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {revealedClues.length} revealed
                </span>
              </div>

              {/* Confirmed Clue History (Read-only verified past clues) */}
              <div className="flex-1 mb-3">
                <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-stone-600 dark:text-stone-400 mb-1.5 uppercase tracking-wider">
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  <span>Confirmed Clues</span>
                </div>

                <div className="min-h-[100px] max-h-[140px] overflow-y-auto space-y-1 bg-white/80 dark:bg-stone-900/60 p-2 rounded border border-stone-200/80 dark:border-stone-800 text-xs">
                  {revealedClues.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-stone-400 text-[11px] italic text-center py-4">
                      No clues revealed for #{digit} yet.
                    </div>
                  ) : (
                    revealedClues.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-1 bg-stone-50 dark:bg-stone-800/80 px-2 py-1 rounded text-stone-800 dark:text-stone-200 border border-stone-100 dark:border-stone-700"
                      >
                        <span className="font-serif italic font-medium truncate">
                          "{item.clue}"
                        </span>
                        <span className="text-[9px] font-mono font-bold text-stone-500 bg-stone-200 dark:bg-stone-700 px-1 rounded">
                          R{item.round}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Team Speculation & Shared Notes */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-stone-600 dark:text-stone-400 mb-1.5 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-blue-500" />
                    <span>{isOurSheet ? 'Our Notes' : 'Team Deductions'}</span>
                  </span>
                  <span className="text-[9px] font-normal text-stone-400">Syncs to team</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => onUpdateNote(digit, e.target.value)}
                    disabled={isEncryptorLockedOut}
                    placeholder={
                      isEncryptorLockedOut
                        ? 'Notes locked during your transmission...'
                        : isOurSheet
                        ? 'Private notes & connections...'
                        : 'Speculation on opponent keyword...'
                    }
                    className={`w-full text-xs p-2 rounded border font-mono resize-none transition-colors ${
                      isEncryptorLockedOut
                        ? 'bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed border-stone-200'
                        : 'bg-amber-50/70 dark:bg-stone-950/50 text-stone-800 dark:text-stone-200 border-amber-200 dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                  {isEncryptorLockedOut && (
                    <div className="absolute top-1.5 right-1.5 text-rose-500" title="Encryptor blocked from writing notes during transmission">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
