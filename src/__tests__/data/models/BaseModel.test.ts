import { BaseModelImpl } from '../../../data/models/BaseModel';

describe('BaseModelImpl', () => {
  class TestModel extends BaseModelImpl {
    testIncrementVersion() {
      this.incrementVersion();
    }
  }

  test('should initialize with default values', () => {
    const model = new TestModel();
    expect(model.id).toBeDefined();
    expect(model.version).toBe(1);
    expect(model.createdAt).toBeDefined();
    expect(model.updatedAt).toBeDefined();
  });

  test('should increment version', () => {
    const model = new TestModel();
    const originalVersion = model.version;
    model.testIncrementVersion();
    expect(model.version).toBe(originalVersion + 1);
  });

  test('should update timestamps', async () => {
    const model = new TestModel();
    const originalUpdatedAt = model.updatedAt;
    await new Promise(resolve => setTimeout(resolve, 10)); // Add small delay
    model.testIncrementVersion();
    expect(model.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
}); 