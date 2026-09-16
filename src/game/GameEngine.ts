import { Brick, Ball, Paddle, PowerUpItem, Particle, FloatingText, GameStats, GameStatus, PowerUpType } from '../types';
import { sounds } from '../sound';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

const ROW_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export class GameEngine {
  public paddle: Paddle;
  public balls: Ball[] = [];
  public bricks: Brick[] = [];
  public powerUps: PowerUpItem[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public score: number = 0;
  public highScore: number = 0;
  public lives: number = 3;
  public level: number = 1;
  public bricksBroken: number = 0;

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
    sounds.playCountdown(false);
    this.notify();

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = window.setInterval(() => {
      this.countdown--;
      if (this.countdown > 0) {
        sounds.playCountdown(false);
        this.notify();
      } else {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        sounds.playCountdown(true);
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
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.bricksBroken = 0;
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.paddle.width = 60;
    this.paddle.x = 250;
    this.resetBalls();
    this.createBricksForLevel(this.level);
    this.status = 'idle';
    this.notify();
    this.startCountdown();
  }

  public createBricksForLevel(lvl: number) {
    this.bricks = [];
    // Original Java formula: numRows = 3 + level, numCols = 5 + level
    // Clamped so it fits neatly on the 600-wide canvas
    const numCols = Math.min(5 + (lvl - 1), 9);
    const numRows = Math.min(3 + (lvl - 1), 6);

    const brickWidth = 50;
    const brickHeight = 15;
    const colSpacing = 60;
    const rowSpacing = 22;

    const totalGridWidth = numCols * colSpacing - (colSpacing - brickWidth);
    const startX = Math.round((CANVAS_WIDTH - totalGridWidth) / 2);
    const startY = 40;

    let idCount = 0;
    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numRows; j++) {
        idCount++;
        const x = startX + i * colSpacing;
        const y = startY + j * rowSpacing;

        // Occasional power-up (15% chance)
        let powerUp: PowerUpType | undefined = undefined;
        const rand = Math.random();
        if (rand < 0.05) {
          powerUp = 'extra_life';
        } else if (rand < 0.10) {
          powerUp = 'double_ball';
        } else if (rand < 0.15) {
          powerUp = 'bonus_points';
        } else if (rand < 0.18) {
          powerUp = 'expand_paddle';
        }

        const color = ROW_COLORS[j % ROW_COLORS.length];

        this.bricks.push({
          id: `brick-${lvl}-${idCount}`,
          x,
          y,
          width: brickWidth,
          height: brickHeight,
          visible: true,
          color,
          borderColor: '#1e293b',
          hits: 0,
          maxHits: 1,
          points: 5, // 5 points per brick as in original Java GameEngine.java
          powerUp,
        });
      }
    }
  }

  public movePaddleTo(mouseX: number) {
    this.paddle.x = mouseX - this.paddle.width / 2;
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x > CANVAS_WIDTH - this.paddle.width) {
      this.paddle.x = CANVAS_WIDTH - this.paddle.width;
    }
  }

  public movePaddleBy(deltaX: number) {
    this.paddle.x += deltaX;
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x > CANVAS_WIDTH - this.paddle.width) {
      this.paddle.x = CANVAS_WIDTH - this.paddle.width;
    }
  }

  public update() {
    if (this.status !== 'playing') return;

    // 1. Update power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += p.dy;

      // Check collision with paddle
      if (
        p.y + p.height >= this.paddle.y &&
        p.y <= this.paddle.y + this.paddle.height &&
        p.x + p.width >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width
      ) {
        this.applyPowerUp(p.type, p.x, p.y);
        this.powerUps.splice(i, 1);
        sounds.playPowerUp();
        continue;
      }

      // Check fallen off screen
      if (p.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
      }
    }

    // 2. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.dx;
      pt.y += pt.dy;
      pt.life -= 0.02;
      pt.alpha = Math.max(0, pt.life);
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.dy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 4. Update balls & collisions
    for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
      const ball = this.balls[bIndex];
      ball.x += ball.dx;
      ball.y += ball.dy;

      const diameter = ball.radius * 2;

      // Wall collisions
      if (ball.x <= 0) {
        ball.x = 0;
        ball.dx = Math.abs(ball.dx);
        sounds.playWallBounce();
        this.spawnWallSparks(0, ball.y + ball.radius);
      } else if (ball.x + diameter >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - diameter;
        ball.dx = -Math.abs(ball.dx);
        sounds.playWallBounce();
        this.spawnWallSparks(CANVAS_WIDTH, ball.y + ball.radius);
      }

      if (ball.y <= 0) {
        ball.y = 0;
        ball.dy = Math.abs(ball.dy);
        sounds.playWallBounce();
        this.spawnWallSparks(ball.x + ball.radius, 0);
      }

      // Paddle collision
      if (
        ball.y + diameter >= this.paddle.y &&
        ball.y <= this.paddle.y + this.paddle.height &&
        ball.x + diameter >= this.paddle.x &&
        ball.x <= this.paddle.x + this.paddle.width &&
        ball.dy > 0
      ) {
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

        sounds.playPaddleHit();
        this.spawnPaddleParticles(ballCenter, this.paddle.y);
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
          // Determine collision face
          const prevBallX = ball.x - ball.dx;
          const prevBallY = ball.y - ball.dy;

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

          // Hit brick
          brick.visible = false;
          this.bricksBroken++;
          this.addScore(brick.points);

          // Speed increase as in original Java: increaseSpeed()
          const speedBoost = 1.02;
          const currentSpeed = Math.hypot(ball.dx, ball.dy);
          if (currentSpeed < 8.5) {
            ball.dx *= speedBoost;
            ball.dy *= speedBoost;
          }

          sounds.playBrickHit(1 + (this.bricksBroken % 10) * 0.05);
          this.spawnBrickExplosion(brick);

          // Spawn power-up if attached
          if (brick.powerUp) {
            this.powerUps.push({
              id: `pw-${Date.now()}-${Math.random()}`,
              x: brick.x + brick.width / 2 - 10,
              y: brick.y + brick.height,
              width: 20,
              height: 20,
              dy: 2,
              type: brick.powerUp,
            });
          }

          // Floating text for score
          this.floatingTexts.push({
            id: `ft-${Date.now()}-${Math.random()}`,
            x: brick.x + brick.width / 2,
            y: brick.y,
            text: `+${brick.points}`,
            color: '#fde047',
            alpha: 1,
            dy: -0.8,
          });

          // Check if all bricks cleared
          this.checkLevelClear();
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

  private applyPowerUp(type: PowerUpType, x: number, y: number) {
    let text = '';
    switch (type) {
      case 'extra_life':
        this.lives++;
        text = '+1 LIFE!';
        break;
      case 'double_ball':
        if (this.balls.length > 0) {
          const primary = this.balls[0];
          this.balls.push({
            id: `ball-${Date.now()}`,
            x: primary.x,
            y: primary.y,
            dx: -primary.dx,
            dy: primary.dy,
            radius: primary.radius,
            speed: primary.speed,
            color: '#38bdf8',
          });
        }
        text = 'MULTI-BALL!';
        break;
      case 'bonus_points':
        this.addScore(25);
        text = '+25 PTS!';
        break;
      case 'expand_paddle':
        this.paddle.width = Math.min(110, this.paddle.width + 25);
        text = 'WIDE PADDLE!';
        setTimeout(() => {
          this.paddle.width = 60;
        }, 8000);
        break;
      case 'slow_ball':
        for (const b of this.balls) {
          b.dx *= 0.8;
          b.dy *= 0.8;
        }
        text = 'SLOW MOTION!';
        break;
    }

    this.floatingTexts.push({
      id: `ft-pw-${Date.now()}`,
      x,
      y,
      text,
      color: '#38bdf8',
      alpha: 1,
      dy: -1,
    });
  }

  private checkLevelClear() {
    const remaining = this.bricks.filter((b) => b.visible).length;
    if (remaining === 0) {
      sounds.playLevelClear();
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
    sounds.playLifeLost();

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
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5);
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: brick.color,
        alpha: 1,
        radius: 2 + Math.random() * 2,
        life: 1,
      });
    }
  }

  private spawnPaddleParticles(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        dx: (Math.random() - 0.5) * 2,
        dy: -Math.random() * 2,
        color: '#60a5fa',
        alpha: 0.8,
        radius: 2,
        life: 0.6,
      });
    }
  }

  private spawnWallSparks(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        color: '#e2e8f0',
        alpha: 0.7,
        radius: 1.5,
        life: 0.4,
      });
    }
  }

  public getStats(): GameStats {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: this.lives,
      level: this.level,
      bricksBroken: this.bricksBroken,
    };
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}
