import { BaseModel } from '../models/BaseModel';

/**
 * Base repository interface
 */
export interface BaseRepository<T extends BaseModel> {
  /**
   * Get all items
   */
  getAll(): T[];

  /**
   * Get item by ID
   */
  getById(id: string): T | undefined;

  /**
   * Create new item
   */
  create(item: Partial<T>): T;

  /**
   * Update existing item
   */
  update(id: string, item: Partial<T>): T | undefined;

  /**
   * Delete item by ID
   */
  delete(id: string): boolean;

  /**
   * Check if item exists
   */
  exists(id: string): boolean;

  /**
   * Get count of items
   */
  count(): number;

  /**
   * Clear all items
   */
  clear(): void;
}

/**
 * Base repository implementation
 */
export abstract class BaseRepositoryImpl<T extends BaseModel> implements BaseRepository<T> {
  protected items: Map<string, T>;

  constructor() {
    this.items = new Map();
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  getById(id: string): T | undefined {
    return this.items.get(id);
  }

  create(item: Partial<T>): T {
    const newItem = this.createItem(item);
    this.items.set(newItem.id, newItem);
    return newItem;
  }

  update(id: string, item: Partial<T>): T | undefined {
    const existingItem = this.items.get(id);
    if (!existingItem) {
      return undefined;
    }
    const updatedItem = this.updateItem(existingItem, item);
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  exists(id: string): boolean {
    return this.items.has(id);
  }

  count(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  /**
   * Create new item instance
   */
  protected abstract createItem(data: Partial<T>): T;

  /**
   * Update existing item
   */
  protected abstract updateItem(existing: T, data: Partial<T>): T;
} 