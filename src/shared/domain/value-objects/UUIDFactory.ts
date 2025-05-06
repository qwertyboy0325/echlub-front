import { UUID } from './UUID';

/**
 * UUID 生成器函數類型
 */
export type UUIDGenerator = () => string;

/**
 * UUID 工廠
 * 處理不同環境下的 UUID 生成
 */
export class UUIDFactory {
  private static generator: UUIDGenerator | null = null;

  /**
   * 設置 UUID 生成器
   * @param generator UUID 生成函數
   */
  public static setGenerator(generator: UUIDGenerator): void {
    UUIDFactory.generator = generator;
  }

  /**
   * 創建新的 UUID
   * 首先嘗試使用注入的生成器
   * 如果沒有設置生成器，則嘗試使用瀏覽器的 crypto.randomUUID
   * @throws Error 如果沒有可用的生成器
   */
  public static create(): UUID {
    // 如果有設置生成器，優先使用
    if (UUIDFactory.generator) {
      return UUID.createFromGenerator(UUIDFactory.generator);
    }
    
    // 否則使用內置的 generate 方法
    return UUID.generate();
  }
}

// 在應用程序啟動時初始化 UUIDFactory
// 可以在應用程序的入口點或配置模塊中調用
/**
 * 初始化 UUID 工廠，適配不同的運行環境
 */
export function initUUIDFactory(): void {
  // 檢測當前環境
  if (typeof window !== 'undefined') {
    // 瀏覽器環境
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      UUIDFactory.setGenerator(() => crypto.randomUUID());
    }
  } else {
    // Node.js 環境
    try {
      // 使用動態導入，避免在瀏覽器中出現問題
      // 這僅是示例，實際使用時應在應用程序入口點設置
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { randomUUID } = require('crypto');
      UUIDFactory.setGenerator(randomUUID);
    } catch (e) {
      console.warn('無法導入 Node.js crypto 模塊，UUID 生成可能不可用');
    }
  }
} 