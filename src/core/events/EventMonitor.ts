import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { UIEventBus } from './UIEventBus';
import { DomainEventBus } from './DomainEventBus';
import { UIEventPayload, DomainEventPayload } from './types';

@injectable()
export class EventMonitor {
  constructor(
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {}

  public enableMonitoring(): void {
    // 啟用 UI 事件監控
    this.uiEventBus.setDebugMode(true);
    this.uiEventBus.on('*' as keyof UIEventPayload, (payload: any) => {
      console.group('UI Event');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Event:', payload);
      console.groupEnd();
    });

    // 啟用 Domain 事件監控
    this.domainEventBus.setDebugMode(true);
    this.domainEventBus.on('*' as keyof DomainEventPayload, (payload: any) => {
      console.group('Domain Event');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Event:', payload);
      console.groupEnd();
    });

    console.log('[EventMonitor] Event monitoring enabled');
  }

  public disableMonitoring(): void {
    this.uiEventBus.setDebugMode(false);
    this.domainEventBus.setDebugMode(false);
    console.log('[EventMonitor] Event monitoring disabled');
  }
} 