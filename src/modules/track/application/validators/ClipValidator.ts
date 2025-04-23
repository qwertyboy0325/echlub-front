import { ClipId } from '../../domain/value-objects/clips/ClipId';
import { TimeSignature } from '../../domain/entities/clips/MidiClip';
import { ValidationResult } from '../../domain/value-objects/ValidationResult';

export class ClipValidator {
  validateCreateAudioClip(sampleId: string, startTime: number, duration: number, offset: number): ValidationResult {
    const errors: string[] = [];

    if (!sampleId) {
      errors.push('Sample ID cannot be empty');
    }

    if (startTime < 0) {
      errors.push('Start time cannot be negative');
    }

    if (duration <= 0) {
      errors.push('Duration must be positive');
    }

    if (offset < 0) {
      errors.push('Offset cannot be negative');
    }

    return new ValidationResult(errors);
  }

  validateCreateMidiClip(startTime: number, duration: number, timeSignature: TimeSignature): ValidationResult {
    const errors: string[] = [];

    if (startTime < 0) {
      errors.push('Start time cannot be negative');
    }

    if (duration <= 0) {
      errors.push('Duration must be positive');
    }

    if (timeSignature.numerator < 1) {
      errors.push('Time signature numerator must be positive');
    }

    if (!this.isPowerOfTwo(timeSignature.denominator)) {
      errors.push('Time signature denominator must be a power of 2');
    }

    return new ValidationResult(errors);
  }

  validateUpdateClip(clipId: ClipId, updates: { startTime?: number; duration?: number; gain?: number }): ValidationResult {
    const errors: string[] = [];

    if (!clipId) {
      errors.push('Invalid clip ID');
    }

    if (updates.startTime !== undefined && updates.startTime < 0) {
      errors.push('Start time cannot be negative');
    }

    if (updates.duration !== undefined && updates.duration <= 0) {
      errors.push('Duration must be positive');
    }

    if (updates.gain !== undefined && (updates.gain < 0 || updates.gain > 1)) {
      errors.push('Gain must be between 0 and 1');
    }

    return new ValidationResult(errors);
  }

  validateDeleteClip(clipId: ClipId): ValidationResult {
    const errors: string[] = [];

    if (!clipId) {
      errors.push('Invalid clip ID');
    }

    return new ValidationResult(errors);
  }

  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }
} 