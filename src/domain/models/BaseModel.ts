import { v4 as uuidv4 } from 'uuid';

/**
 * Base model interface
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
  public id: string;
  public createdAt: Date;
  public updatedAt: Date;
  public version: number;

  constructor(id?: string) {
    this.id = id || this.generateUUID();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
  }

  protected generateUUID(): string {
    return uuidv4();
  }

  public incrementVersion(): void {
    this.version++;
    this.updatedAt = new Date();
  }
} 