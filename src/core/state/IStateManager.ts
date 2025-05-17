export interface IStateManager {
  getState<T>(key: string): T;
  updateState<T>(key: string, value: T): void;
  updateState(partialState: Record<string, any>): void;
  subscribe<T>(key: string, callback: (value: T) => void): void;
  unsubscribe(key: string, callback: (value: any) => void): void;
} 
