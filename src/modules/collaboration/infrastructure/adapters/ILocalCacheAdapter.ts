/**
 * Local Cache Adapter Interface
 * Provides key-value storage functionality
 */
export interface ILocalCacheAdapter {
  /**
   * Store item in cache
   * @param key Key name
   * @param value Value
   */
  set<T>(key: string, value: T): Promise<void>;
  
  /**
   * Retrieve item from cache
   * @param key Key name
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Remove item from cache
   * @param key Key name
   */
  remove(key: string): Promise<void>;
  
  /**
   * Check if cache contains a key
   * @param key Key name
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Clear all cached data
   */
  clear(): Promise<void>;
} 
