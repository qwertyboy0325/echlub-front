import { AggregateRoot } from '../entities/AggregateRoot';
import { UniqueId } from '../value-objects/UniqueId';

/**
 * 工廠介面
 * 定義所有工廠的公共行為
 * @template T 產品類型
 * @template P 創建參數類型
 */
export interface IFactory<T, P> {
  /**
   * 創建新實例
   * @param props 創建所需參數
   */
  create(props: P): T;
}

/**
 * 聚合根工廠抽象類
 * 為聚合根的創建提供標準化方法
 * @template T 聚合根類型
 * @template ID 聚合根ID類型
 * @template P 創建參數類型
 */
export abstract class AggregateFactory<
  T extends AggregateRoot,
  ID extends UniqueId,
  P
> implements IFactory<T, P> {
  /**
   * 創建標識符的方法
   * 子類需要實現此方法或使用依賴注入提供
   */
  protected abstract createId(): ID;
  
  /**
   * 創建聚合根實例
   * 使用模板方法模式定義通用創建流程
   * @param props 創建參數
   */
  create(props: P): T {
    // 1. 創建唯一標識符
    const id = this.createId();
    
    // 2. 驗證創建參數
    this.validateProps(props);
    
    // 3. 調用子類提供的實際創建方法
    const aggregate = this.createAggregate(id, props);
    
    // 4. 執行創建後的處理
    this.afterCreate(aggregate);
    
    return aggregate;
  }
  
  /**
   * 驗證創建參數
   * 子類可以覆蓋此方法提供更具體的驗證
   * @param props 創建參數
   */
  protected validateProps(props: P): void {
    // 默認實現不做任何驗證
  }
  
  /**
   * 實際創建聚合根的方法
   * 子類必須實現此方法
   * @param id 聚合根ID
   * @param props 創建參數
   */
  protected abstract createAggregate(id: ID, props: P): T;
  
  /**
   * 創建後處理
   * 子類可以覆蓋此方法提供額外的邏輯
   * @param aggregate 創建的聚合根
   */
  protected afterCreate(aggregate: T): void {
    // 默認實現不做任何處理
  }
} 