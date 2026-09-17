import React from 'react';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';
import { GameStats } from '../types';

interface PauseModalProps {
  stats: GameStats;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  onResume,
  onRestart,
  onOpenSettings,
  onHome,
}) => {
  return (
    <div
      id="pause-modal"
      className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
    >
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100">
        
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black tracking-widest uppercase mb-3">
          PAUSED
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white mb-4">
          Game Suspended
        </h2>

        {/* Quick Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
            <span className="text-lg font-mono font-bold text-cyan-300">{stats.score.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Level</span>
            <span className="text-lg font-mono font-bold text-emerald-300">{stats.level}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bricks Smashed</span>
            <span className="text-lg font-mono font-bold text-amber-300">{stats.bricksBroken}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Max Combo</span>
            <span className="text-lg font-mono font-bold text-pink-300">{stats.maxCombo}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="btn-pause-resume"
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wider uppercase shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Game</span>
          </button>

          <button
            id="btn-pause-restart"
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Restart Match</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              id="btn-pause-settings"
              onClick={onOpenSettings}
              className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              id="btn-pause-home"
              onClick={onHome}
              className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
