import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { EmbeddedGame } from '../components/EmbeddedGame';
import { GameEventEmitter } from './EventEmitter';
import { LocalStorageAdapter, MemoryScoreAdapter } from './ScoreAdapter';
import {
  BreakingBricksConfig,
  BreakingBricksInstance,
  GameDifficulty,
  GameEventMap,
  ScoreAdapter,
  LeaderboardEntry,
  AnalyticsAdapter,
  ScoreSessionMetadata,
  ValidatedScorePayload,
} from './types';
import { THEMES } from './theme';
import { DIFFICULTY_PRESETS } from './difficulty';
import { ScoreManager, validateScoreSession } from './score/ScoreManager';
import {
  LocalAnalyticsAdapter,
  CustomEndpointAnalyticsAdapter,
} from './analytics/AnalyticsAdapter';
import {
  configure,
  getGlobalConfig,
  getGlobalSaveScore,
  getGlobalScoreAdapter,
  resetGlobalConfig,
} from './config';

export * from './types';
export * from './ScoreAdapter';
export * from './EventEmitter';
export * from './difficulty';
export * from './theme';
export * from './score/ScoreManager';
export * from './analytics/AnalyticsAdapter';
export * from './config';

export interface BreakingBricksV1API {
  mount(
    target: string | HTMLElement,
    config?: BreakingBricksConfig
  ): BreakingBricksInstance;
}

export interface BreakingBricksSDK {
  version: string;
  versions: string[];
  v1: BreakingBricksV1API;
  mount(
    target: string | HTMLElement,
    config?: BreakingBricksConfig
  ): BreakingBricksInstance;
  /**
   * Configure global SDK settings and callbacks.
   * Example:
   * BreakingBricks.configure({
   *   saveScore: (data) => {
   *     fetch("their-api", { method: "POST", body: JSON.stringify(data) })
   *   }
   * })
   */
  configure: typeof configure;
  getGlobalConfig: typeof getGlobalConfig;
  resetGlobalConfig: typeof resetGlobalConfig;
  LocalStorageAdapter: typeof LocalStorageAdapter;
  MemoryScoreAdapter: typeof MemoryScoreAdapter;
  ScoreManager: typeof ScoreManager;
  validateScoreSession: typeof validateScoreSession;
  LocalAnalyticsAdapter: typeof LocalAnalyticsAdapter;
  CustomEndpointAnalyticsAdapter: typeof CustomEndpointAnalyticsAdapter;
  THEMES: typeof THEMES;
  DIFFICULTY_PRESETS: typeof DIFFICULTY_PRESETS;
}

/**
 * Ensures embedded game baseline styles are present in the hosting document head.
 */
function ensureHostStyles() {
  if (typeof document === 'undefined') return;
  const styleId = 'breaking-bricks-embedded-styles';
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = `
    #breaking-bricks-embedded-root {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }
    #breaking-bricks-embedded-root *,
    #breaking-bricks-embedded-root *::before,
    #breaking-bricks-embedded-root *::after {
      box-sizing: inherit;
    }
  `;
  document.head.appendChild(styleEl);
}

/**
 * V1 Implementation of BreakingBricks.mount
 */
