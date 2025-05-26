/**
 * 領域錯誤基類
 * 所有領域相關錯誤都應繼承此類
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // 修復 TypeScript 中 Error 子類的堆疊跟踪問題
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 驗證錯誤
 * 當領域對象驗證失敗時拋出
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 業務規則錯誤
 * 當違反領域業務規則時拋出
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 實體未找到錯誤
 * 當請求的實體不存在時拋出
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id?: string) {
    super(`${entityName}${id ? ` with ID ${id}` : ''} not found`);
  }
}

/**
 * 並發錯誤
 * 當發生並發衝突時拋出
 */
export class ConcurrencyError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 未授權錯誤
 * 當操作未被授權時拋出
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string) {
    super(message);
  }
} 