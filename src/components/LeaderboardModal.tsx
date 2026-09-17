import React, { useMemo } from 'react';
import { X, Trophy, Medal, Crown } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  playerHighScore: number;
  playerLevel: number;
  onClose: () => void;
}

const DEFAULT_LEADERBOARD: Omit<LeaderboardEntry, 'rank'>[] = [
  { name: 'CYBER_ACE', score: 980, level: 10, date: 'TODAY' },
  { name: 'NEO_BREAKER', score: 760, level: 8, date: 'YESTERDAY' },
  { name: 'RETRO_KING', score: 620, level: 7, date: '3 DAYS AGO' },
  { name: 'PADDLE_GOD', score: 490, level: 6, date: 'THIS WEEK' },
  { name: 'GRID_RUNNER', score: 380, level: 5, date: 'THIS WEEK' },
  { name: 'PIXEL_STRIKE', score: 260, level: 4, date: 'THIS MONTH' },
  { name: 'VORTEX', score: 180, level: 3, date: 'THIS MONTH' },
  { name: 'ARCADE_VIP', score: 120, level: 2, date: 'THIS MONTH' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  playerHighScore,
  playerLevel,
  onClose,
}) => {
  const mergedLeaderboard = useMemo(() => {
    const list = [...DEFAULT_LEADERBOARD];

    if (playerHighScore > 0) {
      list.push({
        name: 'YOU (PLAYER 1)',
        score: playerHighScore,
        level: Math.max(1, playerLevel),
        date: 'ACTIVE',
        isPlayer: true,
      });
    }

    list.sort((a, b) => b.score - a.score);

    return list.slice(0, 10).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [playerHighScore, playerLevel]);

  return (
    <div
      id="leaderboard-modal"
      className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
    >
      <div className="w-full max-w-sm max-h-[90vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black tracking-tight text-white">
              Hall of Fame
            </h2>
          </div>
          <button
            id="btn-close-leaderboard"
            onClick={onClose}
            aria-label="Close Leaderboard"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subheader */}
        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2 px-1 flex justify-between">
          <span>Rank & Player</span>
          <span>Score / Level</span>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
          {mergedLeaderboard.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <div
                key={`${entry.rank}-${entry.name}`}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                  entry.isPlayer
                    ? 'bg-amber-500/15 border-amber-400/50 text-white shadow-md shadow-amber-500/10 font-bold'
                    : isTop1
                    ? 'bg-slate-800/80 border-yellow-500/30 text-yellow-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-300'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {isTop1 ? (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    ) : isTop2 ? (
                      <Medal className="w-4 h-4 text-slate-300" />
                    ) : isTop3 ? (
                      <Medal className="w-4 h-4 text-amber-600" />
                    ) : (
                      <span className="text-slate-500">#{entry.rank}</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold truncate">{entry.name}</span>
                      {entry.isPlayer && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black tracking-wider uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Score & Level */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-sm text-cyan-300">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    LVL {entry.level}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Done button */}
        <button
          id="btn-leaderboard-done"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs tracking-wider uppercase transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
