export interface ValidationError {
  message: string;
}

export class ValidationResult {
  private readonly _errors: ValidationError[];

  constructor(errors: string[] = []) {
    this._errors = errors.map(message => ({ message }));
  }

  get isValid(): boolean {
    return this._errors.length === 0;
  }

  get errors(): ValidationError[] {
    return [...this._errors];
  }
} 