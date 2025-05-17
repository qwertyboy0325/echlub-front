import { injectable } from 'inversify';
import { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class MockEventBus implements IEventBus {
  private handlers: Map<string, ((payload: any) => void)[]> = new Map();
  private eventLog: { name: string; payload: any }[] = [];
  
  async emit(eventName: string, payload: any): Promise<void> {
    console.log(`[MockEventBus] 事件發送: ${eventName}`, payload);
    this.logEvent(eventName, payload);
    
    const eventHandlers = this.handlers.get(eventName) || [];
    eventHandlers.forEach(handler => handler(payload));
  }

  on(eventName: string, handler: (payload: any) => void): void {
    console.log(`[MockEventBus] 監聽事件: ${eventName}`);
    
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
  }

  off(eventName: string, handler: (payload: any) => void): void {
    console.log(`[MockEventBus] 取消監聽事件: ${eventName}`);
    
    if (!this.handlers.has(eventName)) {
      return;
    }
    
    const handlers = this.handlers.get(eventName) || [];
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  once(eventName: string, handler: (payload: any) => void): void {
    console.log(`[MockEventBus] 一次性監聽事件: ${eventName}`);
    
    const onceHandler = (payload: any) => {
      handler(payload);
      this.off(eventName, onceHandler);
    };
    
    this.on(eventName, onceHandler);
  }

  async publish(event: any): Promise<void> {
    const eventType = event.constructor.name;
    console.log(`[MockEventBus] 發布領域事件: ${eventType}`, event);
    this.logEvent(eventType, event);
  }
  
  // 記錄發出的事件
  private logEvent(name: string, payload: any): void {
    this.eventLog.push({ name, payload });
  }
  
  // 獲取事件記錄
  getEventLog(): { name: string; payload: any }[] {
    return [...this.eventLog];
  }
  
  // 清除事件記錄
  clearEventLog(): void {
    this.eventLog = [];
  }
} 
