/**
 * 驗證結果類
 */
export class ValidationResult {
  constructor(
    private readonly _isValid: boolean,
    private readonly _errors: string[]
  ) {}

  get isValid(): boolean {
    return this._isValid;
  }

  get errors(): string[] {
    return this._errors;
  }

  get errorMessage(): string {
    return this._errors.join(', ');
  }
} 
