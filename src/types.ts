export type PowerUpType = 'extra_life' | 'double_ball' | 'bonus_points' | 'expand_paddle' | 'slow_ball';

export interface Brick {
  id: string;
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
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
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
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  dy: number;
}

export type GameStatus =
  | 'idle'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'level_cleared'
  | 'game_won';

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  bricksBroken: number;
}
