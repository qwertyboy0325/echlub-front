import type { BaseModel } from '../models/BaseModel';

/**
 * Base repository interface
 */
export interface BaseRepository<T> {
  add(entity: T): Promise<void>;
  get(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  update(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
} 