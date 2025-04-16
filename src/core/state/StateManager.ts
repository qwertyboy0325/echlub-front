import { injectable } from 'inversify';
import { IStateManager } from './IStateManager';

@injectable()
export class StateManager implements IStateManager {
  private state: Record<string, any> = {};
  private subscribers: Map<string, Set<(state: any) => void>> = new Map();

  getState<T>(key: string): T | undefined {
    return this.state[key] as T;
  }

  async updateState(partialState: Record<string, any>): Promise<void> {
    this.state = { ...this.state, ...partialState };
    
    for (const [key, value] of Object.entries(partialState)) {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        for (const subscriber of subscribers) {
          try {
            subscriber(value);
          } catch (error) {
            console.error(`Error in state subscriber for ${key}:`, error);
          }
        }
      }
    }
  }

  subscribe<T>(key: string, callback: (state: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // 返回取消訂閱的函數
    return () => {
      this.unsubscribe(key, callback);
    };
  }

  unsubscribe(key: string, callback: (state: any) => void): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }
} 