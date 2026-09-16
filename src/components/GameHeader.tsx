import React from 'react';
import { Heart, Trophy, Zap, Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';
import { GameStats, GameStatus } from '../types';

interface GameHeaderProps {
  stats: GameStats;
  status: GameStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  stats,
  status,
  isMuted,
  onToggleMute,
  onTogglePause,
  onRestart,
}) => {
  return (
    <header className="w-full max-w-[600px] bg-slate-900/90 border border-slate-800 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-slate-100 shadow-md">
      {/* Left: Score & High Score */}
      <div className="flex items-center gap-4">
        <div id="stat-score" className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Score
          </span>
          <span className="text-xl font-black text-amber-400 font-mono tracking-tight">
            {stats.score.toString().padStart(4, '0')}
          </span>
        </div>

        <div id="stat-highscore" className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-slate-300 font-mono font-bold">
            {stats.highScore.toString().padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Center: Level Badge */}
      <div id="stat-level" className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/70 border border-indigo-500/30 rounded-full">
        <Zap className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-bold text-indigo-300 tracking-wide uppercase">
          Level {stats.level}
        </span>
      </div>

      {/* Right: Lives & Controls */}
      <div className="flex items-center gap-3">
        {/* Lives (Hearts) */}
        <div id="stat-lives" className="flex items-center gap-1" title={`${stats.lives} lives remaining`}>
          {[1, 2, 3].map((i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-all duration-200 ${
                i <= stats.lives
                  ? 'text-red-500 fill-red-500 scale-100'
                  : 'text-slate-600 fill-transparent scale-90 opacity-40'
              }`}
            />
          ))}
          {stats.lives > 3 && (
            <span className="text-xs font-bold text-red-400 ml-0.5">+{stats.lives - 3}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <button
            id="btn-toggle-sound"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            disabled={status !== 'playing' && status !== 'paused'}
            className={`p-1.5 rounded-lg transition-colors ${
              status === 'playing' || status === 'paused'
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
                : 'text-slate-700 cursor-not-allowed'
            }`}
            title={status === 'paused' ? 'Resume Game' : 'Pause Game'}
            aria-label="Toggle Pause"
          >
            {status === 'paused' ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            id="btn-restart-header"
            onClick={onRestart}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Restart Game"
            aria-label="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
