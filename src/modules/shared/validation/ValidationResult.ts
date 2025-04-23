export class ValidationError {
  constructor(
    public readonly field: string,
    public readonly message: string
  ) {}
}

export class ValidationResult {
  constructor(public readonly errors: ValidationError[] = []) {}

  get isValid(): boolean {
    return this.errors.length === 0;
  }

  addError(field: string, message: string): void {
    this.errors.push(new ValidationError(field, message));
  }

  merge(other: ValidationResult): ValidationResult {
    return new ValidationResult([...this.errors, ...other.errors]);
  }

  static fromError(field: string, message: string): ValidationResult {
    return new ValidationResult([new ValidationError(field, message)]);
  }

  static valid(): ValidationResult {
    return new ValidationResult();
  }
} 