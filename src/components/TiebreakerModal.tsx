import React, { useState } from 'react';
import { Team, TiebreakerData } from '../types.js';
import { HelpCircle, Check, X, ShieldAlert, Award } from 'lucide-react';

interface TiebreakerModalProps {
  tiebreaker: TiebreakerData | null;
  myTeam: Team | null;
  isHost: boolean;
  onSubmitGuesses: (guesses: { 1: string; 2: string; 3: string; 4: string }) => void;
  onConfirmOverride: (key: string, valid: boolean) => void;
  ourKeywords: { 1: string; 2: string; 3: string; 4: string } | null;
  opponentKeywordsRevealed: { 1: string; 2: string; 3: string; 4: string } | null;
}

export const TiebreakerModal: React.FC<TiebreakerModalProps> = ({
  tiebreaker,
  myTeam,
  isHost,
  onSubmitGuesses,
  onConfirmOverride,
  ourKeywords,
  opponentKeywordsRevealed,
}) => {
  const [g1, setG1] = useState('');
  const [g2, setG2] = useState('');
  const [g3, setG3] = useState('');
  const [g4, setG4] = useState('');

  if (!tiebreaker) return null;

  const isBlue = myTeam === 'blue';
  const myTeamLocked = isBlue ? tiebreaker.blueLocked : tiebreaker.redLocked;
  const bothLocked = tiebreaker.blueLocked && tiebreaker.redLocked;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (myTeamLocked) return;
    onSubmitGuesses({ 1: g1.trim(), 2: g2.trim(), 3: g3.trim(), 4: g4.trim() });
  };

  const opponentTeamName = myTeam === 'blue' ? 'Red' : 'Blue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-stone-900 border-2 border-amber-500 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-stone-200 font-mono overflow-hidden">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-amber-400">
              ULTIMATE TIEBREAKER: OPPONENT KEYWORD DEDUCTION
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-stone-300 leading-relaxed">
            The teams are tied on score! Each team must now privately deduce all four of the opponent's
            secret keywords from the public clues collected during the game.
          </p>

          {!bothLocked ? (
            <div>
              {myTeamLocked ? (
                <div className="p-4 bg-emerald-950/80 border border-emerald-700 rounded text-center space-y-2">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-emerald-300 text-sm">
                    Your team's 4 keyword guesses are locked!
                  </h3>
                  <p className="text-stone-400 text-xs">
                    Waiting for {opponentTeamName} team to lock their keyword guesses...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 bg-stone-950 p-4 rounded-lg border border-stone-800">
                  <h3 className="text-amber-400 font-bold text-xs uppercase mb-2">
                    Enter your deductions for {opponentTeamName}'s 4 keywords:
                  </h3>
                  {([1, 2, 3, 4] as const).map((num) => {
                    const val = num === 1 ? g1 : num === 2 ? g2 : num === 3 ? g3 : g4;
                    const setter = num === 1 ? setG1 : num === 2 ? setG2 : num === 3 ? setG3 : setG4;
                    return (
                      <div key={num} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-amber-600 text-white flex items-center justify-center font-bold font-mono text-xs">
                          {num}
                        </span>
                        <input
                          type="text"
                          required
                          value={val}
                          onChange={(e) => setter(e.target.value)}
                          placeholder={`Deduction for Keyword #${num}...`}
                          className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    );
                  })}

                  <button
                    type="submit"
                    className="w-full mt-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors"
                  >
                    Lock Keyword Guesses for {myTeam?.toUpperCase()}
                  </button>
                </form>
              )}
            </div>
          ) : (
            // Both locked: Show Transparent Adjudication / Confirmation
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded border border-stone-800">
                <h3 className="text-amber-400 font-bold text-xs uppercase mb-3 flex items-center justify-between">
                  <span>Transparent Adjudication of Keyword Deductions</span>
                  {isHost && (
                    <span className="text-[10px] text-stone-400 font-normal">
                      Host can confirm spelling variants or synonyms
                    </span>
                  )}
                </h3>

                {/* Compare guesses vs actual keywords */}
                <div className="space-y-3 text-xs">
                  {([1, 2, 3, 4] as const).map((num) => {
                    const blueGuess = tiebreaker.blueKeywordGuesses[num] || '';
                    const redActual = opponentKeywordsRevealed?.[num] || ourKeywords?.[num] || '';
                    const blueKey = `blue_${num}`;
                    const blueExact = blueGuess.trim().toLowerCase() === redActual.trim().toLowerCase();
                    const blueConfirmed = tiebreaker.confirmedAdjustments?.[blueKey] !== undefined
                      ? tiebreaker.confirmedAdjustments[blueKey]
                      : blueExact;

                    return (
                      <div
                        key={num}
                        className="p-2.5 rounded bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-stone-700 text-white flex items-center justify-center font-bold text-xs">
                            #{num}
                          </span>
                          <div>
                            <span className="text-stone-400 text-[10px] block">Guess:</span>
                            <span className="font-bold text-white font-mono uppercase">
                              "{blueGuess || '---'}"
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-stone-400 text-[11px]">
                            Actual: <strong className="text-amber-400 font-mono uppercase">{redActual}</strong>
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                              blueConfirmed
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}
                          >
                            {blueConfirmed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {blueConfirmed ? 'Match (+1)' : 'No Match'}
                          </span>

                          {isHost && (
                            <button
                              type="button"
                              onClick={() => onConfirmOverride(blueKey, !blueConfirmed)}
                              className="text-[10px] text-stone-400 hover:text-white underline font-mono ml-1"
                            >
                              Toggle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
