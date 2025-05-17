import { StateManager } from '../StateManager';

interface TestState {
  count: number;
  name?: string;
}

describe('StateManager', () => {
  let stateManager: StateManager;
  const TEST_KEY = 'test';

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('應該能夠設置和獲取狀態', () => {
    const testState: TestState = { count: 1 };
    stateManager.updateState({ [TEST_KEY]: testState });

    expect(stateManager.getState<TestState>(TEST_KEY)).toEqual(testState);
  });

  it('應該能夠更新部分狀態', () => {
    const initialState: TestState = { count: 1, name: 'test' };
    stateManager.updateState({ [TEST_KEY]: initialState });

    const currentState = stateManager.getState<TestState>(TEST_KEY);
    stateManager.updateState({ [TEST_KEY]: { ...currentState, count: 2 } });

    expect(stateManager.getState<TestState>(TEST_KEY)).toEqual({
      count: 2,
      name: 'test'
    });
  });

  it('應該能夠監聽狀態變化', () => {
    const initialState: TestState = { count: 1 };
    stateManager.updateState({ [TEST_KEY]: initialState });

    let newState: TestState | undefined;
    stateManager.subscribe<TestState>(TEST_KEY, (state) => {
      newState = state;
    });

    stateManager.updateState({ [TEST_KEY]: { count: 2 } });

    expect(newState).toEqual({ count: 2 });
  });

  it('應該能夠取消監聽', () => {
    let callCount = 0;
    const listener = () => callCount++;

    stateManager.subscribe(TEST_KEY, listener);
    stateManager.updateState({ [TEST_KEY]: { count: 1 } });
    stateManager.unsubscribe(TEST_KEY, listener);
    stateManager.updateState({ [TEST_KEY]: { count: 2 } });

    expect(callCount).toBe(1);
  });
}); 
