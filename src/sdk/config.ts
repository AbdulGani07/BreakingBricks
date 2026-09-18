import { GlobalBreakingBricksConfig, SaveScoreCallback, ScoreAdapter } from './types';

/**
 * Global singleton configuration registry for Breaking Bricks SDK.
 * Enables developer setup via:
 * BreakingBricks.configure({
 *   saveScore: (data) => {
 *     fetch("their-api", { method: "POST", body: JSON.stringify(data) });
 *   }
 * });
 */
const globalConfig: GlobalBreakingBricksConfig = {};

/**
 * Configures global settings and optional callbacks across all game instances.
 */
export function configure(options: GlobalBreakingBricksConfig): void {
  if (options && typeof options === 'object') {
    Object.assign(globalConfig, options);
  }
}

/**
 * Returns the active global configuration.
 */
export function getGlobalConfig(): GlobalBreakingBricksConfig {
  return { ...globalConfig };
}

/**
 * Retrieves the global saveScore callback if registered.
 */
export function getGlobalSaveScore(): SaveScoreCallback | undefined {
  return globalConfig.saveScore;
}

/**
 * Retrieves the global ScoreAdapter if configured.
 */
export function getGlobalScoreAdapter(): ScoreAdapter | undefined {
  return globalConfig.scoreAdapter;
}

/**
 * Clears global configuration (useful for test resets).
 */
export function resetGlobalConfig(): void {
  for (const key of Object.keys(globalConfig)) {
    delete (globalConfig as any)[key];
  }
}
