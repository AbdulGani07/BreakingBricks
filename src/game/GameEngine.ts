import {
  Brick,
  Ball,
  Paddle,
  PowerUpItem,
  Particle,
  FloatingText,
  GameStats,
  GameStatus,
  PowerUpType,
  ActiveBuff,
  Shockwave,
  ImpactFlash,
  LaserBolt,
} from '../types';
import { audioSystem } from '../audio/AudioSystem';
import {
  generateModularLevelBricks,
  updateBricks,
  triggerExplosiveBlast,
} from './Brick';
import {
  POWER_UP_CONFIGS,
  createPowerUpItem,
  updatePowerUpItems,
  createLaserBolts,
  updateLaserBolts,
} from './PowerUp';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export class GameEngine {
  public paddle: Paddle;
  public balls: Ball[] = [];
  public bricks: Brick[] = [];
  public powerUps: PowerUpItem[] = [];
  public laserBolts: LaserBolt[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public shockwaves: Shockwave[] = [];
  public impactFlashes: ImpactFlash[] = [];
  public trauma: number = 0;
  public shakeOffset: { x: number; y: number } = { x: 0, y: 0 };
  public hitStopTimer: number = 0;
  public impactVignette: number = 0;

  public shieldActive: boolean = false;
  public laserTimer: number = 0;
  public gameTime: number = 0;

  public score: number = 0;
  public highScore: number = 0;
  public lives: number = 3;
  public level: number = 1;
  public bricksBroken: number = 0;
  public totalBricksInLevel: number = 0;
  public combo: number = 0;
  public maxCombo: number = 0;
  public activeBuffs: ActiveBuff[] = [];

  public status: GameStatus = 'idle';
  public countdown: number = 3;
  private countdownTimer: number | null = null;

  private onStateChange?: () => void;

  constructor(onStateChange?: () => void) {
    this.onStateChange = onStateChange;
    this.paddle = {
      x: 250,
      y: 350,
      width: 60,
      height: 10,
      speed: 10,
      color: '#3b82f6', // Blue as in original Java Paddle.java
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('breaking_bricks_high_score');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    }

    this.resetBalls();
    this.createBricksForLevel(this.level);
  }

  public resetBalls() {
    this.balls = [
      {
        id: 'ball-1',
        x: 300 - 10,
        y: 200,
        radius: 10,
        speed: 4,
        dx: 2.8,
        dy: -3.2,
        color: '#ef4444', // Red as in original Java Ball.java
      },
    ];
  }

  public startCountdown() {
    if (this.status === 'playing' || this.status === 'countdown') return;

    this.status = 'countdown';
    this.countdown = 3;
    audioSystem.playCountdown(false);
    this.notify();

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = window.setInterval(() => {
      this.countdown--;
      if (this.countdown > 0) {
        audioSystem.playCountdown(false);
        this.notify();
      } else {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        audioSystem.playCountdown(true);
        this.status = 'playing';
        this.notify();
      }
    }, 1000);
  }

  public togglePause() {
    if (this.status === 'playing') {
      this.status = 'paused';
    } else if (this.status === 'paused') {
      this.status = 'playing';
    }
    this.notify();
  }

  public restartGame() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.bricksBroken = 0;
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.activeBuffs = [];
    this.powerUps = [];
    this.laserBolts = [];
    this.shieldActive = false;
    this.paddle.hasLaser = false;
    this.paddle.hasMagnet = false;
    this.paddle.width = 60;
    this.paddle.x = 250;
    this.resetBalls();
    this.createBricksForLevel(this.level);
    this.status = 'idle';
    this.notify();
    this.startCountdown();
  }

  public returnToMainMenu() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
    this.status = 'idle';
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.bricksBroken = 0;
    this.powerUps = [];
    this.laserBolts = [];
    this.particles = [];
    this.floatingTexts = [];
    this.activeBuffs = [];
    this.shieldActive = false;
    this.paddle.hasLaser = false;
    this.paddle.hasMagnet = false;
    this.paddle.width = 60;
    this.paddle.x = 250;
    this.resetBalls();
    this.createBricksForLevel(this.level);
    this.notify();
  }

  public createBricksForLevel(lvl: number) {
    this.bricks = generateModularLevelBricks(lvl);
    this.totalBricksInLevel = this.bricks.length;
  }

  public fireLasers() {
    if (!this.paddle.hasLaser || this.status !== 'playing') return;
    const bolts = createLaserBolts(this.paddle.x, this.paddle.y, this.paddle.width);
    this.laserBolts.push(...bolts);
    audioSystem.playLaserShoot();
  }

  public launchStuckBalls() {
    if (this.status !== 'playing') return;
    let launched = false;
    for (const ball of this.balls) {
      if (ball.stuckToPaddle) {
        ball.stuckToPaddle = false;
        const currentSpeed = Math.hypot(ball.dx, ball.dy) || 4.2;
        const offsetRatio = (ball.stuckOffsetX || 0) / (this.paddle.width / 2);
        const targetAngle = offsetRatio * (Math.PI / 3.2);
        ball.dx = currentSpeed * Math.sin(targetAngle);
        ball.dy = -Math.abs(currentSpeed * Math.cos(targetAngle));
        if (Math.abs(ball.dy) < 1.8) ball.dy = -1.8;
        ball.impactFlash = 0.8;
        audioSystem.playPaddleHit(offsetRatio);
        launched = true;
      }
    }
    if (this.paddle.hasLaser) {
      this.fireLasers();
    }
    return launched;
  }

  public movePaddleTo(mouseX: number) {
    const targetX = mouseX - this.paddle.width / 2;
    const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - this.paddle.width, targetX));
    const delta = clampedX - this.paddle.x;
    this.paddle.velocity = (this.paddle.velocity || 0) * 0.4 + delta * 0.6;
    this.paddle.prevX = this.paddle.x;
    this.paddle.x = clampedX;
  }

  public movePaddleBy(deltaX: number) {
    const targetX = this.paddle.x + deltaX;
    const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - this.paddle.width, targetX));
    const delta = clampedX - this.paddle.x;
    this.paddle.velocity = (this.paddle.velocity || 0) * 0.4 + delta * 0.6;
    this.paddle.prevX = this.paddle.x;
    this.paddle.x = clampedX;
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public triggerHitStop(duration: number = 0.038) {
    this.hitStopTimer = duration;
  }

  public spawnImpactFlash(x: number, y: number, color: string = '#ffffff', radius: number = 18) {
    this.impactFlashes.push({
      id: `flash-${Date.now()}-${Math.random()}`,
      x,
      y,
      radius,
      color,
      alpha: 1,
      life: 1,
    });
    if (this.impactFlashes.length > 10) {
      this.impactFlashes.shift();
    }
  }

  public spawnShockwave(x: number, y: number, color: string, maxRadius: number = 36, lineWidth: number = 2.5) {
    this.shockwaves.push({
      id: `sw-${Date.now()}-${Math.random()}`,
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      alpha: 0.9,
      lineWidth,
    });
    if (this.shockwaves.length > 8) {
      this.shockwaves.shift();
    }
  }

  public getBallColorAndGlow(ball: Ball): { baseColor: string; glowColor: string; speedRatio: number } {
    const currentSpeed = Math.hypot(ball.dx, ball.dy);
    // Base speed is around 4.0, max is 8.5
    const speedRatio = Math.min(Math.max((currentSpeed - 3.8) / 4.2, 0), 1);

    let baseColor = ball.color;
    let glowColor = 'rgba(239, 68, 68, 0.45)';

    if (speedRatio > 0.7) {
      baseColor = '#f43f5e';
      glowColor = 'rgba(244, 63, 94, 0.75)';
    } else if (speedRatio > 0.35) {
      baseColor = '#f59e0b';
      glowColor = 'rgba(245, 158, 11, 0.6)';
    } else {
      baseColor = ball.color;
      glowColor = 'rgba(239, 68, 68, 0.45)';
    }

    return { baseColor, glowColor, speedRatio };
  }

  public update(deltaTime: number = 1 / 60) {
    if (this.status !== 'playing') return;

    // Normalized time scale: 1.0 at standard 60 FPS (deltaTime = 0.01667s)
    const timeScale = deltaTime * 60;

    // Camera Screen Shake Decay
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - 1.8 * deltaTime);
      const shakeMagnitude = this.trauma * this.trauma * 9; // up to 9px max shake
      this.shakeOffset.x = (Math.random() * 2 - 1) * shakeMagnitude;
      this.shakeOffset.y = (Math.random() * 2 - 1) * shakeMagnitude;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    // Impact feedback edge vignette decay
    if (this.impactVignette > 0) {
      this.impactVignette = Math.max(0, this.impactVignette - 3.5 * deltaTime);
    }

    // Paddle squash factor recovery (spring damping)
    if (this.paddle.squashFactor && this.paddle.squashFactor > 0) {
      this.paddle.squashFactor = Math.max(0, this.paddle.squashFactor - 5.5 * deltaTime);
    }

    // Paddle velocity damping for movement glow
    if (this.paddle.velocity) {
      this.paddle.velocity *= 0.85;
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.22 * timeScale + 1.2 * timeScale;
      sw.alpha -= 0.045 * timeScale;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Impact Flashes
    for (let i = this.impactFlashes.length - 1; i >= 0; i--) {
      const flash = this.impactFlashes[i];
      flash.life -= 0.08 * timeScale;
      flash.alpha = Math.max(0, flash.life);
      if (flash.life <= 0) {
        this.impactFlashes.splice(i, 1);
      }
    }

    // Update Brick hit flash
    for (const b of this.bricks) {
      if (b.hitFlash && b.hitFlash > 0) {
        b.hitFlash = Math.max(0, b.hitFlash - 7 * deltaTime);
      }
    }

    // Update Particles with gravity, spin, and velocity
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      if (pt.gravity) {
        pt.dy += pt.gravity * timeScale;
      }
      pt.x += pt.dx * timeScale;
      pt.y += pt.dy * timeScale;
      if (pt.vRot && pt.rotation !== undefined) {
        pt.rotation += pt.vRot * timeScale;
      }
      pt.life -= 0.022 * timeScale;
      pt.alpha = Math.max(0, pt.life);
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating texts (upward drift and scale pop recovery)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.dy * timeScale;
      if (ft.scale && ft.scale > 1) {
        ft.scale = Math.max(1, ft.scale - 0.06 * timeScale);
      }
      ft.alpha -= 0.018 * timeScale;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Hit-stop micro-freeze: freeze balls and falling objects for crisp impact weight
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= deltaTime;
      return;
    }

    this.gameTime += deltaTime;

    // Update moving bricks and animation phases
    updateBricks(this.bricks, deltaTime);

    // Update laser bolts
    updateLaserBolts(this.laserBolts, deltaTime);

    // Auto-fire lasers if equipped
    if (this.paddle.hasLaser) {
      this.laserTimer += deltaTime;
      if (this.laserTimer >= 0.42) {
        this.laserTimer = 0;
        this.fireLasers();
      }
    }

    // Laser vs Brick collisions
    for (let lIdx = this.laserBolts.length - 1; lIdx >= 0; lIdx--) {
      const bolt = this.laserBolts[lIdx];
      if (bolt.y < 0) {
        this.laserBolts.splice(lIdx, 1);
        continue;
      }
      let hit = false;
      for (const brick of this.bricks) {
        if (!brick.visible) continue;
        if (
          bolt.x + bolt.width >= brick.x &&
          bolt.x <= brick.x + brick.width &&
          bolt.y <= brick.y + brick.height &&
          bolt.y + bolt.height >= brick.y
        ) {
          hit = true;
          this.handleBrickHit(brick, bolt.x, bolt.y, true, false);
          break;
        }
      }
      if (hit) {
        this.laserBolts.splice(lIdx, 1);
      }
    }

    // 1. Update active power-up buffs
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      const buff = this.activeBuffs[i];
      buff.duration -= deltaTime;
      if (buff.duration <= 0) {
        if (buff.type === 'laser') {
          this.paddle.hasLaser = false;
        } else if (buff.type === 'shield') {
          this.shieldActive = false;
        } else if (buff.type === 'magnet_paddle') {
          this.paddle.hasMagnet = false;
          this.launchStuckBalls();
        } else if (buff.type === 'fire_ball') {
          for (const b of this.balls) {
            b.isFireball = false;
          }
        }
        this.activeBuffs.splice(i, 1);
        this.notify();
      }
    }

    // 2. Update falling power-ups
    updatePowerUpItems(this.powerUps, deltaTime);
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];

      // Check collision with paddle
      if (
        p.y + p.height >= this.paddle.y &&
        p.y <= this.paddle.y + this.paddle.height &&
        p.x + p.width >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width
      ) {
        this.applyPowerUp(p.type, p.x, p.y);
        this.powerUps.splice(i, 1);
        audioSystem.playPowerUp();
        this.addTrauma(0.12);
        this.spawnShockwave(p.x + p.width / 2, this.paddle.y, '#38bdf8', 28);
        continue;
      }

      // Check fallen off screen
      if (p.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
      }
    }

    // Slow motion speed scale
    const hasSlowMo = this.activeBuffs.some((b) => b.type === 'slow_motion');
    const speedFactor = hasSlowMo ? 0.55 : 1.0;

    // 3. Update balls & collisions
    for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
      const ball = this.balls[bIndex];

      // If ball is caught by magnet paddle
      if (ball.stuckToPaddle) {
        ball.x = this.paddle.x + this.paddle.width / 2 + (ball.stuckOffsetX || 0) - ball.radius;
        ball.y = this.paddle.y - ball.radius * 2;
        continue;
      }

      const moveX = ball.dx * timeScale * speedFactor;
      const moveY = ball.dy * timeScale * speedFactor;
      ball.x += moveX;
      ball.y += moveY;

      // Ball impact flash timer recovery
      if (ball.impactFlash && ball.impactFlash > 0) {
        ball.impactFlash = Math.max(0, ball.impactFlash - 7 * deltaTime);
      }

      // Ball Glowing Trail nodes recording
      if (!ball.trail) ball.trail = [];
      const glowInfo = this.getBallColorAndGlow(ball);
      const trailColor = ball.isFireball ? '#fb923c' : glowInfo.glowColor;
      ball.trail.unshift({
        x: ball.x + ball.radius,
        y: ball.y + ball.radius,
        radius: ball.radius * (ball.isFireball ? 1.05 : 0.85),
        alpha: ball.isFireball ? 0.85 : 0.7,
        color: trailColor,
      });
      if (ball.trail.length > 10) {
        ball.trail.length = 10;
      }
      for (let t = ball.trail.length - 1; t >= 0; t--) {
        ball.trail[t].alpha -= 0.065 * timeScale;
        ball.trail[t].radius *= 0.95;
        if (ball.trail[t].alpha <= 0) {
          ball.trail.splice(t, 1);
        }
      }

      const diameter = ball.radius * 2;

      // Wall collisions
      if (ball.x <= 0) {
        ball.x = 0;
        ball.dx = Math.abs(ball.dx);
        ball.impactFlash = 0.7;
        audioSystem.playWallBounce();
        this.spawnWallSparks(0, ball.y + ball.radius);
        this.spawnImpactFlash(0, ball.y + ball.radius, '#e2e8f0', 14);
        this.addTrauma(0.05);
      } else if (ball.x + diameter >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - diameter;
        ball.dx = -Math.abs(ball.dx);
        ball.impactFlash = 0.7;
        audioSystem.playWallBounce();
        this.spawnWallSparks(CANVAS_WIDTH, ball.y + ball.radius);
        this.spawnImpactFlash(CANVAS_WIDTH, ball.y + ball.radius, '#e2e8f0', 14);
        this.addTrauma(0.05);
      }

      if (ball.y <= 0) {
        ball.y = 0;
        ball.dy = Math.abs(ball.dy);
        ball.impactFlash = 0.7;
        audioSystem.playWallBounce();
        this.spawnWallSparks(ball.x + ball.radius, 0);
        this.spawnImpactFlash(ball.x + ball.radius, 0, '#e2e8f0', 14);
        this.addTrauma(0.05);
      }

      // Bottom Safety Shield deflection
      if (this.shieldActive && ball.y + diameter >= CANVAS_HEIGHT - 12 && ball.dy > 0) {
        ball.y = CANVAS_HEIGHT - 12 - diameter;
        ball.dy = -Math.abs(ball.dy);
        ball.impactFlash = 1.0;
        audioSystem.playShieldBounce();
        this.spawnShockwave(ball.x + ball.radius, CANVAS_HEIGHT - 12, '#10b981', 45, 3);
        this.addTrauma(0.1);
        this.floatingTexts.push({
          id: `ft-shield-${Date.now()}`,
          x: ball.x,
          y: CANVAS_HEIGHT - 28,
          text: 'SHIELD DEFLECT!',
          color: '#34d399',
          alpha: 1,
          dy: -1,
        });
      }

      // Paddle collision
      if (
        ball.y + diameter >= this.paddle.y &&
        ball.y <= this.paddle.y + this.paddle.height &&
        ball.x + diameter >= this.paddle.x &&
        ball.x <= this.paddle.x + this.paddle.width &&
        ball.dy > 0
      ) {
        // Paddle hit ends current airborne combo streak
        this.combo = 0;

        // Magnet Paddle check
        if (this.paddle.hasMagnet) {
          ball.stuckToPaddle = true;
          ball.stuckOffsetX = (ball.x + ball.radius) - (this.paddle.x + this.paddle.width / 2);
          audioSystem.playMagnetAttach();
          this.floatingTexts.push({
            id: `ft-mag-${Date.now()}`,
            x: ball.x,
            y: this.paddle.y - 18,
            text: 'CLICK OR SPACE TO LAUNCH',
            color: '#c084fc',
            alpha: 1,
            dy: -0.5,
          });
          continue;
        }

        // Calculate deflection angle based on hit position
        const paddleCenter = this.paddle.x + this.paddle.width / 2;
        const ballCenter = ball.x + ball.radius;
        const hitOffset = (ballCenter - paddleCenter) / (this.paddle.width / 2); // -1 to +1

        const currentSpeed = Math.hypot(ball.dx, ball.dy);
        const maxAngle = Math.PI / 3; // 60 degrees max angle
        const targetAngle = hitOffset * maxAngle;

        ball.dx = currentSpeed * Math.sin(targetAngle);
        ball.dy = -Math.abs(currentSpeed * Math.cos(targetAngle));

        // Ensure minimum vertical velocity so ball doesn't get stuck horizontally
        if (Math.abs(ball.dy) < 1.8) {
          ball.dy = -1.8;
        }

        // Impact squash animation & visual effects
        this.paddle.squashFactor = 1.0;
        ball.impactFlash = 1.0;
        audioSystem.playPaddleHit(hitOffset);
        this.spawnPaddleParticles(ballCenter, this.paddle.y);
        this.spawnImpactFlash(ballCenter, this.paddle.y, '#60a5fa', 18);
        this.spawnShockwave(ballCenter, this.paddle.y, '#38bdf8', 26);
        this.addTrauma(0.08);
      }

      // Brick collision
      for (const brick of this.bricks) {
        if (!brick.visible) continue;

        if (
          ball.x + diameter >= brick.x &&
          ball.x <= brick.x + brick.width &&
          ball.y + diameter >= brick.y &&
          ball.y <= brick.y + brick.height
        ) {
          // Contact position for impact effects
          const impactX = Math.max(brick.x, Math.min(brick.x + brick.width, ball.x + ball.radius));
          const impactY = Math.max(brick.y, Math.min(brick.y + brick.height, ball.y + ball.radius));

          // If Fireball is active, ball punches straight through without bouncing off unless brick survives
          const willDestroyImmediately = ball.isFireball && (brick.hits + 2 >= brick.maxHits);

          if (!ball.isFireball || !willDestroyImmediately) {
            // Determine collision face using displacement in this frame
            const prevBallX = ball.x - moveX;
            const prevBallY = ball.y - moveY;

            const wasLeft = prevBallX + diameter <= brick.x;
            const wasRight = prevBallX >= brick.x + brick.width;
            const wasTop = prevBallY + diameter <= brick.y;
            const wasBottom = prevBallY >= brick.y + brick.height;

            if (wasLeft || wasRight) {
              ball.dx = -ball.dx;
            } else if (wasTop || wasBottom) {
              ball.dy = -ball.dy;
            } else {
              ball.dy = -ball.dy;
            }
          }

          ball.impactFlash = 1.0;
          this.spawnImpactFlash(impactX, impactY, ball.isFireball ? '#f97316' : '#ffffff', 22);

          // Handle brick damage & destruction
          this.handleBrickHit(brick, impactX, impactY, false, !!ball.isFireball);

          // Speed increase slightly
          const speedBoost = 1.015;
          const currentSpeed = Math.hypot(ball.dx, ball.dy);
          if (currentSpeed < 8.5) {
            ball.dx *= speedBoost;
            ball.dy *= speedBoost;
          }

          break;
        }
      }

      // Ball falls below screen
      if (ball.y > CANVAS_HEIGHT) {
        this.balls.splice(bIndex, 1);
      }
    }

    // Check if all balls lost
    if (this.balls.length === 0) {
      this.loseLife();
    }
  }

  public handleBrickHit(
    brick: Brick,
    impactX: number,
    impactY: number,
    isLaser: boolean = false,
    isFireball: boolean = false
  ) {
    if (!brick.visible) return;

    const damage = isFireball ? 2 : 1;
    brick.hits += damage;

    if (brick.hits < brick.maxHits) {
      // Brick damaged but still standing
      brick.hitFlash = 1.0;
      const relX = impactX - brick.x;
      const relY = impactY - brick.y;
      brick.cracks = [
        { x1: relX, y1: relY, x2: relX + (Math.random() - 0.5) * 22, y2: relY + (Math.random() - 0.5) * 12 },
        { x1: relX, y1: relY, x2: relX + (Math.random() - 0.5) * 18, y2: relY + (Math.random() - 0.5) * 14 },
      ];
      audioSystem.playBrickHit(1.2);
      this.addTrauma(0.1);
      this.triggerHitStop(0.02);
      return;
    }

    // Brick destroyed!
    brick.visible = false;
    this.bricksBroken++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    const comboMultiplier = Math.min(this.combo, 5);
    const earnedPoints = brick.points * comboMultiplier;
    this.addScore(earnedPoints);

    audioSystem.playBrickDestroy(this.combo);
    this.spawnBrickExplosion(brick);
    this.spawnShockwave(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 36);

    this.addTrauma(0.16 + (comboMultiplier > 1 ? 0.05 : 0));
    this.triggerHitStop(comboMultiplier >= 3 ? 0.04 : 0.025);

    // Drop power-up if attached
    if (brick.powerUp) {
      this.powerUps.push(
        createPowerUpItem(brick.powerUp, brick.x + brick.width / 2, brick.y + brick.height)
      );
    }

    // Explosive Brick Detonation: destroys nearby bricks!
    if (brick.type === 'explosive') {
      audioSystem.playExplosion();
      this.spawnShockwave(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ea580c', 80, 5);
      this.addTrauma(0.35);

      this.floatingTexts.push({
        id: `ft-boom-${Date.now()}`,
        x: brick.x + brick.width / 2,
        y: brick.y - 12,
        text: '💥 BOOM!',
        color: '#f97316',
        alpha: 1,
        dy: -1,
        scale: 1.8,
      });

      const blastVictims = triggerExplosiveBlast(brick, this.bricks, 72);
      for (const victim of blastVictims) {
        this.handleBrickHit(
          victim,
          victim.x + victim.width / 2,
          victim.y + victim.height / 2,
          false,
          false
        );
      }
    }

    // Floating score text with scale pop
    const scoreText = comboMultiplier > 1 ? `+${earnedPoints} (x${comboMultiplier})` : `+${earnedPoints}`;
    this.floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      x: brick.x + brick.width / 2,
      y: brick.y,
      text: scoreText,
      color: comboMultiplier > 1 ? '#f59e0b' : '#fde047',
      alpha: 1,
      dy: -0.9,
      scale: 1.5,
      fontSize: 13,
    });

    // Floating combo milestone messages
    if (this.combo >= 2) {
      let comboMsg = `COMBO x${this.combo}!`;
      let comboColor = '#f59e0b';
      if (this.combo === 3) {
        comboMsg = 'SUPER COMBO x3!';
        comboColor = '#ec4899';
      } else if (this.combo === 4) {
        comboMsg = 'MEGA STRIKE x4!';
        comboColor = '#06b6d4';
      } else if (this.combo >= 5) {
        comboMsg = 'MAX POWER x5!';
        comboColor = '#a855f7';
      }

      this.floatingTexts.push({
        id: `ft-combo-${Date.now()}-${Math.random()}`,
        x: brick.x + brick.width / 2,
        y: brick.y - 16,
        text: comboMsg,
        color: comboColor,
        alpha: 1,
        dy: -0.6,
        scale: 1.6,
        isCombo: true,
        fontSize: 14,
      });
    }

    this.checkLevelClear();
  }

  private applyPowerUp(type: PowerUpType, x: number, y: number) {
    const config = POWER_UP_CONFIGS[type];
    let text = config ? config.name.toUpperCase() + '!' : 'POWER UP!';

    switch (type) {
      case 'multi_ball': {
        const newBalls: Ball[] = [];
        if (this.balls.length === 0) {
          this.resetBalls();
        }
        for (const b of this.balls) {
          const speed = Math.hypot(b.dx, b.dy) || 4.2;
          newBalls.push(
            {
              id: `ball-${Date.now()}-1`,
              x: b.x,
              y: b.y,
              dx: speed * Math.cos(-Math.PI / 4),
              dy: -Math.abs(speed * Math.sin(-Math.PI / 4)),
              radius: b.radius,
              speed: b.speed,
              color: '#38bdf8',
              isFireball: b.isFireball,
            },
            {
              id: `ball-${Date.now()}-2`,
              x: b.x,
              y: b.y,
              dx: speed * Math.cos(-3 * Math.PI / 4),
              dy: -Math.abs(speed * Math.sin(-3 * Math.PI / 4)),
              radius: b.radius,
              speed: b.speed,
              color: '#38bdf8',
              isFireball: b.isFireball,
            }
          );
        }
        this.balls.push(...newBalls);
        text = 'MULTI-BALL!';
        break;
      }

      case 'fire_ball': {
        for (const b of this.balls) {
          b.isFireball = true;
        }
        this.addBuff('fire_ball', 'Fire Ball', 10);
        text = 'FIRE BALL!';
        break;
      }

      case 'laser': {
        this.paddle.hasLaser = true;
        this.addBuff('laser', 'Laser Blaster', 12);
        this.fireLasers();
        text = 'LASER ARMED!';
        break;
      }

      case 'shield': {
        this.shieldActive = true;
        this.addBuff('shield', 'Energy Shield', 16);
        text = 'SHIELD ACTIVE!';
        break;
      }

      case 'magnet_paddle': {
        this.paddle.hasMagnet = true;
        this.addBuff('magnet_paddle', 'Magnet Paddle', 14);
        text = 'MAGNET PADDLE!';
        break;
      }

      case 'slow_motion': {
        this.addBuff('slow_motion', 'Slow Motion', 10);
        text = 'SLOW MOTION!';
        break;
      }
    }

    this.floatingTexts.push({
      id: `ft-pw-${Date.now()}`,
      x,
      y,
      text,
      color: config ? config.color : '#38bdf8',
      alpha: 1,
      dy: -1,
      scale: 1.4,
    });
  }

  private addBuff(type: PowerUpType, label: string, duration: number) {
    this.activeBuffs = this.activeBuffs.filter((b) => b.type !== type);
    this.activeBuffs.push({
      id: `buff-${Date.now()}-${type}`,
      type,
      label,
      duration,
      maxDuration: duration,
    });
    this.notify();
  }

  private checkLevelClear() {
    const remaining = this.bricks.filter((b) => b.visible).length;
    if (remaining === 0) {
      audioSystem.playLevelClear();
      this.spawnShockwave(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#38bdf8', 160, 4);
      this.spawnShockwave(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#fbbf24', 220, 3);
      this.addTrauma(0.35);

      if (this.level >= 10) {
        this.status = 'game_won';
      } else {
        this.status = 'level_cleared';
        setTimeout(() => {
          this.nextLevel();
        }, 1500);
      }
      this.notify();
    }
  }

  public nextLevel() {
    this.level++;
    this.resetBalls();
    this.paddle.x = 250;
    this.paddle.width = 60;
    this.powerUps = [];
    this.createBricksForLevel(this.level);
    this.startCountdown();
  }

  public addScore(points: number) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (typeof window !== 'undefined') {
        localStorage.setItem('breaking_bricks_high_score', this.highScore.toString());
      }
    }
    this.notify();
  }

  public loseLife() {
    this.lives--;
    this.combo = 0;
    audioSystem.playLifeLost();
    this.addTrauma(0.5);
    this.impactVignette = 1.0;

    if (this.lives <= 0) {
      this.status = 'game_over';
      this.notify();
    } else {
      this.resetBalls();
      this.paddle.x = 250;
      this.paddle.width = 60;
      this.startCountdown();
    }
  }

  private spawnBrickExplosion(brick: Brick) {
    // 1. Shard particles (angular brick fragments with spin and gravity)
    for (let i = 0; i < 9; i++) {
      const angle = (Math.PI * 2 * i) / 9 + (Math.random() - 0.5) * 0.4;
      const speed = 2.0 + Math.random() * 3.5;
      this.particles.push({
        x: brick.x + brick.width / 2 + (Math.random() - 0.5) * (brick.width * 0.6),
        y: brick.y + brick.height / 2 + (Math.random() - 0.5) * (brick.height * 0.6),
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 1.2, // slight upward pop
        color: brick.color,
        alpha: 1,
        radius: 3,
        width: 4 + Math.random() * 5,
        height: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        gravity: 0.16,
        life: 1,
        type: 'shard',
      });
    }

    // 2. High-speed spark motes
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 3.5;
      this.particles.push({
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: '#ffffff',
        alpha: 1,
        radius: 1.5 + Math.random() * 1.5,
        life: 0.6,
        type: 'spark',
      });
    }

    // Cap particle array to 140 to prevent any memory or canvas overhead
    if (this.particles.length > 140) {
      this.particles.splice(0, this.particles.length - 140);
    }
  }

  private spawnPaddleParticles(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 24,
        y: y,
        dx: (Math.random() - 0.5) * 3,
        dy: -1.5 - Math.random() * 2.5,
        color: '#60a5fa',
        alpha: 0.9,
        radius: 2,
        life: 0.6,
        type: 'spark',
      });
    }
  }

  private spawnWallSparks(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 3,
        dy: (Math.random() - 0.5) * 3,
        color: '#f8fafc',
        alpha: 0.8,
        radius: 1.8,
        life: 0.45,
        type: 'spark',
      });
    }
  }

  public getStats(): GameStats {
    const remainingBricks = this.bricks.filter((b) => b.visible).length;
    return {
      score: this.score,
      highScore: this.highScore,
      lives: this.lives,
      level: this.level,
      bricksBroken: this.bricksBroken,
      totalBricksInLevel: this.totalBricksInLevel,
      remainingBricks,
      combo: this.combo,
      maxCombo: this.maxCombo,
      activeBuffs: [...this.activeBuffs],
    };
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}
