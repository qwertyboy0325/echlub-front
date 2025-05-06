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
   * 使用瀏覽器的 crypto.randomUUID
   * @throws Error 如果環境不支持 UUID 生成
   */
  public static generate(): UUID {
    // 僅支持瀏覽器環境
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return new UUID(crypto.randomUUID());
    }
    
    // 如果需要在 Node.js 環境中運行，請使用 UUIDFactory 並注入實際的實現
    throw new Error('當前環境不支持 UUID 生成，請使用 UUIDFactory');
  }

  /**
   * 使用指定的 UUID 生成函數創建 UUID
   * 這樣可以在 Node.js 環境中通過依賴注入提供實現
   * @param generateFn UUID 生成函數
   */
  public static createFromGenerator(generateFn: () => string): UUID {
    const uuid = generateFn();
    if (!UUID.isValidID(uuid)) {
      throw new Error('生成的 UUID 格式無效');
    }
    return new UUID(uuid);
  }
} 