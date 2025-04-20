import { ValidationError } from '../../application/validators/ClipValidator';

export class ClipValidationError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super('Clip validation failed: ' + errors.map(e => `${e.field}: ${e.message}`).join(', '));
    this.name = 'ClipValidationError';
  }
}

export class ClipOperationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ClipOperationError';
  }
} 