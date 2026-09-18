import {
  ScoreAdapter,
  ValidatedScorePayload,
  ScoreSessionMetadata,
  ScoreValidationResult,
  ScoreSaveData,
  SaveScoreCallback,
} from '../types';
import { getGlobalSaveScore } from '../config';

/**
 * Generate a unique session identifier
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  const part1 = Math.random().toString(36).substring(2, 10);
  const part2 = Date.now().toString(36);
  return `bb_${part1}_${part2}`;
}

/**
 * Deterministic hash generator for score validation tokens.
 * Combines score parameters and a client-side verification secret.
 */
export function generateValidationHash(
  sessionId: string,
  score: number,
  level: number,
  bricksBroken: number,
  timestamp: number,
  replaySeed: number,
  salt: string = 'bb_arcade_sec_v1'
): string {
  const payloadStr = `${sessionId}:${score}:${level}:${bricksBroken}:${timestamp}:${replaySeed}:${salt}`;
  let hash1 = 0x811c9dc5;
  let hash2 = 0x27d4eb2f;

  for (let i = 0; i < payloadStr.length; i++) {
    const charCode = payloadStr.charCodeAt(i);
    hash1 ^= charCode;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= charCode ^ (i & 0xff);
    hash2 = Math.imul(hash2, 0x5f356495);
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `sig_${hex1}${hex2}`;
}

/**
 * Client-Side and Server-Side validation routine for score submissions.
 * Checks for physical gameplay plausibility and signature integrity.
 */
export function validateScoreSession(
  payload: ValidatedScorePayload,
  verificationSalt: string = 'bb_arcade_sec_v1'
): ScoreValidationResult {
  const reasons: string[] = [];

  // 1. Basic integrity check
  if (payload.score < 0 || isNaN(payload.score)) {
    reasons.push('Score cannot be negative or NaN');
  }

  if (payload.level < 1 || isNaN(payload.level)) {
    reasons.push('Level must be at least 1');
  }

  // 2. Signature verification
  const expectedHash = generateValidationHash(
    payload.sessionId,
    payload.score,
    payload.level,
    payload.metadata.bricksBroken,
    payload.timestamp,
    payload.replaySeed,
    verificationSalt
  );

  if (payload.validationHash !== expectedHash) {
    reasons.push('Validation signature mismatch - payload tampered');
  }

  // 3. Time elapsed vs. score plausibility
  const duration = payload.metadata.durationSeconds;
  if (payload.score > 0 && duration < 1.0) {
    reasons.push('Unrealistic completion speed (duration too low for non-zero score)');
  }

  // 4. Bricks broken ratio vs. score
  // Minimum points per brick is 10 (with combo multiplier at least 1x).
  // Maximum theoretical multiplier is ~10x with rare powerups.
  if (payload.metadata.bricksBroken > 0) {
    const avgPointsPerBrick = payload.score / payload.metadata.bricksBroken;
    if (avgPointsPerBrick < 5) {
      reasons.push('Score is lower than theoretical minimum per broken brick');
    }
    if (avgPointsPerBrick > 1500) {
      reasons.push('Score exceeds maximum plausible points per brick');
    }
  } else if (payload.score > 0) {
    reasons.push('Score cannot be positive if 0 bricks were broken');
  }

  // 5. Timestamp freshness (within reasonable drift)
  const now = Date.now();
  if (payload.timestamp > now + 60000) {
    reasons.push('Timestamp is in the future');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    payload: {
      ...payload,
      isValid: reasons.length === 0,
    },
  };
}

/**
 * ScoreManager: Sits between GameEngine and ScoreAdapter.
 * Manages active session state, telemetry metrics, and validation signatures.
 */
export class ScoreManager {
  private adapter: ScoreAdapter;
  private customSaveScoreCallback?: SaveScoreCallback;
  private currentSessionId: string;
  private sessionStartTime: number = Date.now();
  private replaySeed: number = Math.floor(Math.random() * 1000000);
  private metadata: ScoreSessionMetadata = {
    durationSeconds: 0,
    bricksBroken: 0,
    maxCombo: 0,
    powerUpsCollected: 0,
    ballsLost: 0,
    levelsCleared: 0,
  };

  constructor(adapter: ScoreAdapter, customSaveScoreCallback?: SaveScoreCallback) {
    this.adapter = adapter;
    this.customSaveScoreCallback = customSaveScoreCallback;
    this.currentSessionId = generateSessionId();
  }

  public getSessionId(): string {
    return this.currentSessionId;
  }

  public getReplaySeed(): number {
    return this.replaySeed;
  }

  public startNewSession(): string {
    this.currentSessionId = generateSessionId();
    this.sessionStartTime = Date.now();
    this.replaySeed = Math.floor(Math.random() * 1000000);
    this.metadata = {
      durationSeconds: 0,
      bricksBroken: 0,
      maxCombo: 0,
      powerUpsCollected: 0,
      ballsLost: 0,
      levelsCleared: 0,
    };
    return this.currentSessionId;
  }

  public recordBrickBroken(combo: number): void {
    this.metadata.bricksBroken++;
    if (combo > this.metadata.maxCombo) {
      this.metadata.maxCombo = combo;
    }
  }

  public recordPowerUp(): void {
    this.metadata.powerUpsCollected++;
  }

  public recordBallLost(): void {
    this.metadata.ballsLost++;
  }

  public recordLevelCleared(): void {
    this.metadata.levelsCleared++;
  }

  public getDurationSeconds(): number {
    return Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 1000));
  }

  /**
   * Generates a tamper-evident validated score payload for the current match.
   */
  public createValidatedPayload(score: number, level: number): ValidatedScorePayload {
    const timestamp = Date.now();
    const durationSeconds = this.getDurationSeconds();
    const metadata: ScoreSessionMetadata = {
      ...this.metadata,
      durationSeconds,
    };

    const validationHash = generateValidationHash(
      this.currentSessionId,
      score,
      level,
      metadata.bricksBroken,
      timestamp,
      this.replaySeed
    );

    const preliminaryPayload: ValidatedScorePayload = {
      score,
      level,
      timestamp,
      sessionId: this.currentSessionId,
      replaySeed: this.replaySeed,
      metadata,
      validationHash,
      isValid: true,
    };

    const validationResult = validateScoreSession(preliminaryPayload);

    return {
      ...preliminaryPayload,
      isValid: validationResult.valid,
    };
  }

  public setSaveScoreCallback(callback?: SaveScoreCallback): void {
    this.customSaveScoreCallback = callback;
  }

  /**
   * Delegates score saving through the validation layer into the configured adapter,
   * updates persistent statistics, and dispatches to any developer-configured saveScore callback.
   */
  public async submitScore(
    score: number,
    level: number,
    additionalStats?: Partial<ScoreSaveData>
  ): Promise<ValidatedScorePayload> {
    const payload = this.createValidatedPayload(score, level);

    if (payload.isValid) {
      // 1. Save high score to adapter
      await Promise.resolve(this.adapter.saveHighScore(score));

      // 2. Save highest level to adapter
      if (this.adapter.saveHighestLevel) {
        await Promise.resolve(this.adapter.saveHighestLevel(level));
      }

      // 3. Save leaderboard entry if adapter supports it
      if (this.adapter.saveScore) {
        await Promise.resolve(
          this.adapter.saveScore({
            name: 'PLAYER',
            score: payload.score,
            level: payload.level,
            date: new Date(payload.timestamp).toISOString().split('T')[0],
          })
        );
      }

      // 4. Resolve saveScore callback (local instance override or global BreakingBricks.configure)
      const callback = this.customSaveScoreCallback || getGlobalSaveScore();
      if (typeof callback === 'function') {
        try {
          const stats = this.adapter.getStats
            ? await Promise.resolve(this.adapter.getStats())
            : {
                highScore: await Promise.resolve(this.adapter.getHighScore()),
                highestLevel: this.adapter.getHighestLevel
                  ? await Promise.resolve(this.adapter.getHighestLevel())
                  : level,
                gamesPlayed: this.adapter.getGamesPlayed
                  ? await Promise.resolve(this.adapter.getGamesPlayed())
                  : 1,
                achievements: this.adapter.getAchievements
                  ? await Promise.resolve(this.adapter.getAchievements())
                  : [],
              };

          const scoreData: ScoreSaveData = {
            score: payload.score,
            level: payload.level,
            highScore: Math.max(stats.highScore, payload.score),
            highestLevel: Math.max(stats.highestLevel, payload.level),
            gamesPlayed: additionalStats?.gamesPlayed ?? stats.gamesPlayed,
            achievements: additionalStats?.achievements ?? stats.achievements,
            bricksBroken: payload.metadata.bricksBroken,
            maxCombo: payload.metadata.maxCombo,
            timestamp: payload.timestamp,
            sessionId: payload.sessionId,
            isHighScore: payload.score >= stats.highScore,
            validationToken: payload.validationHash,
            metadata: payload.metadata,
            ...additionalStats,
          };

          await Promise.resolve(callback(scoreData));
        } catch (callbackErr) {
          // Safeguard: Never crash game runtime if developer's API fetch fails or rejects
          console.warn('[BreakingBricks] Developer saveScore callback encountered an error:', callbackErr);
        }
      }
    } else {
      console.warn('[BreakingBricks:ScoreManager] Score validation failed:', payload);
    }

    return payload;
  }

  public async getHighScore(): Promise<number> {
    return Promise.resolve(this.adapter.getHighScore());
  }

  public setAdapter(adapter: ScoreAdapter): void {
    this.adapter = adapter;
  }
}
