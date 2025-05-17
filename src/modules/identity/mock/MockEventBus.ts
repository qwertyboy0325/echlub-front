import { injectable } from 'inversify';
import { IEventBus } from '../../../core/event-bus/IEventBus';

@injectable()
export class MockEventBus implements IEventBus {
  async emit(eventName: string, payload: any): Promise<void> {
    console.log(`事件發送: ${eventName}`, payload);
  }

  on(eventName: string, _handler: (payload: any) => void): void {
    console.log(`監聽事件: ${eventName}`);
  }

  off(eventName: string, _handler: (payload: any) => void): void {
    console.log(`取消監聽事件: ${eventName}`);
  }

  once(eventName: string, _handler: (payload: any) => void): void {
    console.log(`一次性監聽事件: ${eventName}`);
  }

  async publish(event: any): Promise<void> {
    const eventType = event.constructor.name;
    console.log(`發布領域事件: ${eventType}`, event);
  }
} 
