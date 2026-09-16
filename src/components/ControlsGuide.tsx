import React from 'react';
import { MousePointer, ArrowLeftRight, Touchpad } from 'lucide-react';

export const ControlsGuide: React.FC = () => {
  return (
    <div className="w-full max-w-[600px] bg-slate-900/60 border border-slate-800/80 rounded-b-xl px-4 py-2.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <MousePointer className="w-3.5 h-3.5 text-slate-400" />
        <span>Mouse / Touch to move paddle</span>
      </div>

      <div className="flex items-center gap-1.5">
        <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
        <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">→</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">D</kbd></span>
      </div>

      <div className="flex items-center gap-1.5">
        <Touchpad className="w-3.5 h-3.5 text-slate-400" />
        <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">P</kbd> Pause</span>
      </div>
    </div>
  );
};
