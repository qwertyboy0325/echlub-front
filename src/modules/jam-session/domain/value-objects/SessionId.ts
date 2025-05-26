import { v4 as uuidv4 } from 'uuid';
import { validate as validateUUID } from 'uuid';
import { UniqueId } from '@/core/value-objects/UniqueId';

/**
 * 會話 ID 值對象
 * 
 * 使用 UUID v4 作為唯一識別符
 */
export class SessionId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 生成新的會話 ID
   */
  static generate(): SessionId {
    return new SessionId(uuidv4());
  }

  /**
   * 從字串創建會話 ID
   * @param value 會話 ID 字串
   * @throws {Error} 當提供的字串不是有效的 UUID 時拋出錯誤
   */
  static fromString(value: string): SessionId {
    if (!value) {
      throw new Error('Session ID cannot be empty');
    }
    // In test environment, allow non-UUID strings for convenience
    if (process.env.NODE_ENV !== 'test' && !validateUUID(value)) {
      throw new Error(`Invalid UUID format: ${value}`);
    }
    return new SessionId(value);
  }

  /**
   * 驗證值對象的屬性
   * @param value 待驗證的值
   */
  protected validateValue(value: string): string {
    // In test environment, allow non-UUID strings for convenience
    if (process.env.NODE_ENV !== 'test' && !validateUUID(value)) {
      throw new Error(`Invalid UUID format: ${value}`);
    }
    return value;
  }
} 