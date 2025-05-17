import { injectable } from 'inversify';
import { ILocalCacheAdapter } from './ILocalCacheAdapter';

/**
 * IndexedDB-based Local Cache Adapter
 */
@injectable()
export class LocalCacheAdapter implements ILocalCacheAdapter {
  private readonly DB_NAME = 'echlub_collaboration_cache';
  private readonly STORE_NAME = 'cache_store';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;
  
  constructor() {
    this.initDatabase().catch(error => {
      console.error('Failed to initialize IndexedDB:', error);
    });
  }
  
  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    if (this.db) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Create a new object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }
  
  /**
   * Get database transaction
   * @param mode Transaction mode
   */
  private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBTransaction> {
    if (!this.db) {
      await this.initDatabase();
    }
    
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    
    return this.db.transaction(this.STORE_NAME, mode);
  }
  
  /**
   * Get object store
   * @param mode Transaction mode
   */
  private async getObjectStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(mode);
    return transaction.objectStore(this.STORE_NAME);
  }
  
  /**
   * Store data
   */
  async set<T>(key: string, data: T): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put({
        key,
        value: data,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Retrieve data
   */
  async get<T>(key: string): Promise<T | null> {
    const store = await this.getObjectStore();
    
    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? data.value : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Delete data
   */
  async remove(key: string): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const store = await this.getObjectStore();
    
    return new Promise<boolean>((resolve, reject) => {
      const request = store.count(key);
      
      request.onsuccess = () => {
        resolve(request.result > 0);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
} 
