import React, { useEffect, useRef } from 'react';
import { Play, Settings, Trophy, Award, Sparkles } from 'lucide-react';
import { audioSystem } from '../audio/AudioSystem';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenLeaderboard: () => void;
  highScore: number;
  highestLevel?: number;
  gamesPlayed?: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenAchievements,
  onOpenLeaderboard,
  highScore,
  highestLevel,
  gamesPlayed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ambient cyber arcade animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating glowing particles
    const particles = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedY: -(Math.random() * 0.4 + 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '#38bdf8' : '#ec4899',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0b0f19');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#050811');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Perspective retro cyber grid on bottom
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      const horizonY = height * 0.65;

      // Horizontal lines converging
      for (let i = 0; i < 7; i++) {
        const y = horizonY + Math.pow(i / 6, 2) * (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vanishing vertical lines
      const vanishingX = width / 2;
      for (let x = -width * 0.5; x <= width * 1.5; x += 50) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw and float particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handlePlayClick = () => {
    try {
      audioSystem.playPaddleHit();
    } catch {
      // Audio autoplay policy shouldn't prevent game start
    }
    onStartGame();
  };

  return (
    <div className="relative w-full max-w-[600px] min-h-[440px] sm:min-h-0 sm:aspect-[3/2] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col items-center justify-between p-4 sm:p-6 select-none bg-slate-950">
      {/* Dynamic Animated Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Subtle vignette shadow */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/80 pointer-events-none" />

      {/* Top Header: Badge & High Score & Persistent Stats */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase shadow-sm">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
          <span>CYBER ARCADE</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {highestLevel !== undefined && highestLevel > 1 && (
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-[10px] sm:text-xs font-mono font-bold shadow-sm backdrop-blur-sm">
              <span>MAX LVL {highestLevel}</span>
            </div>
          )}

          {gamesPlayed !== undefined && gamesPlayed > 0 && (
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] sm:text-xs font-mono font-medium shadow-sm backdrop-blur-sm">
              <span>GAMES: {gamesPlayed}</span>
            </div>
          )}

          {highScore > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-mono font-bold shadow-sm backdrop-blur-sm">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>RECORD: {highScore.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Premium Arcade Logo & Play Button */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-4">
        <div className="relative mb-2">
          {/* Logo Glow */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)] uppercase">
            BREAKING BRICKS
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest text-slate-300 uppercase mt-1">
            RETINA HIGH-DPI ARCADE EDITION
          </p>
        </div>

        {/* Big tactile Play Button */}
        <button
          id="btn-main-menu-play"
          onClick={handlePlayClick}
          className="group relative mt-4 sm:mt-5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white font-black text-base sm:text-lg tracking-wider uppercase shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2.5 sm:gap-3 border border-white/20 overflow-hidden"
        >
          {/* Internal light sheen animation */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white group-hover:scale-110 transition-transform" />
          <span>PLAY GAME</span>
        </button>
      </div>

      {/* Bottom Action Bar: Settings, Achievements, Leaderboard */}
      <div className="relative z-10 w-full flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <button
          id="btn-menu-leaderboard"
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-slate-200 hover:text-white text-[11px] sm:text-xs font-bold tracking-wide uppercase transition-all active:scale-95 shadow-md backdrop-blur-md"
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>

        <button
          id="btn-menu-achievements"
          onClick={onOpenAchievements}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-slate-200 hover:text-white text-[11px] sm:text-xs font-bold tracking-wide uppercase transition-all active:scale-95 shadow-md backdrop-blur-md"
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <span>Achievements</span>
        </button>

        <button
          id="btn-menu-settings"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-slate-200 hover:text-white text-[11px] sm:text-xs font-bold tracking-wide uppercase transition-all active:scale-95 shadow-md backdrop-blur-md"
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
