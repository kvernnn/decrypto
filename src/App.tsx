import React, { useState, useEffect, useCallback } from 'react';
import { ClueColumns } from './components/ClueColumns.js';
import { GameBoardHeader } from './components/GameBoardHeader.js';
import { GameOverModal } from './components/GameOverModal.js';
import { KeywordCards } from './components/KeywordCards.js';
import { LobbyView } from './components/LobbyView.js';
import { RoundPanels } from './components/RoundPanels.js';
import { RulesModal } from './components/RulesModal.js';
import { ScoreTrackers } from './components/ScoreTrackers.js';
import { TeamChat } from './components/TeamChat.js';
import { TestSwitcher } from './components/TestSwitcher.js';
import { TiebreakerModal } from './components/TiebreakerModal.js';
import { TransmissionControl } from './components/TransmissionControl.js';
import { useDecryptoSocket } from './hooks/useDecryptoSocket.js';
import { FilteredGameState, Team } from './types.js';
import {
  Radio,
  Shield,
  Users,
  Play,
  ArrowRight,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function App() {
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  // Welcome screen form inputs
  const [inputLobbyCode, setInputLobbyCode] = useState<string>('');
  const [inputPlayerName, setInputPlayerName] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Active sheet view: 'our' vs 'opponent'
  const [sheetType, setSheetType] = useState<'our' | 'opponent'>('our');

  // Modals & Panels
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [reportContext, setReportContext] = useState<{
    round: number;
    clueIndex: number;
    clueText: string;
  } | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Initialize session from URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLobby = urlParams.get('lobby');
    const testSession = urlParams.get('testSession');
    const testName = urlParams.get('testName');

    if (testSession) {
      setSessionId(testSession);
      const name = testName || 'Agent';
      setPlayerName(name);
      if (urlLobby) {
        setLobbyId(urlLobby.toUpperCase());
        // Auto-join test agent via API
        fetch('/api/lobby/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobbyId: urlLobby, playerName: name, sessionId: testSession }),
        }).catch(console.error);
      }
      return;
    }

    const savedSession = localStorage.getItem('decrypto_session_id');
    const savedName = localStorage.getItem('decrypto_player_name');

    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const newSession = crypto.randomUUID();
      localStorage.setItem('decrypto_session_id', newSession);
      setSessionId(newSession);
    }

    if (savedName) {
      setPlayerName(savedName);
      setInputPlayerName(savedName);
    }

    if (urlLobby) {
      setInputLobbyCode(urlLobby.toUpperCase());
    }
  }, []);

  // WebSocket hook
  const { gameState, connected, error, clearError, actions } = useDecryptoSocket({
    lobbyId,
    sessionId,
    playerName,
    onJoinSuccess: (state) => {
      // If we joined, ensure lobbyId is set
      if (!lobbyId) setLobbyId(state.lobbyId);
    },
  });

  // Handle creating a new lobby
  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const name = inputPlayerName.trim() || 'Agent 1';
    localStorage.setItem('decrypto_player_name', name);
    setPlayerName(name);
    setIsCreating(true);

    try {
      const res = await fetch('/api/lobby/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name }),
      });
      const data = await res.json();
      if (data.success) {
        setLobbyId(data.lobbyId);
        setSessionId(data.sessionId);
        localStorage.setItem('decrypto_session_id', data.sessionId);
      } else {
        setJoinError(data.error || 'Failed to create lobby');
      }
    } catch (err: any) {
      setJoinError(err.message || 'Network error');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle joining an existing lobby
  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const code = inputLobbyCode.trim().toUpperCase();
    const name = inputPlayerName.trim() || 'Agent';

    if (!code) {
      setJoinError('Please enter a 4-letter lobby code');
      return;
    }

    localStorage.setItem('decrypto_player_name', name);
    setPlayerName(name);

    try {
      const res = await fetch('/api/lobby/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: code, playerName: name, sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setLobbyId(data.lobbyId);
      } else {
        setJoinError(data.error || 'Lobby not found');
      }
    } catch (err: any) {
      setJoinError(err.message || 'Network error');
    }
  };

  // Helper for clue dispute report
  const handleOpenReport = (round: number, clueIndex: number, clueText: string) => {
    setReportContext({ round, clueIndex, clueText });
    setIsRulesOpen(true);
  };

  // Check if current user is Encryptor for active unresolved transmission
  const isEncryptorLockedOut = Boolean(
    gameState?.currentTransmission &&
    !gameState.currentTransmission.resolved &&
    gameState.myTeam === gameState.currentTransmission.team &&
    gameState.myPlayerId === gameState.currentTransmission.encryptorId
  );

  // -----------------------------------------------------------------
  // VIEW 1: WELCOME SCREEN (No Lobby Chosen)
  // -----------------------------------------------------------------
  if (!lobbyId || !gameState) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 font-mono flex flex-col justify-between selection:bg-amber-500 selection:text-black">
        <div className="max-w-md w-full mx-auto p-4 sm:p-6 my-auto space-y-6">
          {/* Logo & Cipher branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl mb-1">
              <Radio className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-widest uppercase text-white font-mono">
              DECRYPTO
            </h1>
            <p className="text-xs text-stone-400 font-mono tracking-wider">
              ENCRYPTED FREQUENCY • DEDUCTION INTELLIGENCE
            </p>
          </div>

          {/* Cards */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-5 backdrop-blur-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Your Agent Call-sign (Name)
              </label>
              <input
                type="text"
                value={inputPlayerName}
                onChange={(e) => setInputPlayerName(e.target.value)}
                placeholder="e.g. Cipher, Shadow, Echo"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            {joinError && (
              <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
                {joinError}
              </div>
            )}

            {/* Create Lobby Form */}
            <form onSubmit={handleCreateLobby}>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Create New Mission Lobby</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-800 w-full" />
              <span className="bg-stone-900 px-3 text-[10px] text-stone-500 uppercase tracking-widest absolute">
                OR INTERCEPT EXISTING
              </span>
            </div>

            {/* Join Lobby Form */}
            <form onSubmit={handleJoinLobby} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Lobby Frequency Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={inputLobbyCode}
                  onChange={(e) => setInputLobbyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB42"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-amber-400 font-mono tracking-widest uppercase focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition-colors border border-stone-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Connect to Frequency</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="text-center text-[11px] text-stone-500">
            <span>Server-Authoritative • Real-Time WebSockets • 4-8 Players</span>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW 2: LOBBY VIEW (Game Not Started Yet)
  // -----------------------------------------------------------------
  if (gameState.phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
        <div className="flex-1 py-4">
          <LobbyView
            gameState={gameState}
            onSetTeam={actions.setTeam}
            onRandomiseTeams={actions.randomiseTeams}
            onSetMode={actions.setMode}
            onStartGame={actions.startGame}
            onOpenRules={() => {
              setReportContext(null);
              setIsRulesOpen(true);
            }}
          />
        </div>

        {/* Multi-Session Testing toolbar for quick 4-player testing */}
        <TestSwitcher
          lobbyId={gameState.lobbyId}
          players={gameState.players}
          myPlayerId={gameState.myPlayerId}
          onSwitchSession={(newSession, name) => {
            setSessionId(newSession);
            setPlayerName(name);
          }}
        />

        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          reportContext={reportContext}
          onSubmitReport={(idx, text, reason) => actions.reportClue(idx, text, reason)}
        />
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW 3: MAIN GAME BOARD (Paper-Inspired Authentic Decrypto Theme)
  // -----------------------------------------------------------------
  const viewerTeam = gameState.myTeam;
  const isBlue = viewerTeam === 'blue';

  return (
    <div
      className={`min-h-screen flex flex-col font-mono selection:bg-amber-500 selection:text-black transition-colors ${
        isBlue
          ? 'bg-slate-900 text-stone-100'
          : 'bg-stone-900 text-stone-100'
      }`}
    >
      {/* Top Header */}
      <GameBoardHeader
        gameState={gameState}
        sheetType={sheetType}
        onSheetChange={setSheetType}
        onOpenRules={() => {
          setReportContext(null);
          setIsRulesOpen(true);
        }}
        connected={connected}
      />

      {/* Main Game Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Error Notification Bar */}
        {error && (
          <div className="bg-rose-950 border border-rose-800 text-rose-300 px-4 py-2 rounded text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-stone-400 hover:text-white underline ml-3 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Score Trackers Card */}
        <ScoreTrackers scores={gameState.scores} viewerTeam={viewerTeam} />

        {/* 2. Four Keyword Cards in One Horizontal Row (Positions 1 to 4) */}
        <div className="bg-white/95 dark:bg-stone-900/90 p-3 sm:p-4 rounded-lg border border-stone-200 dark:border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-stone-500 mb-2">
            <span className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {sheetType === 'our' ? 'Our Secret Keywords' : 'Opponent Secret Keywords (Concealed)'}
            </span>
            <span className="text-[11px]">
              {sheetType === 'our' ? 'Protected from opponent eyes' : 'Deduce these through transmissions'}
            </span>
          </div>

          <KeywordCards
            sheetType={sheetType}
            ourKeywords={gameState.ourKeywords}
            opponentKeywordsRevealed={gameState.opponentKeywordsRevealed}
            viewerTeam={viewerTeam}
          />
        </div>

        {/* 3. Active Transmission Console / Encryptor Tools / Suggestion Builder */}
        <TransmissionControl
          gameState={gameState}
          onCluesSubmit={actions.submitClues}
          onSuggestCode={actions.suggestCode}
          onLockGuess={actions.lockGuess}
          onReassignSubmitter={actions.reassignSubmitter}
          isHost={gameState.myPlayerId === gameState.hostId}
          onOpenRules={() => {
            setReportContext(null);
            setIsRulesOpen(true);
          }}
        />

        {/* 4. Score-Sheet Card with Eight Round Panels in Two Columns and Four Rows */}
        <RoundPanels
          sheetType={sheetType}
          viewerTeam={viewerTeam}
          history={gameState.history}
          currentRound={gameState.round}
          currentTransmission={gameState.currentTransmission}
          blueCluesSubmitted={gameState.blueCluesSubmitted}
          redCluesSubmitted={gameState.redCluesSubmitted}
          onReportClue={handleOpenReport}
        />

        {/* 5. Four Aligned Clue-History and Notes Columns (Directly beneath keywords 1-4) */}
        <div className="bg-white/95 dark:bg-stone-900/90 p-3 sm:p-4 rounded-lg border border-stone-200 dark:border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-stone-500 mb-2">
            <span className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {sheetType === 'our' ? 'Our Clue Archive & Deductions' : 'Opponent Clue Archive & Deductions'}
            </span>
            <span className="text-[11px] text-stone-400">
              Columns align with keywords 1, 2, 3, 4
            </span>
          </div>

          <ClueColumns
            sheetType={sheetType}
            viewerTeam={viewerTeam}
            blueCluesHistory={gameState.blueCluesHistory}
            redCluesHistory={gameState.redCluesHistory}
            ourNotes={gameState.ourNotes}
            onUpdateNote={actions.updateNotes}
            isEncryptorLockedOut={isEncryptorLockedOut}
          />
        </div>
      </main>

      {/* Floating Collapsible Team Chat Drawer */}
      <div className="fixed bottom-3 left-3 z-40 w-80 sm:w-96">
        <div className="shadow-2xl rounded-lg overflow-hidden border border-stone-700">
          <button
            type="button"
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="w-full bg-stone-950 p-2.5 text-xs font-mono font-bold text-stone-200 flex items-center justify-between hover:bg-stone-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span>{viewerTeam === 'blue' ? 'Blue' : 'Red'} Frequency Chat</span>
              <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-400">
                {gameState.chatMessages.length} msgs
              </span>
            </div>
            {isChatExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {isChatExpanded && (
            <div className="h-80">
              <TeamChat
                team={viewerTeam}
                messages={gameState.chatMessages}
                onSendMessage={actions.sendChat}
                isEncryptorLockedOut={isEncryptorLockedOut}
                myPlayerId={gameState.myPlayerId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        reportContext={reportContext}
        onSubmitReport={(idx, text, reason) => actions.reportClue(idx, text, reason)}
      />

      {gameState.phase === 'TIEBREAKER_KEYWORDS' && (
        <TiebreakerModal
          tiebreaker={gameState.tiebreaker}
          myTeam={viewerTeam}
          isHost={gameState.myPlayerId === gameState.hostId}
          onSubmitGuesses={actions.submitTiebreakerGuesses}
          onConfirmOverride={actions.confirmTiebreakerOverride}
          ourKeywords={gameState.ourKeywords}
          opponentKeywordsRevealed={gameState.opponentKeywordsRevealed}
        />
      )}

      {gameState.phase === 'GAME_OVER' && (
        <GameOverModal
          gameState={gameState}
          onPlayAgain={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Testing Switcher Toolbar */}
      <TestSwitcher
        lobbyId={gameState.lobbyId}
        players={gameState.players}
        myPlayerId={gameState.myPlayerId}
        onSwitchSession={(newSession, name) => {
          setSessionId(newSession);
          setPlayerName(name);
        }}
      />
    </div>
  );
}
