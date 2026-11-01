import React from 'react';
import { PublicScore, Team } from '../types.js';
import { Eye, AlertTriangle, Shield, Radio } from 'lucide-react';

interface ScoreTrackersProps {
  scores: {
    blue: PublicScore;
    red: PublicScore;
  };
  viewerTeam: Team | null;
}

export const ScoreTrackers: React.FC<ScoreTrackersProps> = ({ scores, viewerTeam }) => {
  const renderSlots = (
    count: number,
    total: number,
    type: 'intercept' | 'miscomm',
    team: Team
  ) => {
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < count;
          if (type === 'intercept') {
            return (
              <div
                key={i}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center border font-mono text-xs transition-all ${
                  filled
                    ? team === 'blue'
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                      : 'bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : 'bg-stone-100 dark:bg-stone-900/60 border-dashed border-stone-300 dark:border-stone-700 text-stone-400'
                }`}
                title={filled ? 'Interception token earned (+1)' : 'Empty interception slot'}
              >
                {filled ? <Eye className="w-4 h-4 animate-pulse" /> : <span className="opacity-40">{i + 1}</span>}
              </div>
            );
          } else {
            return (
              <div
                key={i}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center border font-mono text-xs transition-all ${
                  filled
                    ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]'
                    : 'bg-stone-100 dark:bg-stone-900/60 border-dashed border-stone-300 dark:border-stone-700 text-stone-400'
                }`}
                title={filled ? 'Miscommunication token earned (+1)' : 'Empty miscommunication slot'}
              >
                {filled ? <AlertTriangle className="w-4 h-4 text-amber-200" /> : <span className="opacity-40">{i + 1}</span>}
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderTeamCard = (team: Team) => {
    const isOurTeam = viewerTeam === team;
    const teamName = team === 'blue' ? 'Blue Team' : 'Red Team';
    const score = scores[team];

    return (
      <div
        className={`flex-1 p-3 rounded-lg border shadow-sm transition-all ${
          team === 'blue'
            ? isOurTeam
              ? 'bg-blue-50/90 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-stone-50 border-stone-200 dark:bg-stone-900/70 dark:border-stone-800'
            : isOurTeam
            ? 'bg-red-50/90 border-red-300 dark:bg-red-950/40 dark:border-red-700 ring-2 ring-red-500/20'
            : 'bg-stone-50 border-stone-200 dark:bg-stone-900/70 dark:border-stone-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                team === 'blue' ? 'bg-blue-600 shadow-[0_0_6px_#2563eb]' : 'bg-red-600 shadow-[0_0_6px_#dc2626]'
              }`}
            />
            <span className="font-bold text-xs uppercase tracking-wider font-mono text-stone-800 dark:text-stone-200">
              {teamName}
            </span>
            {isOurTeam && (
              <span className="text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300">
                You
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-stone-500">
            Net: <span className="font-bold">{score.interceptions - score.miscommunications}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Interceptions */}
          <div className="flex flex-col gap-1 p-1.5 bg-white/70 dark:bg-black/20 rounded border border-stone-200/60 dark:border-stone-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-blue-500" /> Interceptions
              </span>
              <span className="font-mono font-bold">{score.interceptions}/2</span>
            </div>
            {renderSlots(score.interceptions, 2, 'intercept', team)}
          </div>

          {/* Miscommunications */}
          <div className="flex flex-col gap-1 p-1.5 bg-white/70 dark:bg-black/20 rounded border border-stone-200/60 dark:border-stone-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Miscomms
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {score.miscommunications}/2
              </span>
            </div>
            {renderSlots(score.miscommunications, 2, 'miscomm', team)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2.5 w-full">
      {renderTeamCard('blue')}
      {renderTeamCard('red')}
    </div>
  );
};
