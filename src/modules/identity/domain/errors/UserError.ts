/**
 * 用戶驗證錯誤
 */
export class UserValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join(', '));
    this.name = 'UserValidationError';
  }
}

/**
 * 用戶操作錯誤
 */
export class UserOperationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'UserOperationError';
  }
} 