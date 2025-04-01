import { injectable } from 'inversify';

@injectable()
export class LocalStorageService {
  private readonly prefix = 'echlub_';

  public async set(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error(`[LocalStorageService] Failed to set ${key}:`, error);
      throw error;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const serializedValue = localStorage.getItem(this.prefix + key);
      if (serializedValue === null) return null;
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      console.error(`[LocalStorageService] Failed to get ${key}:`, error);
      return null;
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`[LocalStorageService] Failed to remove ${key}:`, error);
      throw error;
    }
  }

  public async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('[LocalStorageService] Failed to clear storage:', error);
      throw error;
    }
  }

  public async keys(): Promise<string[]> {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.slice(this.prefix.length));
    } catch (error) {
      console.error('[LocalStorageService] Failed to get keys:', error);
      return [];
    }
  }
} 