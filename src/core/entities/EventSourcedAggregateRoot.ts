import { AggregateRoot } from './AggregateRoot';
import { DomainEvent } from '../events/DomainEvent';
import { UniqueId } from '../value-objects/UniqueId';

/**
 * 事件溯源聚合根
 * 擴展基本聚合根，增加事件溯源功能
 * 使用事件作為唯一事實來源，透過歷史事件重建狀態
 */
export abstract class EventSourcedAggregateRoot<T extends UniqueId = UniqueId> extends AggregateRoot {
  private _version: number = 0;
  private _snapshotVersion: number = 0;
  
  /**
   * 應用事件以更新聚合根狀態
   * 子類必須實現此方法來處理特定事件類型
   * @param event 要應用的領域事件
   */
  protected abstract applyEvent(event: DomainEvent): void;
  
  /**
   * 從事件歷史重建聚合根狀態
   * @param events 歷史事件列表
   * @param fromVersion 起始版本號
   */
  public loadFromHistory(events: DomainEvent[], fromVersion: number = 0): void {
    if (fromVersion > 0) {
      this._version = fromVersion;
      this._snapshotVersion = fromVersion;
    }
    
    events.forEach(event => {
      this.applyEventInternal(event, false);
      this._version++;
    });
  }
  
  /**
   * 內部方法：應用事件並決定是否添加到未提交事件列表
   * @param event 領域事件
   * @param isNew 是否為新產生的事件
   */
  private applyEventInternal(event: DomainEvent, isNew: boolean): void {
    // 先更新聚合根狀態
    this.applyEvent(event);
    
    // 如果是新事件，添加到未提交事件列表
    if (isNew) {
      this.addDomainEvent(event);
    }
    
    // 更新時間戳
    this.updateTimestamp();
  }
  
  /**
   * 引發事件：產生新事件並應用於聚合根
   * 代替直接修改狀態，子類應該呼叫此方法產生事件
   * @param event 領域事件
   */
  protected raiseEvent(event: DomainEvent): void {
    this.applyEventInternal(event, true);
    this._version++;
  }
  
  /**
   * 獲取當前聚合根版本
   * 每應用一個事件版本號加1
   */
  get version(): number {
    return this._version;
  }
  
  /**
   * 獲取上次快照的版本號
   */
  get snapshotVersion(): number {
    return this._snapshotVersion;
  }
  
  /**
   * 創建狀態快照
   * 更新快照版本號為當前版本
   */
  public createSnapshot(): void {
    this._snapshotVersion = this._version;
  }
  
  /**
   * 獲取未提交事件
   * 使用基類中的 getDomainEvents 方法
   */
  public getUncommittedEvents(): DomainEvent[] {
    return this.getDomainEvents();
  }
  
  /**
   * 獲取自上次快照以來發生的事件數量
   */
  public getEventCountSinceSnapshot(): number {
    return this._version - this._snapshotVersion;
  }
  
  /**
   * 清除未提交事件
   * 使用基類中的 clearDomainEvents 方法
   */
  public clearUncommittedEvents(): void {
    this.clearDomainEvents();
  }
  
  /**
   * 收集並清除領域事件
   * 收集聚合根產生的所有未提交事件，並在返回前清除
   * 這是一個方便的方法，結合了獲取和清除操作
   * @returns 領域事件陣列
   */
  public collectDomainEvents(): DomainEvent[] {
    const events = this.getDomainEvents();
    this.clearDomainEvents();
    return events;
  }
  
  /**
   * 檢查聚合根是否有變更
   * 通過判斷是否有未提交事件來確定
   */
  public hasChanges(): boolean {
    return this.getUncommittedEvents().length > 0;
  }
} 