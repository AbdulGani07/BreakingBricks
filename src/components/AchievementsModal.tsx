import React from 'react';
import { X, Award, CheckCircle2, Lock, Zap, Flame, Shield, Target, Trophy, Star } from 'lucide-react';
import { GameStats } from '../types';

interface AchievementsModalProps {
  stats: GameStats;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ stats, onClose }) => {
  const isAchUnlocked = (id: string, condition: boolean) => {
    return Boolean(stats.unlockedAchievements?.includes(id) || condition);
  };

  const highestLevel = stats.highestLevel ?? stats.level;

  const achievements = [
    {
      id: 'first_brick',
      title: 'First Strike',
      description: 'Break your first brick in the arcade',
      icon: <Target className="w-4 h-4 text-cyan-400" />,
      unlocked: isAchUnlocked('first_brick', stats.bricksBroken >= 1),
      progress: Math.min(1, Math.max(stats.unlockedAchievements?.includes('first_brick') ? 1 : 0, stats.bricksBroken)),
      max: 1,
    },
    {
      id: 'combo_master',
      title: 'Combo Surge',
      description: 'Unleash a 5x combo multiplier',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      unlocked: isAchUnlocked('combo_master', stats.maxCombo >= 5),
      progress: Math.min(5, Math.max(stats.unlockedAchievements?.includes('combo_master') ? 5 : 0, stats.maxCombo)),
      max: 5,
    },
    {
      id: 'brick_crusher',
      title: 'Brick Destroyer',
      description: 'Smash 50 total bricks',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      unlocked: isAchUnlocked('brick_crusher', stats.bricksBroken >= 50),
      progress: Math.min(50, Math.max(stats.unlockedAchievements?.includes('brick_crusher') ? 50 : 0, stats.bricksBroken)),
      max: 50,
    },
    {
      id: 'level_veteran',
      title: 'Deep Run',
      description: 'Reach Level 3 or higher',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      unlocked: isAchUnlocked('level_veteran', highestLevel >= 3),
      progress: Math.min(3, Math.max(stats.unlockedAchievements?.includes('level_veteran') ? 3 : 0, highestLevel)),
      max: 3,
    },
    {
      id: 'high_score',
      title: 'Score Hunter',
      description: 'Accumulate 250 points in a match',
      icon: <Star className="w-4 h-4 text-pink-400" />,
      unlocked: isAchUnlocked('high_score', stats.score >= 250 || stats.highScore >= 250),
      progress: Math.min(250, Math.max(stats.score, stats.highScore)),
      max: 250,
    },
    {
      id: 'arcade_legend',
      title: 'Arcade Legend',
      description: 'Reach and conquer Level 10',
      icon: <Trophy className="w-4 h-4 text-amber-300" />,
      unlocked: isAchUnlocked('arcade_legend', highestLevel >= 10),
      progress: Math.min(10, Math.max(stats.unlockedAchievements?.includes('arcade_legend') ? 10 : 0, highestLevel)),
      max: 10,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div
      id="achievements-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none"
    >
      <div className="w-full max-w-sm max-h-[90vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black tracking-tight text-white">
              Achievements
            </h2>
          </div>
          <button
            id="btn-close-achievements"
            onClick={onClose}
            aria-label="Close Achievements"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <span>Unlocked: <strong className="text-cyan-400">{unlockedCount}</strong> / {achievements.length}</span>
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievement list */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                item.unlocked
                  ? 'bg-slate-800/70 border-cyan-500/30 text-white'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.unlocked
                      ? 'bg-cyan-500/15 border-cyan-400/40 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  {item.unlocked ? item.icon : <Lock className="w-4 h-4 text-slate-500" />}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="text-xs font-bold truncate text-slate-100">{item.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{item.description}</div>
                  {!item.unlocked && (
                    <div className="text-[9px] text-cyan-400/80 font-mono mt-0.5">
                      {item.progress} / {item.max}
                    </div>
                  )}
                </div>
              </div>

              {item.unlocked ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase shrink-0">
                  LOCKED
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Done button */}
        <button
          id="btn-achievements-done"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs tracking-wider uppercase transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
