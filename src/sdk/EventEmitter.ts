import { GameEventMap } from './types';

export class GameEventEmitter {
  private listeners: {
    [K in keyof GameEventMap]?: Array<GameEventMap[K]>;
  } = {};

  public on<K extends keyof GameEventMap>(event: K, handler: GameEventMap[K]): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);

    // Return unbind function
    return () => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof GameEventMap>(event: K, handler: GameEventMap[K]): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((fn) => fn !== handler) as any;
  }

  public emit<K extends keyof GameEventMap>(
    event: K,
    payload: Parameters<GameEventMap[K]>[0]
  ): void {
    const list = this.listeners[event];
    if (!list || list.length === 0) return;
    for (const handler of list) {
      try {
        (handler as any)(payload);
      } catch (err) {
        console.error(`[BreakingBricks] Error in '${event}' event listener:`, err);
      }
    }
  }

  public removeAllListeners(): void {
    this.listeners = {};
  }
}
