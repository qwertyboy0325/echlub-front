export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class UserValidationError extends UserError {
  constructor(public readonly errors: string[]) {
    super('用戶驗證失敗');
    this.name = 'UserValidationError';
  }
}

export class UserOperationError extends UserError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'UserOperationError';
  }
} 