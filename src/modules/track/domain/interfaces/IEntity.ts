/**
 * 表示領域實體的介面
 * 實體是具有唯一標識符的對象，即使其他屬性相同，只要ID不同就被視為不同的對象
 */
export interface IEntity {
  /**
   * 獲取實體的唯一標識符
   */
  getId(): string;

  /**
   * 檢查兩個實體是否相等
   * @param other 要比較的另一個實體
   */
  equals(other: IEntity): boolean;

  /**
   * 獲取實體的版本號，用於樂觀鎖定
   */
  getVersion(): number;

  /**
   * 增加實體的版本號
   */
  incrementVersion(): void;

  /**
   * 將實體轉換為純 JavaScript 對象
   */
  toJSON(): object;
} 