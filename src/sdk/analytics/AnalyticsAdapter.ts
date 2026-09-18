import { AnalyticsAdapter, AnalyticsEvent } from '../types';

/**
 * Default LocalAnalyticsAdapter:
 * Privacy-first, stores local in-memory telemetry with optional persistence in localStorage.
 * Sends ZERO external network requests.
 */
export class LocalAnalyticsAdapter implements AnalyticsAdapter {
  private events: AnalyticsEvent[] = [];
  private maxHistory: number = 100;
  private storageKey: string = 'bb_analytics_v1';

  constructor(options?: { maxHistory?: number }) {
    if (options?.maxHistory) {
      this.maxHistory = options.maxHistory;
    }
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.events = JSON.parse(data);
      }
    } catch {
      // Ignore in private browsing / sandboxes
    }
  }

  private persist() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events.slice(-this.maxHistory)));
    } catch {
      // Ignore
    }
  }

  public trackEvent(eventName: string, data: Record<string, any>, sessionId?: string): void {
    const event: AnalyticsEvent = {
      eventName,
      timestamp: Date.now(),
      sessionId: sessionId || 'default_session',
      data,
    };

    this.events.push(event);
    if (this.events.length > this.maxHistory) {
      this.events.shift();
    }
    this.persist();
  }

  public getSessionEvents(sessionId?: string): AnalyticsEvent[] {
    if (!sessionId) return [...this.events];
    return this.events.filter((e) => e.sessionId === sessionId);
  }

  public getAggregates(): {
    totalSessions: number;
    averageLevelReached: number;
    totalPlayTimeSeconds: number;
    totalBricksDestroyed: number;
  } {
    const endEvents = this.events.filter((e) => e.eventName === 'sessionEnded');
    const totalSessions = endEvents.length;
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        averageLevelReached: 1,
        totalPlayTimeSeconds: 0,
        totalBricksDestroyed: 0,
      };
    }

    let sumLevel = 0;
    let sumTime = 0;
    let sumBricks = 0;

    for (const evt of endEvents) {
      sumLevel += evt.data?.levelReached || 1;
      sumTime += evt.data?.durationSeconds || 0;
      sumBricks += evt.data?.bricksBroken || 0;
    }

    return {
      totalSessions,
      averageLevelReached: Number((sumLevel / totalSessions).toFixed(1)),
      totalPlayTimeSeconds: sumTime,
      totalBricksDestroyed: sumBricks,
    };
  }
}

/**
 * CustomEndpointAnalyticsAdapter:
 * Allows developers to stream game analytics to their custom REST backend.
 */
export class CustomEndpointAnalyticsAdapter implements AnalyticsAdapter {
  private endpointUrl: string;
  private headers: Record<string, string>;
  private buffer: AnalyticsEvent[] = [];
  private batchSize: number;
  private flushTimeout: any = null;

  constructor(options: {
    endpointUrl: string;
    headers?: Record<string, string>;
    batchSize?: number;
    flushIntervalMs?: number;
  }) {
    this.endpointUrl = options.endpointUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    this.batchSize = options.batchSize || 10;
  }

  public trackEvent(eventName: string, data: Record<string, any>, sessionId?: string): void {
    const event: AnalyticsEvent = {
      eventName,
      timestamp: Date.now(),
      sessionId: sessionId || 'default_session',
      data,
    };

    this.buffer.push(event);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), 3000);
    }
  }

  public async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.buffer.length === 0) return;

    const payload = [...this.buffer];
    this.buffer = [];

    try {
      if (typeof fetch !== 'undefined') {
        await fetch(this.endpointUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ events: payload }),
          keepalive: true,
        });
      }
    } catch (err) {
      console.warn('[BreakingBricks:Analytics] Failed to send telemetry batch:', err);
    }
  }
}
