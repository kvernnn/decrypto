import { useCallback, useEffect, useRef, useState } from 'react';
import { FilteredGameState, GameMode, Team, WSClientMessage, WSServerMessage } from '../types.js';

interface UseDecryptoSocketProps {
  lobbyId: string | null;
  sessionId: string;
  playerName: string;
  onJoinSuccess?: (state: FilteredGameState) => void;
}

export function useDecryptoSocket({ lobbyId, sessionId, playerName, onJoinSuccess }: UseDecryptoSocketProps) {
  const [gameState, setGameState] = useState<FilteredGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!lobbyId || !sessionId) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?lobbyId=${encodeURIComponent(lobbyId)}&sessionId=${encodeURIComponent(sessionId)}&playerName=${encodeURIComponent(playerName)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSServerMessage;
        if (data.type === 'state_update') {
          setGameState(data.state);
          if (onJoinSuccess) {
            onJoinSuccess(data.state);
          }
        } else if (data.type === 'error') {
          setError(data.message);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket encountered error:', err);
      ws.close();
    };
  }, [lobbyId, sessionId, playerName, onJoinSuccess]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: WSClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const setTeam = useCallback((team: Team) => sendMessage({ type: 'set_team', team }), [sendMessage]);
  const randomiseTeams = useCallback(() => sendMessage({ type: 'randomise_teams' }), [sendMessage]);
  const setMode = useCallback((mode: GameMode) => sendMessage({ type: 'set_mode', mode }), [sendMessage]);
  const startGame = useCallback(() => sendMessage({ type: 'start_game' }), [sendMessage]);
  const submitClues = useCallback((clues: [string, string, string]) => sendMessage({ type: 'submit_clues', clues }), [sendMessage]);
  const suggestCode = useCallback((guess: [number, number, number]) => sendMessage({ type: 'suggest_code', guess }), [sendMessage]);
  const lockGuess = useCallback((guess: [number, number, number]) => sendMessage({ type: 'lock_guess', guess }), [sendMessage]);
  const reassignSubmitter = useCallback((targetPlayerId: string) => sendMessage({ type: 'reassign_submitter', targetPlayerId }), [sendMessage]);
  const updateNotes = useCallback((digit: 1 | 2 | 3 | 4, text: string) => sendMessage({ type: 'update_notes', digit, text }), [sendMessage]);
  const sendChat = useCallback((text: string) => sendMessage({ type: 'send_chat', text }), [sendMessage]);
  const reportClue = useCallback((clueIndex: number, clueText: string, reason: string) => sendMessage({ type: 'report_clue', clueIndex, clueText, reason }), [sendMessage]);
  const submitTiebreakerGuesses = useCallback((guesses: { 1: string; 2: string; 3: string; 4: string }) => sendMessage({ type: 'submit_tiebreaker_guesses', guesses }), [sendMessage]);
  const confirmTiebreakerOverride = useCallback((key: string, valid: boolean) => sendMessage({ type: 'confirm_tiebreaker_override', key, valid }), [sendMessage]);

  return {
    gameState,
    connected,
    error,
    clearError: () => setError(null),
    actions: {
      setTeam,
      randomiseTeams,
      setMode,
      startGame,
      submitClues,
      suggestCode,
      lockGuess,
      reassignSubmitter,
      updateNotes,
      sendChat,
      reportClue,
      submitTiebreakerGuesses,
      confirmTiebreakerOverride,
    },
  };
}
