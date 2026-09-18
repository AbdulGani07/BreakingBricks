export type GameTheme = 'cyber' | 'synthwave' | 'retro' | 'neon' | 'matrix' | 'minimal';
export type ThemeId = GameTheme;

export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

export interface StoredGameStats {
  highScore: number;
  highestLevel: number;
  gamesPlayed: number;
  achievements: string[];
  lastPlayed?: string;
}

export interface ScoreSaveData {
  score: number;
  level: number;
  highScore: number;
  highestLevel: number;
  gamesPlayed: number;
  achievements: string[];
  bricksBroken: number;
  maxCombo: number;
  timestamp: number;
  sessionId: string;
  isHighScore: boolean;
  validationToken?: string;
  metadata?: ScoreSessionMetadata;
}

export type SaveScoreCallback = (data: ScoreSaveData) => Promise<void | any> | void | any;

export interface GlobalBreakingBricksConfig {
  saveScore?: SaveScoreCallback;
  scoreAdapter?: ScoreAdapter;
  storagePrefix?: string;
}

export interface ScoreAdapter {
  /**
   * Retrieves the current saved high score.
   * Can be synchronous or asynchronous (Promise).
   */
  getHighScore(): Promise<number> | number;

  /**
   * Persists a new high score.
   * Can be synchronous or asynchronous (Promise).
   */
  saveHighScore(score: number): Promise<void> | void;

  /**
   * Optional: Retrieves the top leaderboard entries.
   */
  getLeaderboard?(): Promise<LeaderboardEntry[]> | LeaderboardEntry[];

  /**
   * Optional: Submits a new score to the leaderboard.
   */
  saveScore?(entry: LeaderboardEntry): Promise<void> | void;

  /**
   * Retrieves all unlocked achievement IDs persisted across sessions.
   */
  getAchievements?(): Promise<string[]> | string[];

  /**
   * Persists unlocked achievement IDs.
   */
  saveAchievements?(achievements: string[]): Promise<void> | void;

  /**
   * Retrieves total matches/games played across sessions.
   */
  getGamesPlayed?(): Promise<number> | number;

  /**
   * Increments and returns games played.
   */
  recordGamePlayed?(): Promise<number> | number;

  /**
   * Retrieves the highest level reached across sessions.
   */
  getHighestLevel?(): Promise<number> | number;

  /**
   * Persists the highest level reached.
   */
  saveHighestLevel?(level: number): Promise<void> | void;

  /**
   * Retrieves a snapshot of all stored player statistics.
   */
  getStats?(): Promise<StoredGameStats> | StoredGameStats;

  /**
   * Updates multiple stored statistics.
   */
  saveStats?(stats: Partial<StoredGameStats>): Promise<void> | void;

  /**
   * Resets stored statistics back to factory defaults.
   */
  resetStats?(): Promise<void> | void;
}

export interface DifficultyConfig {
  startingLives: number;
  paddleWidthMultiplier: number;
  ballSpeedMultiplier: number;
  pointsMultiplier: number;
}

// ---------------------------------------------------------------------------
// Event API Payloads
// ---------------------------------------------------------------------------

export interface GameStartedPayload {
  level: number;
  lives: number;
  difficulty: GameDifficulty;
  sessionId: string;
  timestamp: number;
}

export interface ScoreUpdatedPayload {
  score: number;
  combo: number;
  added: number;
  sessionId: string;
}

export interface BrickDestroyedPayload {
  brickType: string;
  score: number;
  combo: number;
  position: { x: number; y: number };
}

export interface LevelCompletedPayload {
  level: number;
  score: number;
  perfect: boolean; // Cleared without losing a ball
  sessionId: string;
}

export interface GameOverPayload {
  score: number;
  level: number;
  isHighScore: boolean;
  bricksBroken: number;
  sessionId: string;
  validationToken?: string;
}

export interface AchievementUnlockedPayload {
  id: string;
  title: string;
  description: string;
}

export interface SessionStartedPayload {
  sessionId: string;
  timestamp: number;
  difficulty: GameDifficulty;
}

