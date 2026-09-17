import { Brick, BrickType, PowerUpType } from '../types';

export const BRICK_WIDTH = 48;
export const BRICK_HEIGHT = 16;
export const BRICK_GAP = 6;
export const CANVAS_WIDTH = 600;

export interface BrickConfig {
  type: BrickType;
  maxHits: number;
  points: number;
  color: string;
  borderColor: string;
}

export const BRICK_CONFIGS: Record<BrickType, BrickConfig> = {
  normal: {
    type: 'normal',
    maxHits: 1,
    points: 10,
    color: '#06b6d4', // cyan
    borderColor: '#22d3ee',
  },
  armored: {
    type: 'armored',
    maxHits: 2,
    points: 25,
    color: '#475569', // metallic slate
    borderColor: '#94a3b8',
  },
  gold: {
    type: 'gold',
    maxHits: 3,
    points: 50,
    color: '#eab308', // metallic gold
    borderColor: '#fde047',
  },
  explosive: {
    type: 'explosive',
    maxHits: 1,
    points: 35,
    color: '#ea580c', // hazard red-orange
    borderColor: '#fb923c',
  },
  moving: {
    type: 'moving',
    maxHits: 1,
    points: 30,
    color: '#8b5cf6', // cyber violet
    borderColor: '#c084fc',
  },
};

// Available power-ups that can drop from bricks
const DROP_TYPES: PowerUpType[] = [
  'multi_ball',
  'fire_ball',
  'laser',
  'shield',
  'magnet_paddle',
  'slow_motion',
];

export function createBrick(
  type: BrickType,
  x: number,
  y: number,
  width: number = BRICK_WIDTH,
  height: number = BRICK_HEIGHT,
  customProps: Partial<Brick> = {}
): Brick {
  const config = BRICK_CONFIGS[type];
  const id = `brick-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const brick: Brick = {
    id,
    type,
    x,
    y,
    width,
    height,
    visible: true,
    color: config.color,
    borderColor: config.borderColor,
    hits: 0,
    maxHits: config.maxHits,
    points: config.points,
    hitFlash: 0,
    cracks: [],
    animPhase: Math.random() * Math.PI * 2,
    ...customProps,
  };

  if (type === 'moving') {
    const range = 40 + Math.random() * 50;
    brick.vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6);
    brick.minX = Math.max(10, x - range);
    brick.maxX = Math.min(CANVAS_WIDTH - width - 10, x + range);
  }

  return brick;
}

/**
 * Update moving bricks and animation phases
 */
export function updateBricks(bricks: Brick[], deltaTime: number): void {
  const timeScale = deltaTime * 60;

  for (const brick of bricks) {
    if (!brick.visible) continue;

    brick.animPhase = ((brick.animPhase || 0) + 0.05 * timeScale) % (Math.PI * 2);

    // Update Moving Brick horizontal patrol
    if (brick.type === 'moving' && brick.vx !== undefined && brick.minX !== undefined && brick.maxX !== undefined) {
      brick.x += brick.vx * timeScale;
      if (brick.x <= brick.minX) {
        brick.x = brick.minX;
        brick.vx = Math.abs(brick.vx);
      } else if (brick.x >= brick.maxX) {
        brick.x = brick.maxX;
        brick.vx = -Math.abs(brick.vx);
      }
    }

    // Decay hit flash
    if (brick.hitFlash && brick.hitFlash > 0) {
      brick.hitFlash = Math.max(0, brick.hitFlash - 7 * deltaTime);
    }
  }
}

/**
 * Render an individual modular brick with its distinct visual style
 */
export function renderBrick(ctx: CanvasRenderingContext2D, brick: Brick, time: number): void {
  if (!brick.visible) return;

  const { x, y, width, height, type } = brick;

  ctx.save();

  // 1. BASE COLOR & SHADOW
  ctx.fillStyle = brick.color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 3);
  ctx.fill();

  // 2. TYPE-SPECIFIC STYLING
  switch (type) {
    case 'armored': {
      // Steel reinforced plate pattern with corner rivets
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(x + 4, y + 3, width - 8, height - 6);

      // 4 corner metallic rivets
      ctx.fillStyle = '#cbd5e1';
      const rivetR = 1.2;
      ctx.beginPath();
      ctx.arc(x + 4, y + 4, rivetR, 0, Math.PI * 2);
      ctx.arc(x + width - 4, y + 4, rivetR, 0, Math.PI * 2);
      ctx.arc(x + 4, y + height - 4, rivetR, 0, Math.PI * 2);
      ctx.arc(x + width - 4, y + height - 4, rivetR, 0, Math.PI * 2);
      ctx.fill();

      // Armor plate center divider
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y + 2);
      ctx.lineTo(x + width / 2, y + height - 2);
      ctx.stroke();
      break;
    }

    case 'gold': {
      // Metallic golden gradient & diagonal sweep sheen
      const sheenOffset = ((time * 0.8) % 3);
      if (sheenOffset < 1.2) {
        const sheenX = x - width + sheenOffset * (width * 2);
        const grad = ctx.createLinearGradient(sheenX, y, sheenX + 24, y + height);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, width, height);
      }

      // Golden diamond emblem in center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y + 3);
      ctx.lineTo(x + width / 2 + 5, y + height / 2);
      ctx.lineTo(x + width / 2, y + height - 3);
      ctx.lineTo(x + width / 2 - 5, y + height / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'explosive': {
      // Pulsing hazard glow & diagonal warning stripes
      const pulse = Math.sin((brick.animPhase || 0) * 3) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(254, 215, 170, ${0.2 * pulse})`;
      ctx.fillRect(x, y, width, height);

      // Warning hazard stripes
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let sx = -height; sx < width + height; sx += 12) {
        ctx.moveTo(x + sx, y + height);
        ctx.lineTo(x + sx + height, y);
      }
      ctx.stroke();

      // Pulsing center explosion spark badge
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 2.8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'moving': {
      // Kinetic lateral thruster chevrons (< >)
      const movingLeft = (brick.vx || 0) < 0;
      ctx.strokeStyle = movingLeft ? '#38bdf8' : '#e879f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const midX = x + width / 2;
      const midY = y + height / 2;
      if (movingLeft) {
        // Left arrow
        ctx.moveTo(midX + 4, midY - 3);
        ctx.lineTo(midX - 3, midY);
        ctx.lineTo(midX + 4, midY + 3);
      } else {
        // Right arrow
        ctx.moveTo(midX - 4, midY - 3);
        ctx.lineTo(midX + 3, midY);
        ctx.lineTo(midX - 4, midY + 3);
      }
      ctx.stroke();
      break;
    }

    default: // normal
      // Classic sleek glossy specular highlight on top bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 2, y + 1, width - 4, 3);
      break;
  }

  // 3. DAMAGE CRACKS (Rendered when hits > 0 on multi-hit bricks)
  if (brick.cracks && brick.cracks.length > 0) {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const crack of brick.cracks) {
      ctx.moveTo(x + crack.x1, y + crack.y1);
      ctx.lineTo(x + crack.x2, y + crack.y2);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const crack of brick.cracks) {
      ctx.moveTo(x + crack.x1 + 0.5, y + crack.y1 + 0.5);
      ctx.lineTo(x + crack.x2 + 0.5, y + crack.y2 + 0.5);
    }
    ctx.stroke();
  }

  // 4. POWER-UP ICON MARKER (Small glowing orb indicating a hidden drop)
  if (brick.powerUp) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + width - 6, y + 6, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. HIT FLASH (White-hot flash on hit)
  if (brick.hitFlash && brick.hitFlash > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = Math.min(1, brick.hitFlash * 0.9);
    ctx.fillRect(x, y, width, height);
  }

  // 6. CRISP BORDER
  ctx.globalAlpha = 1;
  ctx.strokeStyle = brick.borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);

  ctx.restore();
}