const mountV1 = (
  target: string | HTMLElement,
  config: BreakingBricksConfig = {}
): BreakingBricksInstance => {
  let container: HTMLElement | null = null;

  if (typeof target === 'string') {
    container = document.querySelector(target);
    if (!container) {
      throw new Error(
        `[BreakingBricks] Target container not found for selector: "${target}"`
      );
    }
  } else if (target instanceof HTMLElement) {
    container = target;
  } else {
    throw new Error(
      '[BreakingBricks] target must be a valid CSS selector string or HTMLElement'
    );
  }

  ensureHostStyles();

  const eventEmitter = new GameEventEmitter();
  let root: Root | null = createRoot(container);
  let internalInstance: BreakingBricksInstance | null = null;

  // Instance proxy returned synchronously to the caller
  const instance: BreakingBricksInstance = {
    unmount: () => {
      if (internalInstance) {
        internalInstance.unmount();
      }
      if (root) {
        root.unmount();
        root = null;
      }
      eventEmitter.removeAllListeners();
    },
    destroy: () => {
      instance.unmount();
    },
    restart: () => {
      if (internalInstance) internalInstance.restart();
    },
    pause: () => {
      if (internalInstance) internalInstance.pause();
    },
    resume: () => {
      if (internalInstance) internalInstance.resume();
    },
    on: <E extends keyof GameEventMap>(event: E, handler: GameEventMap[E]) => {
      return eventEmitter.on(event, handler);
    },
    off: <E extends keyof GameEventMap>(event: E, handler: GameEventMap[E]) => {
      eventEmitter.off(event, handler);
    },
    getScore: () => {
      return internalInstance ? internalInstance.getScore() : 0;
    },
    getHighScore: async () => {
      if (internalInstance) return internalInstance.getHighScore();
      const adapter = config.scoreAdapter || new LocalStorageAdapter();
      return Promise.resolve(adapter.getHighScore());
    },
    setDifficulty: (difficulty: GameDifficulty) => {
      if (internalInstance) internalInstance.setDifficulty(difficulty);
    },
    setSoundVolume: (type, volume) => {
      if (internalInstance) internalInstance.setSoundVolume(type, volume);
    },
    setMuted: (muted) => {
      if (internalInstance) internalInstance.setMuted(muted);
    },
    getStoredStats: async () => {
      if (internalInstance?.getStoredStats) return internalInstance.getStoredStats();
      const adapter = config.scoreAdapter || getGlobalScoreAdapter() || new LocalStorageAdapter();
      if (adapter.getStats) return Promise.resolve(adapter.getStats());
      return {
        highScore: await Promise.resolve(adapter.getHighScore()),
        highestLevel: adapter.getHighestLevel ? await Promise.resolve(adapter.getHighestLevel()) : 1,
        gamesPlayed: adapter.getGamesPlayed ? await Promise.resolve(adapter.getGamesPlayed()) : 0,
        achievements: adapter.getAchievements ? await Promise.resolve(adapter.getAchievements()) : [],
      };
    },
    resetStats: async () => {
      if (internalInstance?.resetStats) return internalInstance.resetStats();
      const adapter = config.scoreAdapter || getGlobalScoreAdapter() || new LocalStorageAdapter();
      if (adapter.resetStats) return Promise.resolve(adapter.resetStats());
    },
  };

  const effectiveConfig: BreakingBricksConfig = {
    scoreAdapter: config.scoreAdapter || getGlobalScoreAdapter(),
    saveScore: config.saveScore || getGlobalSaveScore(),
    ...config,
  };

  // Render into React root
  root.render(
    <EmbeddedGame
      config={effectiveConfig}
      eventEmitter={eventEmitter}
      onInstanceReady={(readyInstance) => {
        internalInstance = readyInstance;
      }}
    />
  );

  return instance;
};

/**
 * Public JavaScript SDK implementation with API versioning support
 */
export const BreakingBricks: BreakingBricksSDK = {
  version: '1.2.0',
  versions: ['v1'],
  v1: {
    mount: mountV1,
  },
  // Default mount delegates to stable v1 API
  mount: mountV1,
  configure,
  getGlobalConfig,
  resetGlobalConfig,
  LocalStorageAdapter,
  MemoryScoreAdapter,
  ScoreManager,
  validateScoreSession,
  LocalAnalyticsAdapter,
  CustomEndpointAnalyticsAdapter,
  THEMES,
  DIFFICULTY_PRESETS,
};

// Expose globally for <script src="..."> usage
if (typeof window !== 'undefined') {
  (window as any).BreakingBricks = BreakingBricks;
}

export default BreakingBricks;
