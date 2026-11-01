import React, { useState } from 'react';
import { X, ShieldAlert, BookOpen, AlertCircle, CheckCircle, Flag } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContext?: {
    round: number;
    clueIndex: number;
    clueText: string;
  } | null;
  onSubmitReport?: (clueIndex: number, clueText: string, reason: string) => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  reportContext,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportContext || !onSubmitReport) return;
    onSubmitReport(reportContext.clueIndex, reportContext.clueText, reason);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-stone-200 font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              {reportContext ? 'Dispute / Flag Clue' : 'Decrypto Operational Manual & Clue Rules'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          {reportContext ? (
            <div className="space-y-4">
              <div className="bg-amber-950/60 border border-amber-700/80 p-3 rounded-lg text-amber-200">
                <span className="font-bold text-xs uppercase block text-amber-400 mb-1">
                  Report Clue for Round {reportContext.round} (Clue #{reportContext.clueIndex + 1})
                </span>
                <span className="text-base font-serif italic font-bold">"{reportContext.clueText}"</span>
              </div>

              {submitted ? (
                <div className="p-4 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                  <span>Dispute flagged to Decrypto HQ. All players have been alerted.</span>
                </div>
              ) : (
                <form onSubmit={handleReport} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-stone-300">
                      Reason for dispute (e.g. references spelling, private inside joke, reused):
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      placeholder="Explain how this clue violates official Decrypto rules..."
                      className="w-full bg-stone-950 border border-stone-700 rounded p-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Submit Official Dispute</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Objective */}
              <section className="space-y-1">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs">
                  1. Mission Objective
                </h3>
                <p className="text-stone-300 leading-relaxed text-xs">
                  Transmit secret 3-digit codes (drawn from 1-4, like <span className="text-amber-400 font-mono">4-2-1</span>)
                  to your teammates without letting the opposing team intercept your frequency.
                  Earn <span className="text-emerald-400 font-bold">2 Interception Tokens</span> to win, or avoid
                  accumulating <span className="text-rose-400 font-bold">2 Miscommunication Tokens</span>.
                </p>
              </section>

              {/* Strict Clue Rules */}
              <section className="space-y-2 bg-stone-950 p-3 rounded-lg border border-stone-800">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>2. Official Clue Constitution</span>
                </h3>
                <ul className="space-y-2 text-xs text-stone-300 list-disc list-inside">
                  <li>
                    <strong className="text-white">Meaning Only:</strong> Clues must strictly refer to the
                    concept or meaning of the keyword.
                  </li>
                  <li>
                    <strong className="text-white">Forbidden Form Clues:</strong> You cannot reveal spelling, rhyming,
                    pronunciation, letter count, or screen position (e.g. "Starts with V" or "Left card" are illegal).
                  </li>
                  <li>
                    <strong className="text-white">No Keyword Translations:</strong> Keywords or their translations
                    into another language cannot be used as clues.
                  </li>
                  <li>
                    <strong className="text-white">Public Knowledge:</strong> Clues must rely on knowledge available to both
                    teams. Private inside jokes or secrets unavailable to opponents are forbidden.
                  </li>
                  <li>
                    <strong className="text-white">No Re-use:</strong> You cannot reuse a clue that was already published
                    in an earlier round.
                  </li>
                  <li>
                    <strong className="text-white">Published Clues are Final:</strong> Once transmitted, clues cannot be altered.
                  </li>
                </ul>
              </section>

              {/* Round Sequence */}
              <section className="space-y-1 text-xs">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider">
                  3. Round Sequence
                </h3>
                <div className="space-y-1.5 text-stone-300">
                  <p>
                    <strong className="text-white">Step 1:</strong> Both team Encryptors secretly receive their 3-digit code
                    and draft 3 ordered clues.
                  </p>
                  <p>
                    <strong className="text-white">Step 2:</strong> Blue transmission is broadcast. Blue discusses and submits
                    a decoding guess. Red attempts an interception (from Round 2 onwards).
                  </p>
                  <p>
                    <strong className="text-white">Step 3:</strong> Red transmission is broadcast. Red decodes, and Blue intercepts.
                  </p>
                  <p>
                    <strong className="text-white">Step 4:</strong> Both transmissions are resolved, scores awarded, and round advances!
                  </p>
                </div>
              </section>

              {/* Tiebreaker */}
              <section className="space-y-1 text-xs">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider">
                  4. Tiebreaker Procedure
                </h3>
                <p className="text-stone-300 leading-relaxed">
                  If results conflict, both teams reach victory/loss together, or Round 8 concludes without a winner:
                  1) Compare Net Score (Interceptions minus Miscommunications).
                  2) If still tied, both teams privately submit guesses for all 4 of the opponent's keywords. The team with
                  more correct keyword deductions wins!
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
