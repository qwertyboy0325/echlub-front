import { Storage } from '../../infrastructure/storage/Storage';
import { BaseModelImpl } from '../../domain/models/BaseModel';
import { BaseDTO } from '../models/BaseDTO';

interface StorageData<T extends BaseDTO> {
  [key: string]: T;
}

export abstract class BaseRepositoryImpl<T extends BaseModelImpl, DTO extends BaseDTO = BaseDTO> {
  constructor(
    protected readonly storage: Storage,
    protected readonly storageKey: string
  ) {}

  async save(entity: T): Promise<T> {
    const data = await this.storage.get<StorageData<DTO>>(this.storageKey);
    const newData = data || {};
    const dto = this.toDTO(entity);
    newData[entity.id] = dto;
    await this.storage.set(this.storageKey, newData);
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const data = await this.storage.get<StorageData<DTO>>(this.storageKey);
    if (!data) {
      return null;
    }
    const dto = data[id];
    return dto ? this.toDomain(dto) : null;
  }

  async findAll(): Promise<T[]> {
    const data = await this.storage.get<Record<string, DTO>>(this.storageKey);
    if (!data) return [];
    return Object.values(data).map(dto => this.toDomain(dto));
  }

  async delete(id: string): Promise<void> {
    const data = await this.storage.get<StorageData<DTO>>(this.storageKey);
    if (data) {
      delete data[id];
      await this.storage.set(this.storageKey, data);
    }
  }

  async exists(id: string): Promise<boolean> {
    const data = await this.storage.get<StorageData<DTO>>(this.storageKey);
    return data ? id in data : false;
  }

  async count(): Promise<number> {
    const data = await this.storage.get<Record<string, DTO>>(this.storageKey);
    return data ? Object.keys(data).length : 0;
  }

  protected abstract toDTO(entity: T): DTO;
  protected abstract toDomain(dto: DTO): T;
} 