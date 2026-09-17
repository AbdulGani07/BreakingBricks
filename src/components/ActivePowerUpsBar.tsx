import React from 'react';
import { ActiveBuff } from '../types';
import {
  Flame,
  Crosshair,
  Shield,
  Magnet,
  Hourglass,
  CircleDot,
  Zap,
} from 'lucide-react';

interface ActivePowerUpsBarProps {
  buffs: ActiveBuff[];
  ballCount: number;
}

export const ActivePowerUpsBar: React.FC<ActivePowerUpsBarProps> = ({ buffs, ballCount }) => {
  const hasMultiBall = ballCount > 1;

  if (buffs.length === 0 && !hasMultiBall) return null;

  return (
    <div id="active-power-ups-bar" className="flex items-center gap-2 flex-wrap animate-fadeIn">
      {hasMultiBall && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-bold tracking-wider uppercase shadow-sm shadow-cyan-500/20 backdrop-blur-md">
          <CircleDot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Multi-Ball (x{ballCount})</span>
        </div>
      )}

      {buffs.map((buff) => {
        const percent = Math.max(0, Math.min(100, (buff.duration / buff.maxDuration) * 100));

        let icon = <Zap className="w-3.5 h-3.5 text-amber-400" />;
        let colorClasses = 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-amber-500/20';

        switch (buff.type) {
          case 'fire_ball':
            icon = <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />;
            colorClasses = 'bg-orange-500/20 border-orange-400/50 text-orange-300 shadow-orange-500/25';
            break;
          case 'laser':
            icon = <Crosshair className="w-3.5 h-3.5 text-red-400 animate-spin" style={{ animationDuration: '4s' }} />;
            colorClasses = 'bg-red-500/20 border-red-400/50 text-red-300 shadow-red-500/25';
            break;
          case 'shield':
            icon = <Shield className="w-3.5 h-3.5 text-emerald-400" />;
            colorClasses = 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-emerald-500/25';
            break;
          case 'magnet_paddle':
            icon = <Magnet className="w-3.5 h-3.5 text-purple-400" />;
            colorClasses = 'bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-purple-500/25';
            break;
          case 'slow_motion':
            icon = <Hourglass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />;
            colorClasses = 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-cyan-500/25';
            break;
          default:
            icon = <Zap className="w-3.5 h-3.5 text-amber-400" />;
            colorClasses = 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-amber-500/20';
        }

        return (
          <div
            key={buff.id}
            className={`relative flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-bold tracking-wider uppercase shadow-sm backdrop-blur-md overflow-hidden ${colorClasses}`}
          >
            {/* Background timer progress bar */}
            <div
              className="absolute left-0 bottom-0 top-0 bg-white/15 transition-all duration-100 ease-linear pointer-events-none"
              style={{ width: `${percent}%` }}
            />
            <div className="relative z-10 flex items-center gap-1.5">
              {icon}
              <span>{buff.label}</span>
              <span className="font-mono text-[10px] opacity-80 pl-1">{buff.duration.toFixed(1)}s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
