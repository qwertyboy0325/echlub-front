import { injectable } from 'inversify';
import { ClipId } from '../../domain/value-objects/ClipId';
import type { TimeSignature } from '../../domain/entities/MidiClip';

export interface ClipUpdates {
  startTime?: number;
  duration?: number;
  gain?: number;
  offset?: number;
  notes?: Array<{
    id: string;
    startTime: number;
    duration: number;
    pitch: number;
    velocity: number;
  }>;
}

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
}

@injectable()
export class ClipValidator {
  validateCreateAudioClip(
    sampleId: string,
    startTime: number,
    duration: number,
    offset: number
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (!sampleId) {
      errors.push(new ValidationError('sampleId', 'Sample ID is required'));
    }

    if (startTime < 0) {
      errors.push(new ValidationError('startTime', 'Start time cannot be negative'));
    }

    if (duration <= 0) {
      errors.push(new ValidationError('duration', 'Duration must be positive'));
    }

    if (offset < 0) {
      errors.push(new ValidationError('offset', 'Offset cannot be negative'));
    }

    if (offset > duration) {
      errors.push(new ValidationError('offset', 'Offset cannot be greater than duration'));
    }

    return new ValidationResult(errors);
  }

  validateCreateMidiClip(
    startTime: number,
    duration: number,
    timeSignature?: TimeSignature
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (startTime < 0) {
      errors.push(new ValidationError('startTime', 'Start time cannot be negative'));
    }

    if (duration <= 0) {
      errors.push(new ValidationError('duration', 'Duration must be positive'));
    }

    if (timeSignature) {
      if (timeSignature.numerator <= 0) {
        errors.push(new ValidationError('timeSignature.numerator', 'Time signature numerator must be positive'));
      }
      if (timeSignature.denominator <= 0) {
        errors.push(new ValidationError('timeSignature.denominator', 'Time signature denominator must be positive'));
      }
    }

    return new ValidationResult(errors);
  }

  validateUpdateClip(clipId: ClipId, updates: ClipUpdates): ValidationResult {
    const errors: ValidationError[] = [];

    if (!clipId) {
      errors.push(new ValidationError('clipId', 'Clip ID is required'));
    }

    if (updates.startTime !== undefined && updates.startTime < 0) {
      errors.push(new ValidationError('startTime', 'Start time cannot be negative'));
    }

    if (updates.duration !== undefined && updates.duration <= 0) {
      errors.push(new ValidationError('duration', 'Duration must be positive'));
    }

    if (updates.gain !== undefined && updates.gain < 0) {
      errors.push(new ValidationError('gain', 'Gain cannot be negative'));
    }

    if (updates.offset !== undefined && updates.offset < 0) {
      errors.push(new ValidationError('offset', 'Offset cannot be negative'));
    }

    if (updates.notes) {
      updates.notes.forEach((note, index) => {
        if (note.startTime < 0) {
          errors.push(new ValidationError(`notes[${index}].startTime`, 'Note start time cannot be negative'));
        }
        if (note.duration <= 0) {
          errors.push(new ValidationError(`notes[${index}].duration`, 'Note duration must be positive'));
        }
        if (note.pitch < 0 || note.pitch > 127) {
          errors.push(new ValidationError(`notes[${index}].pitch`, 'Note pitch must be between 0 and 127'));
        }
        if (note.velocity < 0 || note.velocity > 127) {
          errors.push(new ValidationError(`notes[${index}].velocity`, 'Note velocity must be between 0 and 127'));
        }
      });
    }

    return new ValidationResult(errors);
  }

  validateDeleteClip(clipId: ClipId): ValidationResult {
    const errors: ValidationError[] = [];

    if (!clipId) {
      errors.push(new ValidationError('clipId', 'Clip ID is required'));
    }

    return new ValidationResult(errors);
  }
} 