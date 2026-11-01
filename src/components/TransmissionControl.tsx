import React, { useState, useEffect } from 'react';
import {
  FilteredGameState,
  Player,
  PlayerSuggestion,
  Team,
  TransmissionData,
} from '../types.js';
import {
  Key,
  Lock,
  Send,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Shield,
  ArrowRight,
  Radio,
  Eye,
  Check,
} from 'lucide-react';

interface TransmissionControlProps {
  gameState: FilteredGameState;
  onCluesSubmit: (clues: [string, string, string]) => void;
  onSuggestCode: (guess: [number, number, number]) => void;
  onLockGuess: (guess: [number, number, number]) => void;
  onReassignSubmitter: (targetPlayerId: string) => void;
  isHost: boolean;
  onOpenRules: () => void;
}

export const TransmissionControl: React.FC<TransmissionControlProps> = ({
  gameState,
  onCluesSubmit,
  onSuggestCode,
  onLockGuess,
  onReassignSubmitter,
  isHost,
  onOpenRules,
}) => {
  const {
    phase,
    round,
    myPlayerId,
    myTeam,
    mySecretCode,
    ourKeywords,
    blueCluesSubmitted,
    redCluesSubmitted,
    currentTransmission,
    activeSuggestions,
    players,
  } = gameState;

  // Clue inputs for Encryptor
  const [clue1, setClue1] = useState('');
  const [clue2, setClue2] = useState('');
  const [clue3, setClue3] = useState('');
  const [clueError, setClueError] = useState<string | null>(null);

  // Guess digit slots: 3 ordered slots
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null]);

  // Keyboard navigation for digit entry: 1-4 and Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        // Place in first empty slot if not already present
        setSlots((prev) => {
          if (prev.includes(num)) return prev; // No duplicates allowed
          const next = [...prev];
          const emptyIdx = next.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            next[emptyIdx] = num;
          }
          return next;
        });
      } else if (e.key === 'Backspace') {
        // Remove from last filled slot
        setSlots((prev) => {
          const next = [...prev];
          for (let i = 2; i >= 0; i--) {
            if (next[i] !== null) {
              next[i] = null;
              break;
            }
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine user's role in current phase
  const isBlueEncryptor = myPlayerId === gameState.blueEncryptorId;
  const isRedEncryptor = myPlayerId === gameState.redEncryptorId;
  const isCurrentRoundEncryptor = isBlueEncryptor || isRedEncryptor;

  // -------------------------------------------------------------
  // PHASE 1: ROUND_CLUES
  // -------------------------------------------------------------
  if (phase === 'ROUND_CLUES') {
    const isMyTeamCluesSubmitted = myTeam === 'blue' ? blueCluesSubmitted : redCluesSubmitted;
    const isOtherTeamCluesSubmitted = myTeam === 'blue' ? redCluesSubmitted : blueCluesSubmitted;

    if (isCurrentRoundEncryptor) {
      if (isMyTeamCluesSubmitted) {
        return (
          <div className="bg-amber-50 dark:bg-stone-900 border border-amber-300 dark:border-amber-700/60 p-4 rounded-lg shadow text-center">
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-mono text-base font-bold text-stone-900 dark:text-stone-100">
                Clues submitted. Waiting for the other team.
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                {isOtherTeamCluesSubmitted
                  ? 'Both sets of clues ready! Transmitting shortly...'
                  : 'The opposing team’s Encryptor is encrypting their code.'}
              </p>
            </div>
          </div>
        );
      }

      // Encryptor composition form
      const codeDigits = mySecretCode || [1, 2, 3];

      const handleClueSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setClueError(null);
        if (!clue1.trim() || !clue2.trim() || !clue3.trim()) {
          setClueError('All three clues must be filled out.');
          return;
        }

        // Basic check against keywords
        if (ourKeywords) {
          const kws = Object.values(ourKeywords).map((k) => k.toLowerCase());
          const cArray = [clue1.trim().toLowerCase(), clue2.trim().toLowerCase(), clue3.trim().toLowerCase()];
          for (const c of cArray) {
            if (kws.includes(c)) {
              setClueError(`Clue "${c}" matches one of your secret keywords! Not permitted.`);
              return;
            }
          }
        }

        onCluesSubmit([clue1.trim(), clue2.trim(), clue3.trim()]);
      };

      return (
        <div className="bg-stone-900 text-stone-100 p-4 rounded-lg border-2 border-amber-500/80 shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-sm font-bold tracking-wider text-amber-400">
                ENCRYPTOR CIPHER CONSOLE
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenRules}
              className="text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1 font-mono transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Clue Rules
            </button>
          </div>

          <div className="bg-black/60 p-3 rounded-md border border-stone-800 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-stone-400 block">
                YOUR SECRET TRANSMISSION CODE (ROUND {round}):
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black tracking-widest text-amber-400">
                [ {codeDigits[0]} - {codeDigits[1]} - {codeDigits[2]} ]
              </span>
            </div>
            <div className="text-right text-[11px] text-stone-400 font-mono">
              <span>Only YOU can see this code.</span>
            </div>
          </div>

          <form onSubmit={handleClueSubmit} className="space-y-3">
            {codeDigits.map((digit, idx) => {
              const kw = ourKeywords?.[digit as 1 | 2 | 3 | 4] || `WORD ${digit}`;
              const val = idx === 0 ? clue1 : idx === 1 ? clue2 : clue3;
              const setter = idx === 0 ? setClue1 : idx === 1 ? setClue2 : setClue3;

              return (
                <div key={idx} className="bg-stone-800/80 p-2.5 rounded border border-stone-700">
                  <div className="flex items-center justify-between mb-1 text-xs font-mono">
                    <span className="text-stone-300 font-semibold">
                      Clue #{idx + 1} for Digit{' '}
                      <span className="text-amber-400 font-bold font-mono">[{digit}]</span>
                    </span>
                    <span className="text-stone-400 font-serif italic">
                      Target Keyword: <span className="text-white font-bold">{kw}</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={`Enter meaningful clue for ${kw}...`}
                    className="w-full bg-black/60 border border-stone-600 rounded px-3 py-1.5 text-sm text-stone-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              );
            })}

            {clueError && (
              <div className="text-xs text-rose-400 font-mono bg-rose-950/50 p-2 rounded border border-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{clueError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-sm py-2 px-4 rounded shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Lock and Transmit Clues</span>
            </button>
          </form>
        </div>
      );
    }

    // Teammate view during clue preparation
    return (
      <div className="bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-4 rounded-lg shadow text-center">
        <div className="flex flex-col items-center justify-center py-3 space-y-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 animate-spin">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
            Encryptors are preparing their clues...
          </h3>
          <p className="text-xs text-stone-500 font-mono max-w-md">
            Your team's Encryptor has received a secret 3-digit code and is writing three clues for your keywords.
            Stand by to decode!
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 2 & 3: TRANSMISSION ACTIVE (BLUE or RED)
  // -------------------------------------------------------------
  if (!currentTransmission) return null;

  const t = currentTransmission;
  const isTransmittingTeam = myTeam === t.team;
  const isInterceptingTeam = myTeam && myTeam !== t.team;
  const isRound1 = round === 1;

  // Permissions & Submitter IDs
  const designatedSubmitterId = isTransmittingTeam
    ? t.decodingSubmitterId
    : t.interceptionSubmitterId;
  const isDesignatedSubmitter = myPlayerId === designatedSubmitterId;
  const isLocked = isTransmittingTeam ? t.decodingLocked : t.interceptionLocked;
  const isEncryptorOfThisTransmission = myPlayerId === t.encryptorId;

  // Can this user suggest?
  // Current Encryptor CANNOT suggest or submit decoding guess for own transmission!
  // Encryptor CAN help intercept opponent transmission!
  const canSuggest = !isLocked && (!isTransmittingTeam || !isEncryptorOfThisTransmission);
  const canLock = !isLocked && (isDesignatedSubmitter || isHost) && (!isTransmittingTeam || !isEncryptorOfThisTransmission);

  const currentGuessComplete = slots[0] !== null && slots[1] !== null && slots[2] !== null;

  // Handle tile click / drop
  const handleTileClick = (digit: number) => {
    if (!canSuggest) return;
    setSlots((prev) => {
      // If already in slots, remove it
      if (prev.includes(digit)) {
        return prev.map((s) => (s === digit ? null : s));
      }
      // Otherwise, put in first empty slot
      const next = [...prev];
      const emptyIdx = next.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        next[emptyIdx] = digit;
      }
      return next;
    });
  };

  const handleSlotClick = (slotIdx: number) => {
    if (!canSuggest) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  // Drag and drop support
  const handleDragStart = (e: React.DragEvent, digit: number) => {
    e.dataTransfer.setData('text/plain', String(digit));
  };

  const handleDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    if (!canSuggest) return;
    const digit = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (digit >= 1 && digit <= 4) {
      setSlots((prev) => {
        const next = [...prev];
        // If digit was in another slot, clear it
        const oldIdx = next.findIndex((d) => d === digit);
        if (oldIdx !== -1) next[oldIdx] = null;
        next[slotIdx] = digit;
        return next;
      });
    }
  };

  const handleSendSuggestion = () => {
    if (!currentGuessComplete || !canSuggest) return;
    onSuggestCode([slots[0]!, slots[1]!, slots[2]!]);
  };

  const handleLockAnswer = () => {
    if (!currentGuessComplete || !canLock) return;
    onLockGuess([slots[0]!, slots[1]!, slots[2]!]);
  };

  const designatedPlayer = players.find((p) => p.id === designatedSubmitterId);
  const eligibleTeammates = players.filter(
    (p) => p.team === myTeam && p.connected && (isInterceptingTeam || p.id !== t.encryptorId)
  );

  return (
    <div
      className={`rounded-lg border shadow-md p-3 sm:p-4 transition-all ${
        t.team === 'blue'
          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
          : 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800'
      }`}
    >
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider text-white ${
              t.team === 'blue' ? 'bg-blue-600' : 'bg-red-600'
            }`}
          >
            ACTIVE TRANSMISSION: {t.team.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-stone-600 dark:text-stone-300">
            Round {round} • Encryptor: <span className="font-bold">{t.encryptorName}</span>
          </span>
        </div>

        {/* Action Goal Indicator */}
        <div className="text-xs font-mono">
          {isTransmittingTeam ? (
            <span className="text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded">
              🎯 YOUR TASK: Decode Your Own Code
            </span>
          ) : isRound1 ? (
            <span className="text-stone-500 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded">
              Round 1: Interception Disabled
            </span>
          ) : (
            <span className="text-red-700 dark:text-red-300 font-bold bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded">
              🚨 YOUR TASK: Intercept Opponent Code
            </span>
          )}
        </div>
      </div>

      {/* Clues broadcast display */}
      <div className="bg-white/80 dark:bg-black/40 p-3 rounded-md border border-stone-200 dark:border-stone-800 mb-3">
        <div className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-2">
          Public Clues Transmitted:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {t.clues.map((c, i) => (
            <div
              key={i}
              className="bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded border border-stone-200 dark:border-stone-700 flex items-center justify-between"
            >
              <span className="text-xs font-mono text-stone-400 font-semibold">#{i + 1}</span>
              <span className="text-sm font-serif italic font-bold text-stone-900 dark:text-stone-100">
                "{c}"
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status banner if already locked */}
      {isLocked && !t.resolved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 p-3 rounded mb-3 text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              Your team locked its {isTransmittingTeam ? 'decoding' : 'interception'} guess!
            </span>
          </div>
          <span className="text-stone-500 animate-pulse">
            Waiting for {isTransmittingTeam ? 'opponent interception' : 'transmitting team decoding'}...
          </span>
        </div>
      )}

      {/* Encryptor Blackout Notice */}
      {isEncryptorOfThisTransmission && isTransmittingTeam && !t.resolved && (
        <div className="bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 p-3 rounded mb-3 text-xs font-mono text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>ENCRYPTOR TRANSMISSION BLACKOUT IN EFFECT</span>
          </div>
          <p className="text-[11px]">
            You created the code. You cannot propose, discuss, suggest, or lock guesses for this transmission.
            Your teammates must decode the message alone!
          </p>
        </div>
      )}

      {/* Digit Guess Builder & Submissions */}
      {(!isLocked || isHost) && (!isEncryptorOfThisTransmission || !isTransmittingTeam) && !(isRound1 && isInterceptingTeam) && (
        <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-md border border-stone-200 dark:border-stone-800">
          {/* Submitter responsibility header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs font-mono mb-2 text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Designated Submitter:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {designatedPlayer?.name || 'Assigned Agent'}
              </span>
              {isDesignatedSubmitter && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  (You)
                </span>
              )}
            </div>

            {/* Host reassignment controls */}
            {isHost && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-500">Reassign:</span>
                <select
                  value={designatedSubmitterId}
                  onChange={(e) => onReassignSubmitter(e.target.value)}
                  className="bg-stone-100 dark:bg-stone-800 text-[11px] font-mono rounded px-1.5 py-0.5 border border-stone-300 dark:border-stone-700"
                >
                  {eligibleTeammates.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.id === myPlayerId ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ordered Slots & Tile Picker */}
          <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            {/* The 3 Ordered Guess Slots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const val = slots[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, slotIdx)}
                    onClick={() => handleSlotClick(slotIdx)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      val !== null
                        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-400'
                    }`}
                    title="Click to remove digit from this slot"
                  >
                    <span className="text-[9px] font-mono text-stone-400 mb-0.5">
                      SLOT {slotIdx + 1}
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black">
                      {val !== null ? val : '•'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div className="hidden sm:block text-stone-300 dark:text-stone-700">|</div>

            {/* Available Digit Tiles (1-4) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-stone-500 mr-1 hidden lg:inline">
                Tiles:
              </span>
              {[1, 2, 3, 4].map((num) => {
                const isUsed = slots.includes(num);
                return (
                  <div
                    key={num}
                    draggable={!isUsed && canSuggest}
                    onDragStart={(e) => handleDragStart(e, num)}
                    onClick={() => handleTileClick(num)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-md border flex items-center justify-center font-mono font-black text-base cursor-pointer select-none transition-all ${
                      isUsed
                        ? 'opacity-30 bg-stone-200 dark:bg-stone-800 border-stone-300 text-stone-400 cursor-not-allowed'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:scale-105 active:scale-95 shadow-sm'
                    }`}
                    title="Click, drag, or press keyboard number"
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendSuggestion}
                disabled={!currentGuessComplete || !canSuggest}
                className="flex-1 sm:flex-initial px-3 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono text-xs font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send suggestion to teammates without finalizing"
              >
                Suggest Code
              </button>

              <button
                type="button"
                onClick={handleLockAnswer}
                disabled={!currentGuessComplete || !canLock}
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                title={
                  !canLock
                    ? `Only designated submitter (${designatedPlayer?.name}) can lock`
                    : 'Lock final answer for your team'
                }
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Answer</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between pt-1">
            <span>Tip: Drag tiles, click, or use keyboard keys 1-4 and Backspace.</span>
            <span>A code requires 3 distinct digits.</span>
          </div>

          {/* Teammates' Suggestions */}
          {activeSuggestions.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-mono text-stone-500 block mb-1.5">
                Teammates' Live Suggestions:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeSuggestions.map((s) => (
                  <button
                    key={s.playerId}
                    type="button"
                    onClick={() => {
                      if (canSuggest) setSlots([...s.guess]);
                    }}
                    className="flex items-center gap-1.5 bg-amber-50 dark:bg-stone-800/90 border border-amber-300 dark:border-stone-700 px-2 py-1 rounded text-xs font-mono hover:border-amber-500 transition-colors cursor-pointer"
                    title="Click to copy this suggestion into your builder"
                  >
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {s.playerName}:
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {s.guess.join('-')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
