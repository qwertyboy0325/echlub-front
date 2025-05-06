import { Container } from 'inversify';
import { TYPES } from './types';
import { EventBus } from '../event-bus/EventBus';
import { StateManager } from '../state/StateManager';
import { Logger } from '../logging/Logger';
import { IEventBus } from '../event-bus/IEventBus';
import { IStateManager } from '../state/IStateManager';
import { EventMonitor } from '../events/EventMonitor';
import { DAWManager } from '../DAWManager';

const container = new Container();

// 綁定核心服務
container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
container.bind<Logger>(TYPES.Logger).to(Logger).inSingletonScope();

// 綁定其他核心服務
container.bind<EventMonitor>(TYPES.EventMonitor).to(EventMonitor).inSingletonScope();
container.bind<DAWManager>(TYPES.DAWManager).to(DAWManager).inSingletonScope();

export { container }; 