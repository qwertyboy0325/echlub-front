import { EventEmitter } from '../EventEmitter';
import { injectable } from 'inversify';
import { UIEventPayload, EventHandlerOptions } from './types';

@injectable()
export class UIEventBus extends EventEmitter<UIEventPayload> {
  private debug: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(0); // 無限制監聽器數量
  }

  public emit<K extends keyof UIEventPayload>(
    event: K,
    payload: UIEventPayload[K]
  ): void {
    if (this.debug) {
      console.debug(`[UIEventBus] Emitting ${String(event)}:`, payload);
    }
    super.emit(event, payload);
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
        super.emit(event, payload);
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
    super.on(event, handler);
  }

  public off<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void
  ): void {
    super.off(event, handler);
  }

  public once<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void,
    options?: EventHandlerOptions
  ): void {
    super.once(event, handler);
  }

  public setDebugMode(enabled: boolean): void {
    this.debug = enabled;
  }

  public removeAllListeners(event?: keyof UIEventPayload): void {
    super.removeAllListeners(event);
  }
} 