import { injectable } from 'inversify';
import type { IntegrationEvent } from './IntegrationEvent';

/**
 * 事件處理器類型
 */
type EventHandler = (event: IntegrationEvent) => void | Promise<void>;

/**
 * 整合事件總線
 */
@injectable()
export class IntegrationEventBus {
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private namespaceHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * 發布整合事件
   */
  async publish(event: IntegrationEvent): Promise<void> {
    const eventType = event.eventType;
    const promises: Promise<void>[] = [];

    // 處理具體事件的處理器
    const handlers = this.eventHandlers.get(eventType) || new Set();
    promises.push(...Array.from(handlers).map(handler => this.executeHandler(handler, event)));

    // 處理命名空間處理器
    for (const [namespace, nsHandlers] of this.namespaceHandlers) {
      if (eventType.startsWith(namespace)) {
        promises.push(...Array.from(nsHandlers).map(handler => this.executeHandler(handler, event)));
      }
    }

    await Promise.all(promises);
  }

  /**
   * 執行事件處理器
   */
  private async executeHandler(handler: EventHandler, event: IntegrationEvent): Promise<void> {
    try {
      await Promise.resolve(handler(event));
    } catch (error) {
      console.error(`Error handling integration event ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * 訂閱特定事件
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)?.add(handler);
  }

  /**
   * 訂閱命名空間下的所有事件
   */
  subscribeToNamespace(namespace: string, handler: EventHandler): void {
    if (!this.namespaceHandlers.has(namespace)) {
      this.namespaceHandlers.set(namespace, new Set());
    }
    
    this.namespaceHandlers.get(namespace)?.add(handler);
    console.log(`[IntegrationEventBus] Subscribed to namespace: ${namespace}`);
  }

  /**
   * 取消訂閱特定事件
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;
    
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.eventHandlers.delete(eventType);
    }
  }

  /**
   * 取消訂閱命名空間
   */
  unsubscribeFromNamespace(namespace: string, handler: EventHandler): void {
    const handlers = this.namespaceHandlers.get(namespace);
    if (!handlers) return;
    
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.namespaceHandlers.delete(namespace);
    }
  }
} 