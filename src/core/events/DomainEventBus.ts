import { injectable } from 'inversify';
import { EventEmitter } from 'events';
import { DomainEventPayload, EventHandlerOptions } from './types';

@injectable()
export class DomainEventBus {
  private eventEmitter: EventEmitter;
  private debug: boolean = false;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(0); // 無限制監聽器數量
  }

  public emit<K extends keyof DomainEventPayload>(
    event: K,
    payload: DomainEventPayload[K]
  ): void {
    if (this.debug) {
      console.debug(`[DomainEventBus] Emitting ${String(event)}:`, payload);
    }
    this.eventEmitter.emit(String(event), payload);
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
        this.eventEmitter.emit(String(event), payload);
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
    this.eventEmitter.on(String(event), handler);
  }

  public off<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void
  ): void {
    this.eventEmitter.off(String(event), handler);
  }

  public once<K extends keyof DomainEventPayload>(
    event: K,
    handler: (payload: DomainEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    this.eventEmitter.once(String(event), handler);
  }

  public setDebugMode(enabled: boolean): void {
    this.debug = enabled;
  }

  public removeAllListeners(): void {
    this.eventEmitter.removeAllListeners();
  }
} 