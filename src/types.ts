export type BrickType = 'normal' | 'armored' | 'gold' | 'explosive' | 'moving';

export type PowerUpType =
  | 'multi_ball'
  | 'fire_ball'
  | 'laser'
  | 'shield'
  | 'magnet_paddle'
  | 'slow_motion';

export interface Brick {
  id: string;
  type: BrickType;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  color: string;
  borderColor: string;
  hits: number;
  maxHits: number;
  powerUp?: PowerUpType;
  points: number;
  hitFlash?: number; // 0 to 1 white flash when hit
  cracks?: { x1: number; y1: number; x2: number; y2: number }[];
  vx?: number;
  minX?: number;
  maxX?: number;
  animPhase?: number;
}

export interface BallTrailNode {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color?: string;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  speed: number;
  color: string;
  trail?: BallTrailNode[];
  impactFlash?: number; // 0 to 1 timer for white-hot hit flash
  isFireball?: boolean;
  stuckToPaddle?: boolean;
  stuckOffsetX?: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  prevX?: number;
  velocity?: number;
  squashFactor?: number; // 0 (normal) to 1 (max squashed)
  hasLaser?: boolean;
  hasMagnet?: boolean;
}

export interface LaserBolt {
  id: string;
  x: number;
  y: number;
  dy: number;
  width: number;
  height: number;
  color: string;
}

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  type: PowerUpType;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  alpha: number;
  radius: number;
  life: number;
  type?: 'spark' | 'shard' | 'smoke';
  width?: number;
  height?: number;
  rotation?: number;
  vRot?: number;
  gravity?: number;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface ImpactFlash {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  dy: number;
  scale?: number;
  isCombo?: boolean;
  fontSize?: number;
}

export type GameStatus =
  | 'idle'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'level_cleared'
  | 'game_won';

export interface ActiveBuff {
  id: string;
  type: PowerUpType;
  label: string;
  duration: number;
  maxDuration: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  date: string;
  isPlayer?: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  musicEnabled: boolean;
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  bricksBroken: number;
  totalBricksInLevel: number;
  remainingBricks: number;
  combo: number;
  maxCombo: number;
  activeBuffs: ActiveBuff[];
}