/**
 * Handle explosive brick detonation:
 * Destroys adjacent bricks in blast radius and triggers cascading chain-reactions
 */
export function triggerExplosiveBlast(
  explodedBrick: Brick,
  allBricks: Brick[],
  blastRadius: number = 72
): Brick[] {
  const affectedBricks: Brick[] = [];
  const centerX = explodedBrick.x + explodedBrick.width / 2;
  const centerY = explodedBrick.y + explodedBrick.height / 2;

  for (const other of allBricks) {
    if (!other.visible || other.id === explodedBrick.id) continue;

    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const dist = Math.hypot(otherCenterX - centerX, otherCenterY - centerY);

    if (dist <= blastRadius) {
      affectedBricks.push(other);
    }
  }

  return affectedBricks;
}

/**
 * Generate rich modular brick layouts across 10 progressive levels
 */
export function generateModularLevelBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = Math.min(7, 4 + Math.floor((level - 1) / 2));
  const cols = 9;
  const totalGridWidth = cols * BRICK_WIDTH + (cols - 1) * BRICK_GAP;
  const startX = Math.floor((CANVAS_WIDTH - totalGridWidth) / 2);
  const startY = 48;

  // Vibrant base colors for normal rows
  const rowPalette = [
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f43f5e', // rose
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Shape patterns depending on level
      if (level === 2 && (r + c) % 2 === 1 && r > 0) continue; // Checkerboard
      if (level === 3 && (c === 0 || c === cols - 1) && r > 2) continue; // Pyramid taper
      if (level === 5 && r === 2 && (c === 3 || c === 4 || c === 5)) continue; // Center tunnel
      if (level === 7 && (c === 2 || c === 6) && r % 2 === 0) continue; // Castle battlements

      const x = startX + c * (BRICK_WIDTH + BRICK_GAP);
      const y = startY + r * (BRICK_HEIGHT + BRICK_GAP);

      // Determine Brick Type distribution based on level
      let type: BrickType = 'normal';
      const rand = Math.random();

      if (level >= 2 && rand < 0.16) {
        type = 'armored';
      } else if (level >= 3 && rand < 0.28) {
        type = 'explosive';
      } else if (level >= 4 && rand < 0.38) {
        type = 'moving';
      } else if (level >= 5 && rand < 0.50) {
        type = 'gold';
      }

      // Guaranteed thematic highlights per level:
      if (level >= 3 && r === 1 && (c === 2 || c === 6)) {
        type = 'explosive';
      }
      if (level >= 4 && r === 0 && (c === 4)) {
        type = 'moving';
      }
      if (level >= 6 && r === 0) {
        type = (c % 2 === 0) ? 'gold' : 'armored';
      }

      // Assign power-ups (~25% drop rate)
      let powerUp: PowerUpType | undefined = undefined;
      if (Math.random() < 0.26) {
        powerUp = DROP_TYPES[Math.floor(Math.random() * DROP_TYPES.length)];
      }

      const customProps: Partial<Brick> = {
        powerUp,
      };

      if (type === 'normal') {
        const color = rowPalette[r % rowPalette.length];
        customProps.color = color;
        customProps.borderColor = color;
      }

      const brick = createBrick(type, x, y, BRICK_WIDTH, BRICK_HEIGHT, customProps);
      bricks.push(brick);
    }
  }

  return bricks;
}
