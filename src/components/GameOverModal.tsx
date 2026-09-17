import React from 'react';
import { RotateCcw, Home, Trophy, Award, Flame, Target } from 'lucide-react';
import { GameStats } from '../types';
import { AnimatedScore } from './AnimatedScore';

interface GameOverModalProps {
  stats: GameStats;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRetry, onHome }) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;

  return (
    <div
      id="game-over-modal"
      className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
    >
      <div className="w-full max-w-sm bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100">
        
        {/* Banner Badge */}
        {isNewHighScore ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tracking-widest uppercase mb-2 animate-bounce shadow-lg shadow-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW HIGH SCORE!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-black tracking-widest uppercase mb-2">
            RUN TERMINATED
          </div>
        )}

        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          Game Over
        </h2>

        {/* Big Animated Score Tally */}
        <div className="my-3 flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Final Score</span>
          <div className="flex items-center gap-1 text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-200 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <AnimatedScore value={stats.score} />
          </div>
        </div>

        {/* Statistics Breakdown */}
        <div className="w-full grid grid-cols-2 gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 mb-6 text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Bricks Smashed</div>
              <div className="text-sm font-mono font-bold text-slate-100">{stats.bricksBroken}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Max Combo</div>
              <div className="text-sm font-mono font-bold text-amber-300">{stats.maxCombo}x</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Level Reached</div>
              <div className="text-sm font-mono font-bold text-emerald-300">Level {stats.level}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">High Score</div>
              <div className="text-sm font-mono font-bold text-yellow-300">{stats.highScore.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="btn-gameover-retry"
            onClick={onRetry}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            id="btn-gameover-home"
            onClick={onHome}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
