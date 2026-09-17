import { PowerUpType, PowerUpItem, LaserBolt, Paddle } from '../types';

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  duration: number; // 0 for instant
  symbol: string;
}

export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  multi_ball: {
    type: 'multi_ball',
    name: 'Multi Ball',
    description: 'Triples active balls on screen',
    color: '#38bdf8', // sky blue
    badgeBg: 'bg-sky-500/20',
    borderColor: 'border-sky-400/50',
    textColor: 'text-sky-300',
    duration: 0, // Instant trigger
    symbol: '●●',
  },
  fire_ball: {
    type: 'fire_ball',
    name: 'Fire Ball',
    description: 'Blazing comet punches straight through bricks',
    color: '#f97316', // bright orange
    badgeBg: 'bg-orange-500/20',
    borderColor: 'border-orange-400/50',
    textColor: 'text-orange-300',
    duration: 10,
    symbol: '🔥',
  },
  laser: {
    type: 'laser',
    name: 'Laser Blaster',
    description: 'Equip paddle with twin laser cannons',
    color: '#ef4444', // hot red
    badgeBg: 'bg-red-500/20',
    borderColor: 'border-red-400/50',
    textColor: 'text-red-300',
    duration: 12,
    symbol: '⚡',
  },
  shield: {
    type: 'shield',
    name: 'Energy Shield',
    description: 'Bottom safety barrier bounces falling balls',
    color: '#10b981', // emerald
    badgeBg: 'bg-emerald-500/20',
    borderColor: 'border-emerald-400/50',
    textColor: 'text-emerald-300',
    duration: 16,
    symbol: '🛡️',
  },
  magnet_paddle: {
    type: 'magnet_paddle',
    name: 'Magnet Paddle',
    description: 'Catch ball on paddle to aim and launch',
    color: '#a855f7', // purple
    badgeBg: 'bg-purple-500/20',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-300',
    duration: 14,
    symbol: '🧲',
  },
  slow_motion: {
    type: 'slow_motion',
    name: 'Slow Motion',
    description: 'Bullet-time allows precision maneuvers',
    color: '#06b6d4', // cyan
    badgeBg: 'bg-cyan-500/20',
    borderColor: 'border-cyan-400/50',
    textColor: 'text-cyan-300',
    duration: 10,
    symbol: '⏳',
  },
};

export const POWER_UP_WIDTH = 26;
export const POWER_UP_HEIGHT = 16;
export const FALL_SPEED = 1.9;

export function createPowerUpItem(type: PowerUpType, x: number, y: number): PowerUpItem {
  return {
    id: `pw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    x: x - POWER_UP_WIDTH / 2,
    y,
    width: POWER_UP_WIDTH,
    height: POWER_UP_HEIGHT,
    dy: FALL_SPEED,
    type,
  };
}

export function updatePowerUpItems(items: PowerUpItem[], deltaTime: number): void {
  const timeScale = deltaTime * 60;
  for (const item of items) {
    item.y += item.dy * timeScale;
  }
}

/**
 * Render falling power-up pill capsule with glowing aura and distinctive icon
 */
export function renderPowerUpItem(
  ctx: CanvasRenderingContext2D,
  item: PowerUpItem,
  time: number
): void {
  const config = POWER_UP_CONFIGS[item.type];
  const { x, y, width, height } = item;

  // Gentle float bobbing / pulse
  const pulse = Math.sin(time * 5 + item.x) * 0.15 + 0.85;

  ctx.save();

  // 1. Outer Glow
  ctx.save();
  const aura = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    2,
    x + width / 2,
    y + height / 2,
    width * 0.9
  );
  aura.addColorStop(0, config.color);
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.45 * pulse;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height / 2, width * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Pill Capsule Body
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();

  // Colored accent gradient fill
  const bodyGrad = ctx.createLinearGradient(x, y, x + width, y + height);
  bodyGrad.addColorStop(0, config.color);
  bodyGrad.addColorStop(1, '#0f172a');
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(x + 1.5, y + 1.5, width - 3, height - 3, 7);
  ctx.fill();

  // 3. Crisp Border
  ctx.globalAlpha = 1;
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.stroke();

  // 4. Center Symbol
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.symbol, x + width / 2, y + height / 2);

  ctx.restore();
}

/**
 * Creates twin laser bolts fired from left and right blasters of paddle
 */
export function createLaserBolts(
  paddleX: number,
  paddleY: number,
  paddleWidth: number
): LaserBolt[] {
  const leftX = paddleX + 4;
  const rightX = paddleX + paddleWidth - 7;
  const boltY = paddleY - 8;

  return [
    {
      id: `laser-${Date.now()}-1`,
      x: leftX,
      y: boltY,
      dy: -8.5,
      width: 3,
      height: 12,
      color: '#ef4444',
    },
    {
      id: `laser-${Date.now()}-2`,
      x: rightX,
      y: boltY,
      dy: -8.5,
      width: 3,
      height: 12,
      color: '#ef4444',
    },
  ];
}

export function updateLaserBolts(lasers: LaserBolt[], deltaTime: number): void {
  const timeScale = deltaTime * 60;
  for (const bolt of lasers) {
    bolt.y += bolt.dy * timeScale;
  }
}

export function renderLaserBolts(
  ctx: CanvasRenderingContext2D,
  lasers: LaserBolt[]
): void {
  for (const bolt of lasers) {
    ctx.save();
    // Glowing core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bolt.x + 0.5, bolt.y, bolt.width - 1, bolt.height);

    // Laser glow aura
    ctx.strokeStyle = bolt.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = bolt.color;
    ctx.shadowBlur = 8;
    ctx.strokeRect(bolt.x, bolt.y, bolt.width, bolt.height);
    ctx.restore();
  }
}

/**
 * Render bottom safety shield barrier line
 */
export function renderBottomShield(
  ctx: CanvasRenderingContext2D,
  shieldY: number,
  canvasWidth: number,
  time: number
): void {
  ctx.save();
  const pulse = Math.sin(time * 6) * 0.2 + 0.8;

  // Energy field glow
  ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 * pulse})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, shieldY);
  ctx.lineTo(canvasWidth, shieldY);
  ctx.stroke();

  // Core bright beam
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.lineDashOffset = -time * 20;
  ctx.beginPath();
  ctx.moveTo(0, shieldY);
  ctx.lineTo(canvasWidth, shieldY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

/**
 * Render paddle enhancements when Laser or Magnet power-up is active
 */
export function renderPaddleAttachments(
  ctx: CanvasRenderingContext2D,
  paddle: Paddle,
  time: number
): void {
  const { x, y, width, height, hasLaser, hasMagnet } = paddle;

  if (hasLaser) {
    // Twin laser blaster pods on left and right sides
    ctx.save();
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1;

    // Left cannon
    ctx.fillRect(x - 3, y - 4, 4, 10);
    ctx.strokeRect(x - 3, y - 4, 4, 10);
    // Left muzzle flash / tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 6, 2, 2);

    // Right cannon
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + width - 1, y - 4, 4, 10);
    ctx.strokeRect(x + width - 1, y - 4, 4, 10);
    // Right muzzle flash / tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + width, y - 6, 2, 2);

    ctx.restore();
  }

  if (hasMagnet) {
    // Magnetic electro-field pulsing above paddle
    ctx.save();
    const pulse = Math.sin(time * 8) * 0.25 + 0.75;
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.6 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = time * 15;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 2, width * 0.45, Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
