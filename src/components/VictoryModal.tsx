import React from 'react';
import { Trophy, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import { GameStats } from '../types';
import { AnimatedScore } from './AnimatedScore';

interface VictoryModalProps {
  stats: GameStats;
  onRetry: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRetry, onHome }) => {
  return (
    <div
      id="victory-modal"
      className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
    >
      <div className="w-full max-w-sm bg-slate-900/95 border border-amber-500/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100 shadow-amber-500/20">
        
        {/* Crown / Trophy icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30 animate-bounce">
          <Trophy className="w-8 h-8 text-slate-950 fill-slate-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ALL 10 LEVELS CLEARED</span>
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          Arcade Champion!
        </h2>

        {/* Score Tally */}
        <div className="my-2 flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Score</span>
          <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <AnimatedScore value={stats.score} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 my-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Bricks Smashed</span>
            <span className="text-lg font-mono font-bold text-cyan-300">{stats.bricksBroken}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Max Combo</span>
            <span className="text-lg font-mono font-bold text-amber-300">{stats.maxCombo}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="btn-victory-retry"
            onClick={onRetry}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wider uppercase shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            id="btn-victory-home"
            onClick={onHome}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
