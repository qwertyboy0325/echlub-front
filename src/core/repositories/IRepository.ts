import { AggregateRoot } from '../entities/AggregateRoot';
import { UniqueId } from '../value-objects/UniqueId';

/**
 * 通用存儲庫介面
 * 提供對聚合根的基本CRUD操作
 * @template T 聚合根類型
 * @template ID 聚合根ID類型
 */
export interface IRepository<T extends AggregateRoot, ID extends UniqueId> {
  /**
   * 根據ID獲取聚合根
   * @param id 聚合根ID
   */
  findById(id: ID): Promise<T | null>;
  
  /**
   * 保存或更新聚合根
   * @param aggregate 聚合根實例
   */
  save(aggregate: T): Promise<void>;
  
  /**
   * 刪除聚合根
   * @param id 聚合根ID
   */
  delete(id: ID): Promise<void>;
  
  /**
   * 檢查聚合根是否存在
   * @param id 聚合根ID
   */
  exists(id: ID): Promise<boolean>;
}

/**
 * 事件溯源存儲庫介面
 * 擴展基本存儲庫，增加事件溯源相關功能
 * @template T 聚合根類型
 * @template ID 聚合根ID類型
 */
export interface IEventSourcedRepository<T extends AggregateRoot, ID extends UniqueId> extends IRepository<T, ID> {
  /**
   * 獲取指定聚合根的事件流
   * @param id 聚合根ID
   * @param fromVersion 起始版本，默認為0
   */
  getEventStream(id: ID, fromVersion?: number): Promise<any[]>;
  
  /**
   * 儲存聚合根並發布事件
   * @param aggregate 聚合根實例
   */
  saveWithEvents(aggregate: T): Promise<void>;
  
  /**
   * 獲取最新快照
   * @param id 聚合根ID
   */
  getLatestSnapshot(id: ID): Promise<{ aggregate: T; version: number } | null>;
  
  /**
   * 儲存快照
   * @param aggregate 聚合根實例
   * @param version 版本號
   */
  saveSnapshot(aggregate: T, version: number): Promise<void>;
} 