import { ContainerModule } from 'inversify';
import { UIEventBus } from '../events/UIEventBus';
import { DomainEventBus } from '../events/DomainEventBus';
import { EventTranslator } from '../events/EventTranslator';
import { TYPES } from './types';

export const eventModule = new ContainerModule((bind) => {
  // 註冊事件總線
  bind<UIEventBus>(TYPES.UIEventBus)
    .to(UIEventBus)
    .inSingletonScope();

  bind<DomainEventBus>(TYPES.DomainEventBus)
    .to(DomainEventBus)
    .inSingletonScope();

  // 註冊事件轉換器
  bind<EventTranslator>(TYPES.EventTranslator)
    .to(EventTranslator)
    .inSingletonScope();
}); 