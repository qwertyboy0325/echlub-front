import { BaseRepositoryImpl } from '../../../data/repositories/BaseRepositoryImpl';
import { BaseModelImpl } from '../../../data/models/BaseModel';
import { Storage } from '../../../infrastructure/storage/Storage';

describe('BaseRepositoryImpl', () => {
  class TestModel extends BaseModelImpl {
    constructor(public name: string) {
      super();
    }
  }

  class TestRepository extends BaseRepositoryImpl<TestModel> {
    constructor(storage: Storage) {
      super(storage, 'test_storage');
    }

    public toDTO(entity: TestModel): any {
      return {
        id: entity.id,
        name: entity.name,
        version: entity.version,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
      };
    }

    protected toDomain(dto: any): TestModel {
      const entity = new TestModel(dto.name);
      entity.id = dto.id;
      entity.version = dto.version;
      entity.createdAt = new Date(dto.createdAt);
      entity.updatedAt = new Date(dto.updatedAt);
      return entity;
    }
  }

  let repository: TestRepository;
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    };
    repository = new TestRepository(mockStorage);
  });

  test('should save entity and return saved entity', async () => {
    const entity = new TestModel('test');
    const savedEntity = await repository.save(entity);
    expect(savedEntity).toBeDefined();
    expect(savedEntity.id).toBe(entity.id);
    expect(savedEntity.name).toBe('test');
    expect(mockStorage.set).toHaveBeenCalledWith('test_storage', expect.any(Object));
  });

  test('should update existing entity', async () => {
    const existingEntity = new TestModel('original');
    (mockStorage.get as jest.Mock).mockResolvedValue({ [existingEntity.id]: repository.toDTO(existingEntity) });

    const updatedEntity = new TestModel('updated');
    updatedEntity.id = existingEntity.id;
    const savedEntity = await repository.save(updatedEntity);
    expect(savedEntity.id).toBe(existingEntity.id);
    expect(savedEntity.name).toBe('updated');
  });

  test('should find entity by id', async () => {
    const entity = new TestModel('test');
    (mockStorage.get as jest.Mock).mockResolvedValue({ [entity.id]: repository.toDTO(entity) });

    const foundEntity = await repository.findById(entity.id);
    expect(foundEntity).toBeDefined();
    expect(foundEntity?.id).toBe(entity.id);
  });

  test('should find all entities', async () => {
    const entity1 = new TestModel('test1');
    const entity2 = new TestModel('test2');
    (mockStorage.get as jest.Mock).mockResolvedValue({
      [entity1.id]: repository.toDTO(entity1),
      [entity2.id]: repository.toDTO(entity2)
    });

    const foundEntities = await repository.findAll();
    expect(foundEntities).toHaveLength(2);
    expect(foundEntities[0].id).toBe(entity1.id);
    expect(foundEntities[1].id).toBe(entity2.id);
  });

  test('should delete entity', async () => {
    const entity = new TestModel('test');
    (mockStorage.get as jest.Mock).mockResolvedValue({ [entity.id]: repository.toDTO(entity) });

    await repository.delete(entity.id);
    expect(mockStorage.set).toHaveBeenCalledWith('test_storage', {});
  });
}); 