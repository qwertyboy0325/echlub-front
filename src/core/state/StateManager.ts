import { injectable } from 'inversify';
import { IStateManager } from './IStateManager';

@injectable()
export class StateManager implements IStateManager {
  private state: Record<string, any> = {};
  private subscribers: Map<string, Set<(state: any) => void>> = new Map();

  getState<T>(key: string): T {
    const value = this.state[key] as T;
    if (value === undefined) {
      throw new Error(`State for key "${key}" is not defined`);
    }
    return value;
  }

  // 這個方法同時支持 IStateManager 介面和測試中的批量更新
  updateState<T>(keyOrState: string | Record<string, any>, value?: T): void {
    if (typeof keyOrState === 'string' && value !== undefined) {
      // Single key-value update (IStateManager interface)
      const key = keyOrState;
      this.state[key] = value;
      
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
    } else if (typeof keyOrState === 'object') {
      // Batch update (for tests)
      const partialState = keyOrState;
      this.state = { ...this.state, ...partialState };
      
      for (const [key, val] of Object.entries(partialState)) {
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
          for (const subscriber of subscribers) {
            try {
              subscriber(val);
            } catch (error) {
              console.error(`Error in state subscriber for ${key}:`, error);
            }
          }
        }
      }
    }
  }

  subscribe<T>(key: string, callback: (state: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback as any);

    // 返回取消訂閱的函數
    return () => {
      this.unsubscribe(key, callback as any);
    };
  }

  unsubscribe(key: string, callback: (state: any) => void): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }
} 