import { GameDifficulty, DifficultyConfig } from './types';

export const DIFFICULTY_PRESETS: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    startingLives: 5,
    paddleWidthMultiplier: 1.25, // 75px paddle
    ballSpeedMultiplier: 0.85,  // gentler ball speed
    pointsMultiplier: 0.8,
  },
  normal: {
    startingLives: 3,
    paddleWidthMultiplier: 1.0,  // 60px paddle
    ballSpeedMultiplier: 1.0,
    pointsMultiplier: 1.0,
  },
  hard: {
    startingLives: 2,
    paddleWidthMultiplier: 0.85, // 51px paddle
    ballSpeedMultiplier: 1.18,  // brisk ball speed
    pointsMultiplier: 1.25,
  },
  extreme: {
    startingLives: 1,
    paddleWidthMultiplier: 0.75, // 45px narrow paddle
    ballSpeedMultiplier: 1.32,  // lightning reflex challenge
    pointsMultiplier: 1.6,
  },
};

export function resolveDifficultyConfig(
  difficulty: GameDifficulty = 'normal',
  customSettings?: Partial<DifficultyConfig>
): DifficultyConfig {
  const base = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.normal;
  if (!customSettings) return base;

  return {
    startingLives: customSettings.startingLives ?? base.startingLives,
    paddleWidthMultiplier: customSettings.paddleWidthMultiplier ?? base.paddleWidthMultiplier,
    ballSpeedMultiplier: customSettings.ballSpeedMultiplier ?? base.ballSpeedMultiplier,
    pointsMultiplier: customSettings.pointsMultiplier ?? base.pointsMultiplier,
  };
}
