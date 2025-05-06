/**
 * 領域事件基類
 * 所有領域事件都應繼承此類
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventName: string;
  public readonly aggregateId?: string;
  
  /**
   * 兼容性屬性，與舊的 IDomainEvent 接口保持一致
   * 子類可以覆蓋此屬性提供更具體的類型
   */
  public get eventType(): string {
    return this.eventName;
  }
  
  /**
   * 兼容性屬性，與舊的接口中的 timestamp 保持一致
   */
  public get timestamp(): Date {
    return this.occurredOn;
  }
 
  constructor(eventName: string, aggregateId?: string) {
    this.occurredOn = new Date();
    this.eventName = eventName;
    this.aggregateId = aggregateId;
  }
} 