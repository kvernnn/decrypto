import React, { useState } from 'react';
import { FilteredGameState, Player } from '../types.js';
import { ExternalLink, Users, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface TestSwitcherProps {
  lobbyId: string;
  players: Player[];
  myPlayerId: string;
  onSwitchSession: (sessionId: string, playerName: string) => void;
}

export const TestSwitcher: React.FC<TestSwitcherProps> = ({
  lobbyId,
  players,
  myPlayerId,
  onSwitchSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getTestPlayerUrl = (agentNum: number, teamPref?: string) => {
    const testSession = `test_session_${lobbyId}_agent_${agentNum}`;
    const testName = `Agent ${agentNum}`;
    return `${window.location.origin}?lobby=${lobbyId}&testSession=${testSession}&testName=${encodeURIComponent(testName)}${teamPref ? `&team=${teamPref}` : ''}`;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div className="fixed bottom-3 right-3 z-40 font-mono text-xs">
      <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-stone-950 hover:bg-stone-800 text-stone-200 font-bold flex items-center justify-between gap-3 w-full transition-colors"
        >
          <div className="flex items-center gap-1.5 text-amber-400">
            <Users className="w-4 h-4" />
            <span>Multi-Session Testing Hub (4-Player Runner)</span>
          </div>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {isOpen && (
          <div className="p-3 bg-stone-900 text-stone-300 space-y-3 max-w-sm border-t border-stone-800">
            <p className="text-[11px] text-stone-400 leading-normal">
              Decrypto requires 4 players (2 Blue, 2 Red). Open the links below in new tabs or windows to simulate
              all 4 connected agents in real time:
            </p>

            <div className="space-y-1.5">
              {[
                { num: 2, label: 'Agent 2 (Blue Team)', team: 'blue' },
                { num: 3, label: 'Agent 3 (Red Team)', team: 'red' },
                { num: 4, label: 'Agent 4 (Red Team)', team: 'red' },
              ].map(({ num, label, team }) => {
                const url = getTestPlayerUrl(num, team);
                return (
                  <div
                    key={num}
                    className="flex items-center justify-between gap-2 p-1.5 rounded bg-stone-950 border border-stone-800 text-[11px]"
                  >
                    <span className="font-semibold text-stone-200">{label}</span>
                    <div className="flex items-center gap-1">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1"
                      >
                        <span>Open Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyUrl(url)}
                        className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
                        title="Copy direct link"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-1 text-[10px] text-stone-500 border-t border-stone-800 flex justify-between">
              <span>Current Player: {players.find((p) => p.id === myPlayerId)?.name || 'You'}</span>
              {copiedLink && <span className="text-emerald-400">Link copied!</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
