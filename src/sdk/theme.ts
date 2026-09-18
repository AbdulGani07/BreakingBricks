import { GameTheme } from './types';

export interface ThemeColors {
  name: GameTheme;
  bgMain: string;
  bgSurface: string;
  borderColor: string;
  primaryAccent: string;
  secondaryAccent: string;
  textColor: string;
  paddleColor: string;
  hudBg: string;
  badgeBg: string;
}

export const THEMES: Record<GameTheme, ThemeColors> = {
  cyber: {
    name: 'cyber',
    bgMain: 'bg-slate-950',
    bgSurface: 'bg-slate-900/85',
    borderColor: 'border-slate-800',
    primaryAccent: '#06b6d4', // cyan-500
    secondaryAccent: '#fbbf24', // amber-400
    textColor: 'text-slate-100',
    paddleColor: '#3b82f6', // blue
    hudBg: 'bg-slate-900/85 border-slate-700/60',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  },
  synthwave: {
    name: 'synthwave',
    bgMain: 'bg-[#0e021a]',
    bgSurface: 'bg-[#18052e]/90',
    borderColor: 'border-pink-900/50',
    primaryAccent: '#f43f5e', // rose/hot-pink
    secondaryAccent: '#a855f7', // purple
    textColor: 'text-pink-50',
    paddleColor: '#ec4899', // pink
    hudBg: 'bg-[#1e0738]/85 border-pink-500/30',
    badgeBg: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
  },
  retro: {
    name: 'retro',
    bgMain: 'bg-[#0a0a0a]',
    bgSurface: 'bg-[#141414]/90',
    borderColor: 'border-emerald-900/40',
    primaryAccent: '#10b981', // emerald
    secondaryAccent: '#f59e0b', // amber
    textColor: 'text-emerald-100',
    paddleColor: '#10b981', // green
    hudBg: 'bg-[#141414]/90 border-emerald-700/50',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  neon: {
    name: 'neon',
    bgMain: 'bg-[#05050f]',
    bgSurface: 'bg-[#0b0c20]/90',
    borderColor: 'border-indigo-800/50',
    primaryAccent: '#8b5cf6', // violet
    secondaryAccent: '#06b6d4', // cyan
    textColor: 'text-violet-50',
    paddleColor: '#8b5cf6', // violet
    hudBg: 'bg-[#0f1026]/90 border-violet-500/30',
    badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
  },
  matrix: {
    name: 'matrix',
    bgMain: 'bg-[#010903]',
    bgSurface: 'bg-[#021808]/90',
    borderColor: 'border-emerald-900/60',
    primaryAccent: '#22c55e', // green
    secondaryAccent: '#4ade80', // light green
    textColor: 'text-green-100',
    paddleColor: '#22c55e', // matrix green
    hudBg: 'bg-[#021f0a]/90 border-green-600/40',
    badgeBg: 'bg-green-500/15 border-green-500/30 text-green-400',
  },
  minimal: {
    name: 'minimal',
    bgMain: 'bg-[#111827]',
    bgSurface: 'bg-[#1f2937]/90',
    borderColor: 'border-gray-700',
    primaryAccent: '#38bdf8', // sky
    secondaryAccent: '#e5e7eb', // gray
    textColor: 'text-white',
    paddleColor: '#38bdf8', // sky
    hudBg: 'bg-[#1f2937]/90 border-gray-700',
    badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
  },
};

export function resolveTheme(theme: GameTheme = 'cyber'): ThemeColors {
  return THEMES[theme] || THEMES.cyber;
}
