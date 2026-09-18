import { ScoreAdapter, LeaderboardEntry, StoredGameStats } from './types';

/**
 * Default LocalStorage implementation of ScoreAdapter.
 * Specially optimized for serverless Vercel deployments:
 * - Stores high score, unlocked achievements, games played, and highest level between sessions
 * - Safe client-side persistence using namespaced localStorage keys
 * - Graceful in-memory fallback for sandboxed iframes, private browsing, or storage quota blocks
 * - Backward compatible with existing score entries
 */
export class LocalStorageAdapter implements ScoreAdapter {
  private prefix: string;
  private memoryFallback: Map<string, string> = new Map();
  private isStorageAvailable: boolean;

  constructor(options?: { prefix?: string } | string) {
    if (typeof options === 'string') {
      this.prefix = options.endsWith('_') ? options : `${options}_`;
    } else {
      this.prefix = options?.prefix || 'breaking_bricks_';
    }
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  private checkStorageAvailability(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const testKey = `__bb_test_${Date.now()}`;
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getItem(key: string): string | null {
    const fullKey = `${this.prefix}${key}`;
    if (this.isStorageAvailable) {
      try {
        return window.localStorage.getItem(fullKey);
      } catch {
        return this.memoryFallback.get(fullKey) || null;
      }
    }
    return this.memoryFallback.get(fullKey) || null;
  }

  private setItem(key: string, value: string): void {
    const fullKey = `${this.prefix}${key}`;
    if (this.isStorageAvailable) {
      try {
        window.localStorage.setItem(fullKey, value);
        return;
      } catch {
        // Fall back to in-memory store
      }
    }
    this.memoryFallback.set(fullKey, value);
  }

  // ---------------------------------------------------------------------------
  // 1. High Score
  // ---------------------------------------------------------------------------

  public async getHighScore(): Promise<number> {
    const stored = this.getItem('high_score');
    if (!stored) return 0;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  public async saveHighScore(score: number): Promise<void> {
    if (typeof score !== 'number' || isNaN(score) || score < 0) return;
    const current = await this.getHighScore();
    if (score > current) {
      this.setItem('high_score', Math.round(score).toString());
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Achievements
  // ---------------------------------------------------------------------------

  public async getAchievements(): Promise<string[]> {
    const stored = this.getItem('achievements');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => typeof id === 'string');
      }
      return [];
    } catch {
      return [];
    }
  }

  public async saveAchievements(achievements: string[]): Promise<void> {
    if (!Array.isArray(achievements)) return;
    const unique = Array.from(
      new Set(achievements.filter((a) => typeof a === 'string' && a.trim().length > 0))
    );
    this.setItem('achievements', JSON.stringify(unique));
  }

  // ---------------------------------------------------------------------------
  // 3. Games Played
  // ---------------------------------------------------------------------------

  public async getGamesPlayed(): Promise<number> {
    const stored = this.getItem('games_played');
    if (!stored) return 0;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  public async recordGamePlayed(): Promise<number> {
    const current = await this.getGamesPlayed();
    const updated = current + 1;
    this.setItem('games_played', updated.toString());
    return updated;
  }

  // ---------------------------------------------------------------------------
  // 4. Highest Level
  // ---------------------------------------------------------------------------

  public async getHighestLevel(): Promise<number> {
    const stored = this.getItem('highest_level');
    if (!stored) return 1;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  public async saveHighestLevel(level: number): Promise<void> {
    if (typeof level !== 'number' || isNaN(level) || level < 1) return;
    const current = await this.getHighestLevel();
    if (level > current) {
      this.setItem('highest_level', Math.round(level).toString());
    }
  }

  // ---------------------------------------------------------------------------
  // Consolidated Stats & Reset
  // ---------------------------------------------------------------------------

  public async getStats(): Promise<StoredGameStats> {
    const [highScore, highestLevel, gamesPlayed, achievements] = await Promise.all([
      this.getHighScore(),
      this.getHighestLevel(),
      this.getGamesPlayed(),
      this.getAchievements(),
    ]);

    return {
      highScore,
      highestLevel,
      gamesPlayed,
      achievements,
      lastPlayed: this.getItem('last_played') || undefined,
    };
  }

  public async saveStats(stats: Partial<StoredGameStats>): Promise<void> {
    if (stats.highScore !== undefined) {
      await this.saveHighScore(stats.highScore);
    }
    if (stats.highestLevel !== undefined) {
      await this.saveHighestLevel(stats.highestLevel);
    }
    if (stats.gamesPlayed !== undefined) {
      this.setItem('games_played', Math.max(0, stats.gamesPlayed).toString());
    }
    if (stats.achievements !== undefined) {
      await this.saveAchievements(stats.achievements);
    }
    if (stats.lastPlayed) {
      this.setItem('last_played', stats.lastPlayed);
    }
  }

  public async resetStats(): Promise<void> {
    this.setItem('high_score', '0');
    this.setItem('highest_level', '1');
    this.setItem('games_played', '0');
    this.setItem('achievements', '[]');
    this.setItem('last_played', new Date().toISOString());
  }

  // ---------------------------------------------------------------------------
  // Leaderboard
  // ---------------------------------------------------------------------------

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const stored = this.getItem('leaderboard');
    if (!stored) {
      // Default high score Hall of Fame seed
      return [
        { name: 'CYBER_ACE', score: 980, level: 8, date: '2026-09-15' },
        { name: 'NEON_BLASTER', score: 750, level: 6, date: '2026-09-14' },
        { name: 'PIXEL_VIPER', score: 520, level: 4, date: '2026-09-12' },
      ];
    }
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public async saveScore(entry: LeaderboardEntry): Promise<void> {
    const list = await this.getLeaderboard();
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 20);
    this.setItem('leaderboard', JSON.stringify(trimmed));
  }
}

/**
 * In-memory ephemeral ScoreAdapter for isolated embedded sessions or tests.
 */
export class MemoryScoreAdapter implements ScoreAdapter {
  private highScore: number = 0;
  private highestLevel: number = 1;
  private gamesPlayed: number = 0;
  private achievements: Set<string> = new Set();
  private leaderboard: LeaderboardEntry[] = [];
  private lastPlayed?: string;

  constructor(initialHighScore: number = 0) {
    this.highScore = initialHighScore;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public saveHighScore(score: number): void {
    if (score > this.highScore) {
      this.highScore = score;
    }
  }

  public getAchievements(): string[] {
    return Array.from(this.achievements);
  }

  public saveAchievements(achievements: string[]): void {
    this.achievements = new Set(achievements);
  }

  public getGamesPlayed(): number {
    return this.gamesPlayed;
  }

  public recordGamePlayed(): number {
    this.gamesPlayed += 1;
    return this.gamesPlayed;
  }

  public getHighestLevel(): number {
    return this.highestLevel;
  }

  public saveHighestLevel(level: number): void {
    if (level > this.highestLevel) {
      this.highestLevel = level;
    }
  }

  public getStats(): StoredGameStats {
    return {
      highScore: this.highScore,
      highestLevel: this.highestLevel,
      gamesPlayed: this.gamesPlayed,
      achievements: Array.from(this.achievements),
      lastPlayed: this.lastPlayed,
    };
  }

  public saveStats(stats: Partial<StoredGameStats>): void {
    if (stats.highScore !== undefined && stats.highScore > this.highScore) {
      this.highScore = stats.highScore;
    }
    if (stats.highestLevel !== undefined && stats.highestLevel > this.highestLevel) {
      this.highestLevel = stats.highestLevel;
    }
    if (stats.gamesPlayed !== undefined) {
      this.gamesPlayed = stats.gamesPlayed;
    }
    if (stats.achievements) {
      this.achievements = new Set(stats.achievements);
    }
    if (stats.lastPlayed) {
      this.lastPlayed = stats.lastPlayed;
    }
  }

  public resetStats(): void {
    this.highScore = 0;
    this.highestLevel = 1;
    this.gamesPlayed = 0;
    this.achievements.clear();
    this.lastPlayed = undefined;
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  public saveScore(entry: LeaderboardEntry): void {
    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
  }
}