export interface SessionEndedPayload {
  sessionId: string;
  durationSeconds: number;
  finalScore: number;
  levelReached: number;
  bricksBroken: number;
}

export interface PlayTimeUpdatedPayload {
  sessionId: string;
  activePlayTimeSeconds: number;
}

export interface PowerUpUsedPayload {
  type: string;
  duration?: number;
  position?: { x: number; y: number };
}

export interface PlayerDiedPayload {
  remainingLives: number;
  level: number;
  score: number;
}

export interface PerfectLevelCompletedPayload {
  level: number;
  score: number;
}

export interface GameEventMap {
  gameStarted: (payload: GameStartedPayload) => void;
  scoreUpdated: (payload: ScoreUpdatedPayload) => void;
  brickDestroyed: (payload: BrickDestroyedPayload) => void;
  levelCompleted: (payload: LevelCompletedPayload) => void;
  gameOver: (payload: GameOverPayload) => void;
  achievementUnlocked: (payload: AchievementUnlockedPayload) => void;
  // Extended Analytics Events
  sessionStarted: (payload: SessionStartedPayload) => void;
  sessionEnded: (payload: SessionEndedPayload) => void;
  playTimeUpdated: (payload: PlayTimeUpdatedPayload) => void;
  powerUpUsed: (payload: PowerUpUsedPayload) => void;
  playerDied: (payload: PlayerDiedPayload) => void;
  perfectLevelCompleted: (payload: PerfectLevelCompletedPayload) => void;
}

// ---------------------------------------------------------------------------
// Secure Score Validation Types
// ---------------------------------------------------------------------------

export interface ScoreSessionMetadata {
  durationSeconds: number;
  bricksBroken: number;
  maxCombo: number;
  powerUpsCollected: number;
  ballsLost: number;
  levelsCleared: number;
}

export interface ValidatedScorePayload {
  score: number;
  level: number;
  timestamp: number;
  sessionId: string;
  replaySeed: number;
  metadata: ScoreSessionMetadata;
  validationHash: string;
  isValid: boolean;
}

export interface ScoreValidationResult {
  valid: boolean;
  reasons: string[];
  payload: ValidatedScorePayload;
}

// ---------------------------------------------------------------------------
// Analytics Architecture Types
// ---------------------------------------------------------------------------

export interface AnalyticsEvent {
  eventName: string;
  timestamp: number;
  sessionId: string;
  data: Record<string, any>;
}

export interface AnalyticsAdapter {
  trackEvent(eventName: string, data: Record<string, any>, sessionId?: string): void | Promise<void>;
  getSessionEvents?(sessionId?: string): AnalyticsEvent[] | Promise<AnalyticsEvent[]>;
}

// ---------------------------------------------------------------------------
// SDK Configuration Interface
// ---------------------------------------------------------------------------

export interface BreakingBricksConfig {
  /**
   * Container width. Can be a number (pixels, e.g. 600) or CSS string (e.g. "100%").
   * Default: "100%"
   */
  width?: number | string;

  /**
   * Container height or max-width.
   */
  height?: number | string;

  /**
   * Maximum width of the game frame. Default: 600
   */
  maxContainerWidth?: number | string;

  /**
   * Whether to scale responsively according to container size. Default: true
   */
  responsive?: boolean;

  /**
   * Visual theme archetype.
   * Options: 'cyber' (default) | 'synthwave' | 'retro' | 'neon' | 'matrix' | 'minimal'
   */
  theme?: GameTheme;

  /**
   * Custom color overrides for the arcade frame and accents.
   */
  customTheme?: {
    background?: string;
    surface?: string;
    accent?: string;
    primary?: string;
    text?: string;
  };

  /**
   * Controls configuration.
   */
  controls?: {
    touch?: boolean; // Enable touch/swipe steering (default: true)
    keyboard?: boolean; // Enable arrow keys & A/D (default: true)
    mouse?: boolean; // Enable mouse pointer tracking (default: true)
    showGuide?: boolean; // Display on-screen controls hint bar (default: true)
    autofocus?: boolean; // Automatically focus canvas on mount (default: false)
  };

