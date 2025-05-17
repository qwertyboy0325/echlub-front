export interface IEventBus {
  emit(eventName: string, payload: any): Promise<void>;
  on(eventName: string, handler: (payload: any) => void): void;
  off(eventName: string, handler: (payload: any) => void): void;
  once(eventName: string, handler: (payload: any) => void): void;
  publish(event: any): Promise<void>;
} 
