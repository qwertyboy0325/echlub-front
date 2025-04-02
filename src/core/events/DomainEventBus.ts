import { EventEmitter } from '../EventEmitter';
import { injectable } from 'inversify';
import { DomainEventPayload, EventHandlerOptions } from './types';

@injectable()
export class DomainEventBus extends EventEmitter<DomainEventPayload> {
  private debug: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(0); // 無限制監聽器數量
  }

  public emit<K extends keyof DomainEventPayload>(
    event: K,
    payload: DomainEventPayload[K]
  ): void {
    if (this.debug) {
      console.debug(`[DomainEventBus] Emitting ${String(event)}:`, payload);
    }
    super.emit(event, payload);
  }

  public async emitAsync<K extends keyof DomainEventPayload>(
    event: K,
    payload: DomainEventPayload[K]
  ): Promise<void> {
    if (this.debug) {
      console.debug(`[DomainEventBus] Emitting async ${String(event)}:`, payload);
    }
    return new Promise((resolve, reject) => {
      try {
        super.emit(event, payload);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  public on<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    super.on(event, handler);
  }

  public off<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void
  ): void {
    super.off(event, handler);
  }

  public once<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    super.once(event, handler);
  }

  public setDebugMode(enabled: boolean): void {
    this.debug = enabled;
  }

  public removeAllListeners(event?: keyof DomainEventPayload): void {
    super.removeAllListeners(event);
  }
} 