  /**
   * Sound & Audio configuration.
   */
  sound?: {
    enabled?: boolean; // Master audio enabled (default: true)
    sfxVolume?: number; // SFX volume 0.0 - 1.0 (default: 0.7)
    musicVolume?: number; // Synth music volume 0.0 - 1.0 (default: 0.35)
    muted?: boolean; // Start in muted state (default: false)
  };

  /**
   * Game difficulty preset.
   * Options: 'easy' | 'normal' (default) | 'hard' | 'extreme'
   */
  difficulty?: GameDifficulty;

  /**
   * Fine-grained difficulty multiplier overrides.
   */
  difficultySettings?: Partial<DifficultyConfig>;

  /**
   * Custom score persistence adapter.
   * Default: new LocalStorageAdapter()
   */
  scoreAdapter?: ScoreAdapter;

  /**
   * Custom analytics adapter for privacy-conscious telemetry.
   * Default: new LocalAnalyticsAdapter()
   */
  analyticsAdapter?: AnalyticsAdapter;

  /**
   * Whether to auto-start the countdown immediately on mount.
   * Default: false (shows arcade main menu)
   */
  autoStart?: boolean;

  /**
   * Custom score saving callback for advanced developers.
   * Invoked on match completion and score events with full gameplay statistics.
   *
   * Example:
   * BreakingBricks.configure({
   *   saveScore: (data) => {
   *     fetch("their-api", { method: "POST", body: JSON.stringify(data) })
   *   }
   * })
   */
  saveScore?: SaveScoreCallback;

  // Convenience Event Callbacks
  onGameStarted?: (payload: GameStartedPayload) => void;
  onScoreUpdated?: (payload: ScoreUpdatedPayload) => void;
  onBrickDestroyed?: (payload: BrickDestroyedPayload) => void;
  onLevelCompleted?: (payload: LevelCompletedPayload) => void;
  onGameOver?: (payload: GameOverPayload) => void;
  onAchievementUnlocked?: (payload: AchievementUnlockedPayload) => void;
  onSessionStarted?: (payload: SessionStartedPayload) => void;
  onSessionEnded?: (payload: SessionEndedPayload) => void;
  onPlayTimeUpdated?: (payload: PlayTimeUpdatedPayload) => void;
  onPowerUpUsed?: (payload: PowerUpUsedPayload) => void;
  onPlayerDied?: (payload: PlayerDiedPayload) => void;
  onPerfectLevelCompleted?: (payload: PerfectLevelCompletedPayload) => void;
}

// ---------------------------------------------------------------------------
// Mounted SDK Instance Interface
// ---------------------------------------------------------------------------

export interface BreakingBricksInstance {
  /**
   * Unmount the game instance and cleanup all event listeners, loops, and audio.
   */
  unmount(): void;

  /**
   * Alias for unmount().
   */
  destroy(): void;

  /**
   * Restart the match from level 1.
   */
  restart(): void;

  /**
   * Pause the active match.
   */
  pause(): void;

  /**
   * Resume the paused match.
   */
  resume(): void;

  /**
   * Subscribe to game events.
   * Returns an unsubscribe function.
   */
  on<E extends keyof GameEventMap>(event: E, handler: GameEventMap[E]): () => void;

  /**
   * Unsubscribe from game events.
   */
  off<E extends keyof GameEventMap>(event: E, handler: GameEventMap[E]): void;

  /**
   * Get the player's current active game score.
   */
  getScore(): number;

  /**
   * Get the current stored high score (via the configured ScoreAdapter).
   */
  getHighScore(): Promise<number>;

  /**
   * Update difficulty level dynamically.
   */
  setDifficulty(difficulty: GameDifficulty): void;

  /**
   * Update sound volumes dynamically.
   */
  setSoundVolume(type: 'master' | 'sfx' | 'music', volume: number): void;

  /**
   * Mute or unmute all sound.
   */
  setMuted(muted: boolean): void;

  /**
   * Retrieves full stored statistics (high score, achievements, games played, highest level).
   */
  getStoredStats?(): Promise<StoredGameStats>;

  /**
   * Resets stored statistics back to initial defaults.
   */
  resetStats?(): Promise<void>;
}
