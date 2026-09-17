import React from 'react';
import { GameStats, GameStatus } from '../types';
import { AnimatedScore } from './AnimatedScore';
import { ActivePowerUpsBar } from './ActivePowerUpsBar';
import { Heart, Trophy, Pause, Play, Volume2, VolumeX, Flame, Zap, Sliders } from 'lucide-react';

interface ModernHUDProps {
  stats: GameStats;
  status: GameStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenSettings?: () => void;
  ballCount: number;
}

export const ModernHUD: React.FC<ModernHUDProps> = ({
  stats,
  status,
  isMuted,
  onToggleMute,
  onTogglePause,
  onOpenSettings,
  ballCount,
}) => {
  const maxLives = 3;
  const clearedBricks = Math.max(0, stats.totalBricksInLevel - stats.remainingBricks);
  const progressPercent = stats.totalBricksInLevel > 0 
    ? Math.round((clearedBricks / stats.totalBricksInLevel) * 100) 
    : 0;

  const isComboActive = stats.combo > 1;
  const comboMultiplier = Math.min(stats.combo, 5);

  return (
    <header className="w-full max-w-[600px] flex flex-col gap-2 mb-2 select-none">
      {/* Top Glassmorphic Bar */}
      <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 text-slate-100">
        
        {/* Left: Level & Progress */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
              LVL {stats.level}
            </span>
            <span className="text-[11px] font-medium text-slate-400 font-mono">
              {progressPercent}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Center: Animated Score & High Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">SCORE</span>
            <AnimatedScore value={stats.score} className="text-2xl sm:text-3xl text-white tracking-tight drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-mono">
            <Trophy className="w-3 h-3 text-amber-400 inline" />
            <span>BEST: {stats.highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Right: Lives & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Lives energy cells */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            {Array.from({ length: Math.max(maxLives, stats.lives) }).map((_, idx) => {
              const hasLife = idx < stats.lives;
              return (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-all duration-300 ${
                    hasLife
                      ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                      : 'text-slate-600 fill-slate-800 opacity-40'
                  }`}
                />
              );
            })}
          </div>

          {/* Audio toggle button */}
          <button
            id="btn-hud-audio"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Audio & Settings panel button */}
          {onOpenSettings && (
            <button
              id="btn-hud-settings"
              onClick={onOpenSettings}
              aria-label="Open Audio & Game Settings"
              className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-all active:scale-95 shadow-sm"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* Pause / Play button */}
          {status !== 'idle' && status !== 'game_over' && status !== 'game_won' && (
            <button
              id="btn-hud-pause"
              onClick={onTogglePause}
              aria-label={status === 'paused' ? 'Resume Game' : 'Pause Game'}
              className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              {status === 'paused' ? (
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              ) : (
                <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar: Combo Multiplier & Active Buffs */}
      {(isComboActive || stats.activeBuffs.length > 0 || ballCount > 1) && (
        <div className="w-full flex items-center justify-between gap-2 px-1 flex-wrap">
          {/* Combo Multiplier Badge */}
          {isComboActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tracking-wider uppercase shadow-md shadow-amber-500/20 backdrop-blur-md animate-bounce">
              {comboMultiplier >= 4 ? (
                <Flame className="w-4 h-4 text-red-400 fill-red-400 animate-pulse" />
              ) : (
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
              <span>{comboMultiplier}x COMBO!</span>
              <span className="text-[10px] text-amber-200 font-mono">({stats.combo} Hits)</span>
            </div>
          ) : (
            <div />
          )}

          {/* Active Buffs & Multi-Ball Bar */}
          <ActivePowerUpsBar buffs={stats.activeBuffs} ballCount={ballCount} />
        </div>
      )}
    </header>
  );
};
