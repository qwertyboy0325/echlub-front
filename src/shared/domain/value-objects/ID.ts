import { ValueObject } from './ValueObject';

interface IDProps {
  id: string;
}

/**
 * ID 值對象基類
 * 為所有領域模型中的唯一標識提供基礎
 */
export abstract class ID extends ValueObject<IDProps> {
  /**
   * 獲取ID值
   */
  get value(): string {
    return this.props.id;
  }

  /**
   * 檢查ID值是否有效
   * @param id ID字符串
   */
  protected static isValidID(id: string): boolean {
    return id !== null && id !== undefined && id.trim() !== '';
  }

  /**
   * 創建新的ID值對象
   * @param id ID字符串
   * @throws Error 如果ID無效
   */
  constructor(id: string) {
    super({ id });
  }

  /**
   * 驗證ID屬性
   * @param props ID屬性
   * @throws Error 如果ID無效
   */
  protected validateProps(props: IDProps): IDProps {
    // 獲取當前類的構造函數
    const constructor = this.constructor as typeof ID;
    
    if (!props.id || !constructor.isValidID(props.id)) {
      throw new Error('ID不能為空');
    }
    return props;
  }

  /**
   * 核心相等性比較邏輯
   * 兩個ID的值相同則視為相等
   */
  protected equalsCore(other: ID): boolean {
    return this.props.id === other.props.id;
  }

  /**
   * 將ID轉換為字符串
   * @returns ID字符串值
   */
  toString(): string {
    return this.props.id;
  }
}
 