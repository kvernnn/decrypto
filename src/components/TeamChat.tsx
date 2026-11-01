import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Team } from '../types.js';
import { Send, Shield, Lock, Radio, Terminal } from 'lucide-react';

interface TeamChatProps {
  team: Team | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isEncryptorLockedOut: boolean;
  myPlayerId: string;
}

export const TeamChat: React.FC<TeamChatProps> = ({
  team,
  messages,
  onSendMessage,
  isEncryptorLockedOut,
  myPlayerId,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isEncryptorLockedOut) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const teamColorName = team === 'blue' ? 'Blue' : 'Red';

  return (
    <div className="flex flex-col h-full bg-stone-900 border border-stone-800 rounded-lg shadow-md overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-stone-950 px-3 py-2.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              team === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-stone-400" />
            <span>{teamColorName} Confidential Frequency</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>Opponent Blocked</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs min-h-[220px] max-h-[380px]">
        {messages.map((m) => {
          if (m.isSystem) {
            return (
              <div
                key={m.id}
                className="my-1.5 p-1.5 rounded bg-black/40 border-l-2 border-amber-500 text-[11px] text-amber-200/90 font-mono flex items-start gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 break-words">
                  <span className="font-bold text-amber-400 mr-1.5">[{m.senderName}]:</span>
                  <span>{m.text}</span>
                </div>
              </div>
            );
          }

          const isMine = m.senderId === myPlayerId;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-0.5">
                <span className="font-semibold">{m.senderName}</span>
                <span>•</span>
                <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded text-xs break-words ${
                  isMine
                    ? team === 'blue'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-red-600 text-white rounded-br-none'
                    : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Encryptor Blackout Warning or Input Form */}
      {isEncryptorLockedOut ? (
        <div className="bg-amber-950/80 border-t border-amber-700 p-2.5 text-center text-[11px] text-amber-300 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
          <span>
            Frequency silence: As the current Encryptor, you cannot send messages while your code is unresolved.
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-stone-950 p-2 border-t border-stone-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${teamColorName} team teammates...`}
            className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2 rounded transition-colors text-white ${
              team === 'blue'
                ? 'bg-blue-600 hover:bg-blue-500 disabled:opacity-40'
                : 'bg-red-600 hover:bg-red-500 disabled:opacity-40'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
