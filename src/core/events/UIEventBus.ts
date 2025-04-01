import { injectable } from 'inversify';
import { EventEmitter } from 'events';
import { UIEventPayload, EventHandlerOptions } from './types';

@injectable()
export class UIEventBus {
  private eventEmitter: EventEmitter;
  private debug: boolean = false;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(0); // 無限制監聽器數量
  }

  public emit<K extends keyof UIEventPayload>(
    event: K,
    payload: UIEventPayload[K]
  ): void {
    if (this.debug) {
      console.debug(`[UIEventBus] Emitting ${String(event)}:`, payload);
    }
    this.eventEmitter.emit(String(event), payload);
  }

  public async emitAsync<K extends keyof UIEventPayload>(
    event: K,
    payload: UIEventPayload[K]
  ): Promise<void> {
    if (this.debug) {
      console.debug(`[UIEventBus] Emitting async ${String(event)}:`, payload);
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

  public on<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    this.eventEmitter.on(String(event), handler);
  }

  public off<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void
  ): void {
    this.eventEmitter.off(String(event), handler);
  }

  public once<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void,
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