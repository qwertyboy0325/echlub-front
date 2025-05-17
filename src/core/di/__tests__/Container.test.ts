import { Container } from 'inversify';
import { TYPES } from '../types';
import type { IEventBus } from '../../event-bus/IEventBus';
import type { IStateManager } from '../../state/IStateManager';
import { EventBus } from '../../event-bus/EventBus';
import { StateManager } from '../../state/StateManager';

describe('DI Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
    container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
  });

  it('應該正確綁定 EventBus', () => {
    const eventBus = container.get<IEventBus>(TYPES.EventBus);
    expect(eventBus).toBeDefined();
    expect(eventBus).toBeInstanceOf(EventBus);
  });

  it('應該正確綁定 StateManager', () => {
    const stateManager = container.get<IStateManager>(TYPES.StateManager);
    expect(stateManager).toBeDefined();
    expect(stateManager).toBeInstanceOf(StateManager);
  });
}); 
