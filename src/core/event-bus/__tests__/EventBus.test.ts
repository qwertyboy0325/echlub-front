import { EventBus } from '../EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('應該能夠發送和接收事件', () => {
    const eventName = 'test:event';
    const eventData = { message: 'test' };
    let receivedData: any;

    eventBus.on(eventName, (data) => {
      receivedData = data;
    });

    eventBus.emit(eventName, eventData);

    expect(receivedData).toEqual(eventData);
  });

  it('應該能夠移除事件監聽器', () => {
    const eventName = 'test:event';
    const eventData = { message: 'test' };
    let callCount = 0;

    const listener = () => {
      callCount++;
    };

    eventBus.on(eventName, listener);
    eventBus.emit(eventName, eventData);
    eventBus.off(eventName, listener);
    eventBus.emit(eventName, eventData);

    expect(callCount).toBe(1);
  });

  it('應該能夠處理多個監聽器', () => {
    const eventName = 'test:event';
    const eventData = { message: 'test' };
    let callCount = 0;

    eventBus.on(eventName, () => callCount++);
    eventBus.on(eventName, () => callCount++);

    eventBus.emit(eventName, eventData);

    expect(callCount).toBe(2);
  });
}); 
