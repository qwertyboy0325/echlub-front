import { BaseRepositoryImpl } from '../../../data/repositories/BaseRepository';
import { BaseModelImpl } from '../../../data/models/BaseModel';

// Create a concrete implementation for testing
class TestModel extends BaseModelImpl {
  constructor(data: Partial<TestModel>) {
    super(data);
  }
}

class TestRepository extends BaseRepositoryImpl<TestModel> {
  protected createItem(data: Partial<TestModel>): TestModel {
    return new TestModel(data);
  }

  protected updateItem(existing: TestModel, data: Partial<TestModel>): TestModel {
    return new TestModel({
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1
    });
  }
}

describe('BaseRepositoryImpl', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
  });

  test('should create new item', () => {
    const item = repository.create({});
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
    expect(item.version).toBe(1);
  });

  test('should get item by ID', () => {
    const item = repository.create({});
    const retrieved = repository.getById(item.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(item.id);
  });

  test('should return undefined for non-existent ID', () => {
    const retrieved = repository.getById('non-existent');
    expect(retrieved).toBeUndefined();
  });

  test('should update existing item', () => {
    const item = repository.create({});
    const updated = repository.update(item.id, {});
    expect(updated).toBeDefined();
    expect(updated?.id).toBe(item.id);
    expect(updated?.version).toBe(item.version + 1);
  });

  test('should return undefined when updating non-existent item', () => {
    const updated = repository.update('non-existent', {});
    expect(updated).toBeUndefined();
  });

  test('should delete item', () => {
    const item = repository.create({});
    const deleted = repository.delete(item.id);
    expect(deleted).toBe(true);
    expect(repository.getById(item.id)).toBeUndefined();
  });

  test('should return false when deleting non-existent item', () => {
    const deleted = repository.delete('non-existent');
    expect(deleted).toBe(false);
  });

  test('should check if item exists', () => {
    const item = repository.create({});
    expect(repository.exists(item.id)).toBe(true);
    expect(repository.exists('non-existent')).toBe(false);
  });

  test('should get count of items', () => {
    expect(repository.count()).toBe(0);
    repository.create({});
    expect(repository.count()).toBe(1);
    repository.create({});
    expect(repository.count()).toBe(2);
  });

  test('should get all items', () => {
    const item1 = repository.create({});
    const item2 = repository.create({});
    const items = repository.getAll();
    expect(items).toHaveLength(2);
    expect(items).toContainEqual(item1);
    expect(items).toContainEqual(item2);
  });

  test('should clear all items', () => {
    repository.create({});
    repository.create({});
    expect(repository.count()).toBe(2);
    repository.clear();
    expect(repository.count()).toBe(0);
  });
}); 