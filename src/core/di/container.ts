import { Container } from 'inversify';
import { TYPES } from './types';
import { EventBus } from '../event-bus/EventBus';
import { StateManager } from '../state/StateManager';
import { Logger } from '../logging/Logger';
import { IEventBus } from '../event-bus/IEventBus';
import { IStateManager } from '../state/IStateManager';

const container = new Container();

// 綁定核心服務
container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
container.bind<Logger>(TYPES.Logger).to(Logger).inSingletonScope();

export { container }; 