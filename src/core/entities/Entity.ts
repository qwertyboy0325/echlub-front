import { UniqueId } from '../value-objects/UniqueId';

/**
 * 實體基類
 * 所有領域實體都應繼承此類
 */
export abstract class Entity<T extends UniqueId = UniqueId> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  /**
   * 實體相等性比較
   * 實體通過其唯一標識符來比較相等性
   */
  public equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    
    if (!(other instanceof Entity)) {
      return false;
    }
    
    return this._id.equals(other._id);
  }
} 
