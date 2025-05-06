import { ID } from './ID';

/**
 * UUID 值對象
 * 使用標準 UUID 格式的唯一標識符
 */
export class UUID extends ID {
  /**
   * UUID 正則表達式
   * 用於驗證 UUID 格式的字符串
   */
  private static readonly UUID_REGEX = 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * 檢查是否為有效的 UUID
   * @param id UUID 字符串
   */
  protected static isValidID(id: string): boolean {
    return super.isValidID(id) && UUID.UUID_REGEX.test(id);
  }

  /**
   * 創建新的 UUID 值對象
   * @param id UUID 字符串
   * @throws Error 如果 UUID 格式無效
   */
  constructor(id: string) {
    super(id);
  }

  /**
   * 生成一個新的 UUID
   * 使用瀏覽器的 crypto.randomUUID 或 node.js 的 crypto.randomUUID
   * @throws Error 如果環境不支持 UUID 生成
   */
  public static generate(): UUID {
    let uuid: string;

    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      // 瀏覽器環境
      uuid = crypto.randomUUID();
    } else {
      try {
        // Node.js 環境
        const nodeCrypto = require('crypto');
        uuid = nodeCrypto.randomUUID();
      } catch (e) {
        throw new Error('當前環境不支持 UUID 生成');
      }
    }

    return new UUID(uuid);
  }
} 