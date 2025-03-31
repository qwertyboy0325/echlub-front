import { Container } from 'inversify';
import { BaseRepositoryImpl } from '../BaseRepositoryImpl';
import type { Storage } from '../../../infrastructure/storage/Storage';
import type { BaseModel } from '../../../domain/models/BaseModel';
import type { BaseDTO } from '../../models/BaseDTO';
import { BaseModelImpl } from '../../../domain/models/BaseModel';

// 測試用的模型和 DTO
class TestModel extends BaseModelImpl {
  name: string;

  constructor(name: string, id?: string) {
    super(id);
    this.name = name;
  }
}

interface TestDTO extends BaseDTO {
  name: string;
}

// 測試用的存儲實現
class MockStorage implements Storage {
  private data: Record<string, any> = {};

  async get<T>(key: string): Promise<T | null> {
    const value = this.data[key];
    return value ? value as T : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof value === 'object' && value !== null) {
      this.data[key] = { ...this.data[key], ...value };
    } else {
      this.data[key] = value;
    }
  }

  async remove(key: string): Promise<void> {
    delete this.data[key];
  }

  async clear(): Promise<void> {
    this.data = {};
  }
}

// 測試用的 Repository 實現
class TestRepositoryImpl extends BaseRepositoryImpl<TestModel, TestDTO> {
  constructor(storage: Storage) {
    super(storage, 'test_storage');
  }

  protected toDTO(entity: TestModel): TestDTO {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      version: entity.version
    };
  }

  protected toDomain(dto: TestDTO): TestModel {
    const entity = new TestModel(dto.name, dto.id);
    entity.version = dto.version;
    entity.createdAt = new Date(dto.createdAt);
    entity.updatedAt = new Date(dto.updatedAt);
    return entity;
  }
}

describe('BaseRepositoryImpl', () => {
  let container: Container;
  let storage: Storage;
  let repository: TestRepositoryImpl;

  beforeEach(() => {
    container = new Container();
    storage = new MockStorage();
    container.bind<Storage>('Storage').toConstantValue(storage);
    repository = new TestRepositoryImpl(storage);
  });

  describe('save', () => {
    it('should save a new entity', async () => {
      const entity = new TestModel('Test');
      await repository.save(entity);
      const saved = await repository.findById(entity.id);
      expect(saved).toEqual(entity);
    });

    it('should update an existing entity', async () => {
      const entity = new TestModel('Test');
      await repository.save(entity);
      entity.name = 'Updated';
      await repository.save(entity);
      const updated = await repository.findById(entity.id);
      expect(updated?.name).toBe('Updated');
    });
  });

  describe('findById', () => {
    it('should return null for non-existent id', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should return entity for existing id', async () => {
      const entity = new TestModel('Test');
      await repository.save(entity);
      const result = await repository.findById(entity.id);
      expect(result).toEqual(entity);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no entities exist', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('should return all entities', async () => {
      const entities = [
        new TestModel('Test 1'),
        new TestModel('Test 2')
      ];

      await Promise.all(entities.map(entity => repository.save(entity)));
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id).sort()).toEqual(entities.map(e => e.id).sort());
    });
  });

  describe('delete', () => {
    it('should delete an existing entity', async () => {
      const entity = new TestModel('Test');
      await repository.save(entity);
      await repository.delete(entity.id);
      const result = await repository.findById(entity.id);
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return false for non-existent id', async () => {
      const result = await repository.exists('non-existent');
      expect(result).toBe(false);
    });

    it('should return true for existing id', async () => {
      const entity = new TestModel('Test');
      await repository.save(entity);
      const result = await repository.exists(entity.id);
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return 0 when no entities exist', async () => {
      const result = await repository.count();
      expect(result).toBe(0);
    });

    it('should return correct count of entities', async () => {
      const entities = [
        new TestModel('Test 1'),
        new TestModel('Test 2')
      ];

      await Promise.all(entities.map(entity => repository.save(entity)));
      const result = await repository.count();
      expect(result).toBe(2);
    });
  });
}); 