import { Entity } from './Entity';

/**
 * 聚合根接口
 * 所有聚合根都應實現此接口
 */
export interface AggregateRoot extends Entity {
  // 版本控制相關方法
  getVersion(): number;
  incrementVersion(): void;
  
  // 序列化方法
  toJSON(): object;
} 