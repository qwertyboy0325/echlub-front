import { injectable } from 'inversify';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackType } from '../../domain/value-objects/TrackType';

export class ValidationError {
  constructor(
    public readonly field: string,
    public readonly message: string
  ) {}
}

export class ValidationResult {
  constructor(private readonly _errors: ValidationError[] = []) {}

  get isValid(): boolean {
    return this._errors.length === 0;
  }

  get errors(): ValidationError[] {
    return this._errors;
  }
}

@injectable()
export class TrackValidator {
  validateCreateTrack(name: string, type: TrackType): ValidationResult {
    const errors: ValidationError[] = [];

    if (!name) {
      errors.push(new ValidationError('name', 'Name is required'));
    }

    if (!type) {
      errors.push(new ValidationError('type', 'Type is required'));
    }

    return new ValidationResult(errors);
  }

  validateRenameTrack(trackId: TrackId, newName: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!trackId) {
      errors.push(new ValidationError('trackId', 'Track ID is required'));
    }

    if (!newName) {
      errors.push(new ValidationError('newName', 'New name is required'));
    }

    return new ValidationResult(errors);
  }

  validateAddClipToTrack(trackId: TrackId, clipId: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!trackId) {
      errors.push(new ValidationError('trackId', 'Track ID is required'));
    }

    if (!clipId) {
      errors.push(new ValidationError('clipId', 'Clip ID is required'));
    }

    return new ValidationResult(errors);
  }

  validateRemoveClipFromTrack(trackId: TrackId, clipId: string): ValidationResult {
    return this.validateAddClipToTrack(trackId, clipId);
  }

  validateChangeTrackRouting(trackId: TrackId, routing: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!trackId) {
      errors.push(new ValidationError('trackId', 'Track ID is required'));
    }

    if (!routing) {
      errors.push(new ValidationError('routing', 'Routing is required'));
    }

    return new ValidationResult(errors);
  }

  validateAddPluginToTrack(trackId: TrackId, pluginId: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!trackId) {
      errors.push(new ValidationError('trackId', 'Track ID is required'));
    }

    if (!pluginId) {
      errors.push(new ValidationError('pluginId', 'Plugin ID is required'));
    }

    return new ValidationResult(errors);
  }

  validateRemovePluginFromTrack(trackId: TrackId, pluginId: string): ValidationResult {
    return this.validateAddPluginToTrack(trackId, pluginId);
  }
} 