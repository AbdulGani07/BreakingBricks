import React, { useEffect, useRef, useCallback } from 'react';
import { GameEngine, CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/GameEngine';
import { GameStatus } from '../types';
import confetti from 'canvas-confetti';
import { Award } from 'lucide-react';
import { renderBrick } from '../game/Brick';
import {
  renderPowerUpItem,
  renderLaserBolts,
  renderBottomShield,
  renderPaddleAttachments,
} from '../game/PowerUp';

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
      } else if (e.code === 'Space') {
        if (engine.status === 'idle') {
          engine.startCountdown();
        } else if (engine.status === 'playing') {
          const launched = engine.launchStuckBalls();
          if (!launched && !engine.paddle.hasLaser) {
            engine.togglePause();
          }
        } else if (engine.status === 'paused') {
          engine.togglePause();
        }
      } else if (e.code === 'KeyP') {
        if (engine.status === 'playing' || engine.status === 'paused') {
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

  // Pointer & Touch handlers with pointer capture for buttery-smooth mobile steering
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      const mouseX = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      engine.movePaddleTo(mouseX);
    },
    [engine]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Fallback for browsers without pointer capture
      }
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      const mouseX = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      engine.movePaddleTo(mouseX);

      // On tap / touch down: launch stuck balls or fire lasers if playing, or start countdown if idle
      if (engine.status === 'idle') {
        engine.startCountdown();
      } else if (engine.status === 'playing') {
        engine.launchStuckBalls();
      }
    },
    [engine]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
    },
    []
  );

  const handleCanvasClick = useCallback(() => {
    if (engine.status === 'idle') {
      engine.startCountdown();
    } else if (engine.status === 'playing') {
      engine.launchStuckBalls();
    }
  }, [engine]);

  // Dynamic High-DPI / Retina responsive canvas buffer sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasBackingStore = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Cap at 3x DPR to avoid excessive GPU memory allocation on ultra-dense displays
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const targetWidth = Math.round(rect.width * dpr);
      const targetHeight = Math.round(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
    };

    updateCanvasBackingStore();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasBackingStore();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', updateCanvasBackingStore);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasBackingStore);
    };
  }, []);

  // Main Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime: number | null = null;
    const MAX_DELTA = 0.05; // 50ms clamp (min 20 FPS threshold) to prevent tunneling or leaps on lag/tab-switch

    const render = (timestamp: DOMHighResTimeStamp) => {
      if (lastTime === null) {
        lastTime = timestamp;
      }
      const rawDelta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      // Clamp deltaTime to safe boundaries [0, MAX_DELTA]
      const deltaTime = Math.min(Math.max(rawDelta, 0), MAX_DELTA);
      const timeScale = deltaTime * 60; // 1.0 at standard 60 FPS reference

      // 1. Keyboard paddle movement (scaled by timeScale for frame-rate independence)
      if (keysPressed.current.left) {
        engine.movePaddleBy(-engine.paddle.speed * timeScale);
      }
      if (keysPressed.current.right) {
        engine.movePaddleBy(engine.paddle.speed * timeScale);
      }

      // 2. Physics update with frame-independent deltaTime
      engine.update(deltaTime);

      // Check status sync
      if (engine.status !== status) {
        onStatusChange(engine.status);
      }

      // 3. Render Canvas with High-DPI Transform
      const physicalWidth = canvas.width;
      const physicalHeight = canvas.height;

      // Clear physical backing store
      ctx.clearRect(0, 0, physicalWidth, physicalHeight);

      // Save context and apply logical scale transformation
      ctx.save();
      const scaleX = physicalWidth / CANVAS_WIDTH;
      const scaleY = physicalHeight / CANVAS_HEIGHT;
      ctx.scale(scaleX, scaleY);
      ctx.imageSmoothingEnabled = true;

      // 1. Camera Screen Shake (Applied to logical coordinate system)
      ctx.translate(engine.shakeOffset.x, engine.shakeOffset.y);

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

      // Draw Shockwaves (Expanding explosion shockwaves)
      for (const sw of engine.shockwaves) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Impact Flashes (Radial bright bursts)
      for (const flash of engine.impactFlashes) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, flash.alpha);
        const grad = ctx.createRadialGradient(
          flash.x,
          flash.y,
          0,
          flash.x,
          flash.y,
          flash.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, flash.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Bottom Safety Shield Barrier
      if (engine.shieldActive) {
        renderBottomShield(ctx, CANVAS_HEIGHT - 10, CANVAS_WIDTH, engine.gameTime);
      }

      // Draw Bricks (Modular system with cracks, armor plates, gold rivets, moving tracks, and explosions)
      for (const brick of engine.bricks) {
        renderBrick(ctx, brick, engine.gameTime);
      }

      // Draw Power-ups (Modular 3D styled items with pulse glows)
      for (const p of engine.powerUps) {
        renderPowerUpItem(ctx, p, engine.gameTime);
      }

      // Draw Laser Projectiles
      renderLaserBolts(ctx, engine.laserBolts);

      // Draw Destruction Particles (Debris Shards & Spark Motes)
      for (const pt of engine.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        if (pt.type === 'shard' && pt.width && pt.height) {
          ctx.translate(pt.x, pt.y);
          if (pt.rotation) ctx.rotate(pt.rotation);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.width / 2, -pt.height / 2, pt.width, pt.height);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(-pt.width / 2, -pt.height / 2, pt.width, pt.height);
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(0.5, pt.radius), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Paddle (with Movement Glow & Impact Squash Animation)
      const squash = engine.paddle.squashFactor || 0;
      const paddleW = engine.paddle.width * (1 + squash * 0.2);
      const paddleH = engine.paddle.height * (1 - squash * 0.38);
      const paddleX = engine.paddle.x - (paddleW - engine.paddle.width) / 2;
      const paddleY = engine.paddle.y + (engine.paddle.height - paddleH);

      // Paddle Movement Glow (Thruster plasma streak on active motion)
      const paddleVx = engine.paddle.velocity || 0;
      const absVx = Math.abs(paddleVx);
      if (absVx > 0.4) {
        ctx.save();
        const glowWidth = Math.min(32, absVx * 3.5);
        if (paddleVx > 0) {
          // Moving Right -> plasma trail from left edge
          const trailGrad = ctx.createLinearGradient(
            paddleX,
            paddleY,
            paddleX - glowWidth,
            paddleY
          );
          trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
          trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = trailGrad;
          ctx.fillRect(paddleX - glowWidth, paddleY, glowWidth, paddleH);
        } else {
          // Moving Left -> plasma trail from right edge
          const trailGrad = ctx.createLinearGradient(
            paddleX + paddleW,
            paddleY,
            paddleX + paddleW + glowWidth,
            paddleY
          );
          trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
          trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = trailGrad;
          ctx.fillRect(paddleX + paddleW, paddleY, glowWidth, paddleH);
        }
        ctx.restore();
      }

      // Paddle Ambient Floor Glow
      ctx.save();
      const underGlow = ctx.createRadialGradient(
        paddleX + paddleW / 2,
        paddleY + paddleH + 2,
        2,
        paddleX + paddleW / 2,
        paddleY + paddleH + 2,
        paddleW * 0.65
      );
      underGlow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      underGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = underGlow;
      ctx.fillRect(paddleX - 15, paddleY + paddleH, paddleW + 30, 8);
      ctx.restore();

      // Paddle Body
      ctx.save();
      ctx.fillStyle = engine.paddle.color;
      ctx.beginPath();
      ctx.roundRect(paddleX, paddleY, paddleW, paddleH, 3);
      ctx.fill();

      // Paddle top specular line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(paddleX + 2, paddleY + 1, Math.max(0, paddleW - 4), 2);

      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Draw Paddle Modular Attachments (Laser Blasters & Magnetic Coils)
      renderPaddleAttachments(ctx, engine.paddle, engine.gameTime);

      // Draw Balls (with Glowing Trail, Speed-based Glow, Fireball Aura, and Impact Flash)
      for (const ball of engine.balls) {
        const glowInfo = engine.getBallColorAndGlow(ball);
        const ballCenterX = ball.x + ball.radius;
        const ballCenterY = ball.y + ball.radius;

        // 1. Ball Glowing Trail
        if (ball.trail && ball.trail.length > 0) {
          for (let i = ball.trail.length - 1; i >= 0; i--) {
            const node = ball.trail[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, node.alpha * 0.65);
            ctx.fillStyle = node.color || glowInfo.glowColor;
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.max(1, node.radius), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // 2. Speed-based Glow Aura (or blazing Fireball plasma ring)
        ctx.save();
        if (ball.isFireball) {
          const fireRadius = ball.radius * (2.2 + Math.sin(engine.gameTime * 14) * 0.3);
          const fireGrad = ctx.createRadialGradient(
            ballCenterX,
            ballCenterY,
            ball.radius * 0.3,
            ballCenterX,
            ballCenterY,
            fireRadius
          );
          fireGrad.addColorStop(0, '#f97316');
          fireGrad.addColorStop(0.5, '#ef4444');
          fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(ballCenterX, ballCenterY, fireRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const auraRadius = ball.radius * (1.8 + glowInfo.speedRatio * 1.5);
          const auraGrad = ctx.createRadialGradient(
            ballCenterX,
            ballCenterY,
            ball.radius * 0.35,
            ballCenterX,
            ballCenterY,
            auraRadius
          );
          auraGrad.addColorStop(0, glowInfo.glowColor);
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(ballCenterX, ballCenterY, auraRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 3. Ball Core Body (Color shifts according to speed or Fireball mode)
        ctx.save();
        ctx.fillStyle = ball.isFireball ? '#ea580c' : glowInfo.baseColor;
        ctx.beginPath();
        ctx.arc(ballCenterX, ballCenterY, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Specular 3D highlight
        ctx.fillStyle = ball.isFireball ? 'rgba(254, 240, 138, 0.8)' : 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(
          ball.x + ball.radius * 0.7,
          ball.y + ball.radius * 0.7,
          ball.radius * 0.35,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // 4. Impact Flash (White-hot burst on hit)
        if (ball.impactFlash && ball.impactFlash > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = Math.min(1, ball.impactFlash * 0.95);
          ctx.beginPath();
          ctx.arc(ballCenterX, ballCenterY, ball.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = ball.isFireball ? '#7c2d12' : '#991b1b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Floating Texts (Score numbers with scale pop & Combo Messages)
      for (const ft of engine.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        const scale = ft.scale || 1.0;
        ctx.translate(ft.x, ft.y);
        ctx.scale(scale, scale);

        if (ft.isCombo) {
          // Celebratory combo typography
          ctx.font = '900 13px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#020617';
          ctx.strokeText(ft.text, 0, 0);

          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, 0, 0);
        } else {
          // Floating score numbers
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#020617';
          ctx.strokeText(ft.text, 0, 0);

          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, 0, 0);
        }
        ctx.restore();
      }

      // Impact Feedback Vignette (Edge red alert flash)
      if (engine.impactVignette > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(engine.impactVignette * 0.45, 0.45);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
      }

      // Draw Level Complete Animation Banner
      if (engine.status === 'level_cleared') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const bannerY = CANVAS_HEIGHT / 2;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 150, bannerY - 45, 300, 90, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL CLEARED!', CANVAS_WIDTH / 2, bannerY - 8);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('+500 LEVEL BONUS', CANVAS_WIDTH / 2, bannerY + 22);
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

      // Restore outer High-DPI context scale
      ctx.restore();

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
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-none touch-none"
      />

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
    </div>
  );
};
