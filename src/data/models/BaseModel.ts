import { UUIDGenerator } from '../../utils/uuid';

/**
 * Base model interface for all data models
 */
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Base model class implementation
 */
export abstract class BaseModelImpl implements BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  constructor(data: Partial<BaseModel>) {
    this.id = data.id || UUIDGenerator.generate();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.version = data.version || 1;
  }

  /**
   * Update the model's timestamp and version
   */
  protected update(): void {
    this.updatedAt = new Date();
    this.version += 1;
  }
} 