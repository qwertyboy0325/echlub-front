import { BaseModelImpl } from '../../../domain/models/BaseModel';

// Create a concrete implementation for testing
class TestModel extends BaseModelImpl {
  constructor() {
    super();
  }

  // Expose protected method for testing
  public testIncrementVersion(): void {
    this.incrementVersion();
  }
}

describe('BaseModelImpl', () => {
  let model: TestModel;

  beforeEach(() => {
    model = new TestModel();
  });

  test('should initialize with default values', () => {
    expect(model.id).toBeDefined();
    expect(model.version).toBe(1);
    expect(model.createdAt).toBeDefined();
    expect(model.updatedAt).toBeDefined();
    expect(model.createdAt).toEqual(model.updatedAt);
  });

  test('should increment version', () => {
    const originalVersion = model.version;
    model.testIncrementVersion();
    expect(model.version).toBe(originalVersion + 1);
  });

  test('should update timestamps', () => {
    // Wait a bit to ensure timestamp difference
    const originalUpdatedAt = model.updatedAt;
    setTimeout(() => {
      model.testIncrementVersion();
      expect(model.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    }, 1);
  });
}); 