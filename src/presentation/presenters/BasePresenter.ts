import { injectable } from 'inversify';
import { UIEventBus } from '../../core/events/UIEventBus';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { UIEventPayload, DomainEventPayload, EventHandlerOptions } from '../../core/events/types';

@injectable()
export abstract class BasePresenter {
  constructor(
    protected uiEventBus: UIEventBus,
    protected domainEventBus: DomainEventBus
  ) {}

  protected emit<K extends keyof UIEventPayload>(
    event: K,
    payload: UIEventPayload[K]
  ): void {
    this.uiEventBus.emit(event, payload);
  }

  protected emitAsync<K extends keyof UIEventPayload>(
    event: K,
    payload: UIEventPayload[K]
  ): Promise<void> {
    return this.uiEventBus.emitAsync(event, payload);
  }

  protected on<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    this.domainEventBus.on(event, handler, options);
  }

  protected off<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void
  ): void {
    this.domainEventBus.off(event, handler);
  }

  protected once<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    this.domainEventBus.once(event, handler, options);
  }

  public abstract dispose(): void;
} 