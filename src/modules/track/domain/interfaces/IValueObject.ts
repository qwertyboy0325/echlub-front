/**
 * 表示值物件的介面
 * 值物件是通過其屬性值來定義的對象，兩個值物件如果所有屬性值都相同，則被視為相等
 */
export interface IValueObject {
  /**
   * 檢查兩個值物件是否相等
   * @param other 要比較的另一個值物件
   */
  equals(other: IValueObject): boolean;

  /**
   * 將值物件轉換為純 JavaScript 對象
   */
  toJSON(): object;

  /**
   * 獲取值物件的字符串表示
   */
  toString(): string;
} 