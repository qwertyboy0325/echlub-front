import type { BaseModel } from '../models/BaseModel';

/**
 * Base repository interface
 */
export interface BaseRepository<T extends BaseModel> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
} 