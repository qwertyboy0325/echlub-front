import type { BaseDTO } from '../models/BaseDTO';
import type { BaseModel } from '../../domain/models/BaseModel';

/**
 * Base repository interface
 */
export interface BaseRepository<T extends BaseModel> {
  /**
   * Get all items
   */
  getAll(): Promise<T[]>;

  /**
   * Get item by ID
   */
  getById(id: string): Promise<T | null>;

  /**
   * Create new item
   */
  create(item: T): Promise<T>;

  /**
   * Update existing item
   */
  update(id: string, item: T): Promise<T | null>;

  /**
   * Delete item by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if item exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get count of items
   */
  count(): Promise<number>;
}

/**
 * Base repository implementation
 */
export abstract class BaseRepositoryImpl<T extends BaseModel, D extends BaseDTO> implements BaseRepository<T> {
  protected items: Map<string, D>;

  constructor() {
    this.items = new Map();
  }

  async getAll(): Promise<T[]> {
    return Array.from(this.items.values()).map(dto => this.toDomain(dto));
  }

  async getById(id: string): Promise<T | null> {
    const dto = this.items.get(id);
    if (!dto) return null;
    return this.toDomain(dto);
  }

  async create(item: T): Promise<T> {
    const dto = this.toDTO(item);
    this.items.set(item.id, dto);
    return item;
  }

  async update(id: string, item: T): Promise<T | null> {
    if (!this.items.has(id)) {
      return null;
    }
    const dto = this.toDTO(item);
    this.items.set(id, dto);
    return item;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.items.has(id);
  }

  async count(): Promise<number> {
    return this.items.size;
  }

  /**
   * Convert DTO to domain model
   */
  protected abstract toDomain(dto: D): T;

  /**
   * Convert domain model to DTO
   */
  protected abstract toDTO(model: T): D;
} 