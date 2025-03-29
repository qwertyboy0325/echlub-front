import { BaseModelImpl } from '../../../data/models/BaseModel';

describe('BaseModelImpl', () => {
  let model: BaseModelImpl;

  beforeEach(() => {
    model = new BaseModelImpl({});
  });

  test('should create with default values', () => {
    expect(model.id).toBeDefined();
    expect(model.createdAt).toBeInstanceOf(Date);
    expect(model.updatedAt).toBeInstanceOf(Date);
    expect(model.version).toBe(1);
  });

  test('should create with provided values', () => {
    const now = new Date();
    const model = new BaseModelImpl({
      id: 'test-id',
      createdAt: now,
      updatedAt: now,
      version: 2
    });

    expect(model.id).toBe('test-id');
    expect(model.createdAt).toBe(now);
    expect(model.updatedAt).toBe(now);
    expect(model.version).toBe(2);
  });

  test('should update timestamp and version', () => {
    const originalUpdatedAt = model.updatedAt;
    const originalVersion = model.version;

    // @ts-ignore - accessing protected method for testing
    model.update();

    expect(model.updatedAt).not.toBe(originalUpdatedAt);
    expect(model.version).toBe(originalVersion + 1);
  });
}); 