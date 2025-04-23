import { IEntity } from './IEntity';

/**
 * 表示聚合根的介面
 * 聚合根是一個特殊的實體，它是聚合的入口點，負責維護聚合內所有實體的一致性
 */
export interface IAggregateRoot extends IEntity {
  /**
   * 獲取聚合根的版本號，用於樂觀鎖定
   */
  getVersion(): number;

  /**
   * 增加聚合根的版本號
   * 當聚合內的任何實體發生變化時都應該調用此方法
   */
  incrementVersion(): void;

  getId(): string;
  equals(other: IAggregateRoot): boolean;
  toJSON(): object;
} 