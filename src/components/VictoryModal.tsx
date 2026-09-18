import React from 'react';
import { Trophy, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import { GameStats } from '../types';
import { AnimatedScore } from './AnimatedScore';
import { SocialShareSection } from './SocialShareSection';

interface VictoryModalProps {
  stats: GameStats;
  onRetry: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRetry, onHome }) => {
  return (
    <div
      id="victory-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none"
    >
      <div className="w-full max-w-md bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center text-center text-slate-100 shadow-amber-500/20 max-h-[92vh] overflow-y-auto my-auto">
        
        {/* Crown / Trophy icon */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/30 animate-bounce shrink-0">
          <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 fill-slate-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-1">
          <Sparkles className="w-3 h-3" />
          <span>ALL 10 LEVELS CLEARED</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
          Arcade Champion!
        </h2>

        {/* Score Tally */}
        <div className="my-1.5 flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Score</span>
          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <AnimatedScore value={stats.score} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5 my-2.5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Bricks Smashed</span>
            <span className="text-base sm:text-lg font-mono font-bold text-cyan-300">{stats.bricksBroken}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Max Combo</span>
            <span className="text-base sm:text-lg font-mono font-bold text-amber-300">{stats.maxCombo}x</span>
          </div>
        </div>

        {/* Social Sharing Features */}
        <SocialShareSection stats={stats} isVictory={true} />

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 mt-1 shrink-0">
          <button
            id="btn-victory-retry"
            onClick={onRetry}
            className="w-full min-h-[44px] py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            id="btn-victory-home"
            onClick={onHome}
            className="w-full min-h-[44px] py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
