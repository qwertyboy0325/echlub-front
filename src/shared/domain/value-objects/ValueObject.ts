/**
 * 值對象基類
 * 所有領域值對象都應繼承此類
 * 
 * 值對象特性：
 * 1. 不可變性 - 創建後不能修改
 * 2. 相等性由屬性值決定，而非引用
 * 3. 無副作用
 * 4. 自包含
 */
export abstract class ValueObject<T> {
  /**
   * 這是值對象的屬性，在構造函數中初始化後不能修改
   * readonly 修飾符確保屬性不可變
   */
  protected readonly props: T;

  /**
   * 構造函數
   * @param props 值對象的屬性
   */
  constructor(props: T) {
    this.props = this.validateProps(props);
    
    // 凍結對象以防止修改
    Object.freeze(this);
    Object.freeze(this.props);
  }

  /**
   * 驗證值對象的屬性
   * 子類應重寫此方法以添加特定驗證
   * @param props 待驗證的屬性
   * @returns 驗證後的屬性
   */
  protected validateProps(props: T): T {
    return props;
  }

  /**
   * 比較兩個值對象是否相等
   * 相等性由值決定，而非引用
   * @param other 另一個值對象
   * @returns 是否相等
   */
  public equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor.name !== this.constructor.name) {
      return false;
    }
    return this.equalsCore(other);
  }

  /**
   * 子類需要實現的核心相等性比較邏輯
   * @param other 另一個值對象
   * @returns 是否相等
   */
  protected abstract equalsCore(other: ValueObject<T>): boolean;

  /**
   * 將值對象轉換為 JSON 可序列化的格式
   * 子類可以覆蓋此方法以定制序列化行為
   * @returns 可序列化的對象
   */
  public toJSON(): unknown {
    return {
      ...this.props as object
    };
  }

  /**
   * 將值對象轉換為字符串表示
   * 如果子類需要特殊的字符串表示，應重寫此方法
   * @returns 字符串表示
   */
  public toString(): string {
    return JSON.stringify(this.toJSON());
  }
} 