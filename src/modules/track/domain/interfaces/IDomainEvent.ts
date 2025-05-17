export interface IDomainEvent {
  readonly eventType: string;        // 模組前綴的事件類型
  readonly aggregateId: string;      // 聚合根ID
  readonly timestamp: Date;          // 時間戳
  readonly payload: unknown;         // 事件數據
} 
