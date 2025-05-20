import { AggregateRoot } from './AggregateRoot';
import { DomainEvent } from '../events/DomainEvent';

/**
 * 事件溯源聚合根
 * 擴展基本聚合根，增加事件溯源功能
 * 使用事件作為唯一事實來源，透過歷史事件重建狀態
 */
export abstract class EventSourcedAggregateRoot extends AggregateRoot {
  private _version: number = 0;
  
  /**
   * 應用事件以更新聚合根狀態
   * 子類必須實現此方法來處理特定事件類型
   * @param event 要應用的領域事件
   */
  protected abstract applyEvent(event: DomainEvent): void;
  
  /**
   * 從事件歷史重建聚合根狀態
   * @param events 歷史事件列表
   */
  public loadFromHistory(events: DomainEvent[]): void {
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
   * 獲取未提交事件
   * 使用基類中的 getDomainEvents 方法
   */
  public getUncommittedEvents(): DomainEvent[] {
    return this.getDomainEvents();
  }
  
  /**
   * 清除未提交事件
   * 使用基類中的 clearDomainEvents 方法
   */
  public clearUncommittedEvents(): void {
    this.clearDomainEvents();
  }
} 