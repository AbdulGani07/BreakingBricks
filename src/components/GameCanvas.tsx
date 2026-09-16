import React, { useEffect, useRef, useCallback } from 'react';
import { GameEngine, CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/GameEngine';
import { GameStatus } from '../types';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Trophy, Award } from 'lucide-react';

interface GameCanvasProps {
  engine: GameEngine;
  status: GameStatus;
  onStatusChange: (status: GameStatus) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  status,
  onStatusChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keysPressed = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  // Handle Confetti on victory
  useEffect(() => {
    if (status === 'game_won') {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }
    }
  }, [status]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressed.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressed.current.right = true;
      } else if (e.code === 'Space' || e.code === 'KeyP') {
        if (engine.status === 'idle') {
          engine.startCountdown();
        } else if (engine.status === 'playing' || engine.status === 'paused') {
          engine.togglePause();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressed.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine]);

  // Pointer & Touch handlers
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      engine.movePaddleTo(mouseX);
    },
    [engine]
  );

  const handleCanvasClick = useCallback(() => {
    if (engine.status === 'idle') {
      engine.startCountdown();
    }
  }, [engine]);

  // Main Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Keyboard paddle movement
      if (keysPressed.current.left) {
        engine.movePaddleBy(-engine.paddle.speed);
      }
      if (keysPressed.current.right) {
        engine.movePaddleBy(engine.paddle.speed);
      }

      // 2. Physics update
      engine.update();

      // Check status sync
      if (engine.status !== status) {
        onStatusChange(engine.status);
      }

      // 3. Render Canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background subtle grid
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)'; // slate-700 subtle grid
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Bottom warning line (ball dead zone)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 390);
      ctx.lineTo(CANVAS_WIDTH, 390);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Bricks
      for (const brick of engine.bricks) {
        if (!brick.visible) continue;

        // Brick Body
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Brick Top Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(brick.x, brick.y, brick.width, 3);

        // Brick Border (as in original Brick.java)
        ctx.strokeStyle = brick.borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Power-up marker
        if (brick.powerUp) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(brick.x + brick.width / 2, brick.y + brick.height / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Power-ups
      for (const p of engine.powerUps) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 4);
        ctx.fill();

        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let label = '★';
        if (p.type === 'extra_life') label = '♥';
        if (p.type === 'double_ball') label = '2x';
        if (p.type === 'bonus_points') label = '+';
        if (p.type === 'expand_paddle') label = '↔';
        ctx.fillText(label, p.x + p.width / 2, p.y + p.height / 2);
        ctx.restore();
      }

      // Draw Particles
      for (const pt of engine.particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Floating Texts
      for (const ft of engine.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // Draw Paddle (original Java Paddle is blue at x, y, width, height)
      ctx.save();
      ctx.fillStyle = engine.paddle.color;
      ctx.beginPath();
      ctx.roundRect(
        engine.paddle.x,
        engine.paddle.y,
        engine.paddle.width,
        engine.paddle.height,
        3
      );
      ctx.fill();

      // Paddle subtle top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(engine.paddle.x + 2, engine.paddle.y + 1, engine.paddle.width - 4, 2);

      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Draw Balls (original Java Ball is red circle of radius 10)
      for (const ball of engine.balls) {
        ctx.save();
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(
          ball.x + ball.radius,
          ball.y + ball.radius,
          ball.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Specular 3D highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(
          ball.x + ball.radius * 0.7,
          ball.y + ball.radius * 0.7,
          ball.radius * 0.35,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Countdown Text on canvas if active
      if (engine.status === 'countdown') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'black 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          engine.countdown > 0 ? engine.countdown.toString() : 'GO!',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2
        );

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('GET READY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, status, onStatusChange]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[600px] aspect-[3/2] bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        id="breaking-bricks-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerMove={handlePointerMove}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-none"
      />

      {/* Start Screen Overlay (Matching original BreakingBricks.java Click to Start Game) */}
      {status === 'idle' && (
        <div
          id="overlay-idle"
          onClick={handleCanvasClick}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20 animate-pulse">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Breaking Bricks
          </h2>
          <p className="text-slate-300 text-sm max-w-xs mb-6">
            Bounce the ball, break every brick, and conquer all 10 arcade levels.
          </p>
          <button
            id="btn-click-to-start"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 transition-transform active:scale-95 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Click to Start Game
          </button>
          <span className="text-[11px] text-slate-500 mt-3 font-mono">
            Or press Space to begin
          </span>
        </div>
      )}

      {/* Paused Screen Overlay */}
      {status === 'paused' && (
        <div
          id="overlay-paused"
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <h3 className="text-2xl font-black text-amber-400 mb-2 tracking-wide uppercase">
            Game Paused
          </h3>
          <p className="text-slate-300 text-sm mb-5">Take a breath, champion.</p>
          <button
            id="btn-resume"
            onClick={() => engine.togglePause()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Resume Game
          </button>
        </div>
      )}

      {/* Level Cleared Overlay */}
      {status === 'level_cleared' && (
        <div
          id="overlay-level-cleared"
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <Award className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
          <h3 className="text-2xl font-black text-emerald-400 tracking-wide uppercase mb-1">
            Level Cleared!
          </h3>
          <p className="text-slate-300 text-sm">
            Preparing Level {engine.level + 1}...
          </p>
        </div>
      )}

      {/* Game Over Screen */}
      {status === 'game_over' && (
        <div
          id="overlay-game-over"
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800/80 flex items-center justify-center mb-3">
            <RotateCcw className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-3xl font-black text-red-500 tracking-tight mb-1">
            Game Over
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            You made it to Level {engine.level} with {engine.bricksBroken} bricks broken!
          </p>

          <div className="flex items-center gap-6 bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-xl mb-5">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Final Score
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {engine.score}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                High Score
              </span>
              <span className="text-2xl font-black text-slate-200 font-mono">
                {engine.highScore}
              </span>
            </div>
          </div>

          <button
            id="btn-play-again"
            onClick={() => engine.restartGame()}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      )}

      {/* Game Won Screen */}
      {status === 'game_won' && (
        <div
          id="overlay-game-won"
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <Trophy className="w-14 h-14 text-amber-400 mb-3 animate-pulse" />
          <h2 className="text-3xl font-black text-amber-400 tracking-tight mb-1">
            Victory! You Beat The Game!
          </h2>
          <p className="text-slate-300 text-sm max-w-sm mb-4">
            Incredible skill! You conquered all 10 levels of Breaking Bricks!
          </p>

          <div className="flex items-center gap-6 bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-xl mb-5">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Final Score
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {engine.score}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                High Score
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {engine.highScore}
              </span>
            </div>
          </div>

          <button
            id="btn-win-play-again"
            onClick={() => engine.restartGame()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      )}
    </div>
  );
};
