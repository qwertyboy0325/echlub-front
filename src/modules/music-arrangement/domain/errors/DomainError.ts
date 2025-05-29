/**
 * Domain Error for MusicArrangement BC
 * Standardized error handling for domain operations
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, DomainError);
    }
  }

  public static clipNotFound(clipId: string): DomainError {
    return new DomainError('CLIP_NOT_FOUND', `Clip not found: ${clipId}`);
  }

  public static trackNotFound(trackId: string): DomainError {
    return new DomainError('TRACK_NOT_FOUND', `Track not found: ${trackId}`);
  }

  public static midiNoteNotFound(noteId: string): DomainError {
    return new DomainError('MIDI_NOTE_NOT_FOUND', `MIDI note not found: ${noteId}`);
  }

  public static clipOverlap(): DomainError {
    return new DomainError('CLIP_OVERLAP', 'Clips cannot overlap within the same track');
  }

  public static clipTypeMismatch(expectedType: string, actualType: string): DomainError {
    return new DomainError(
      'CLIP_TYPE_MISMATCH', 
      `Expected clip type ${expectedType}, but got ${actualType}`
    );
  }

  public static trackTypeMismatch(operation: string, trackType: string): DomainError {
    return new DomainError(
      'TRACK_TYPE_MISMATCH', 
      `Operation ${operation} is not supported for track type ${trackType}`
    );
  }

  public static invalidClipRange(reason: string): DomainError {
    return new DomainError('INVALID_CLIP_RANGE', `Invalid clip range: ${reason}`);
  }

  public static invalidMidiPitch(pitch: number): DomainError {
    return new DomainError(
      'INVALID_MIDI_PITCH', 
      `MIDI pitch must be between 0 and 127, got ${pitch}`
    );
  }

  public static invalidMidiVelocity(velocity: number): DomainError {
    return new DomainError(
      'INVALID_MIDI_VELOCITY', 
      `MIDI velocity must be between 0 and 127, got ${velocity}`
    );
  }

  public static invalidGain(gain: number): DomainError {
    return new DomainError(
      'INVALID_GAIN', 
      `Gain cannot be negative, got ${gain}`
    );
  }

  public static invalidFade(fadeTime: number): DomainError {
    return new DomainError(
      'INVALID_FADE', 
      `Fade time cannot be negative, got ${fadeTime}`
    );
  }

  public static noteOutsideClipRange(): DomainError {
    return new DomainError(
      'NOTE_OUTSIDE_CLIP_RANGE', 
      'MIDI note must be within clip time range'
    );
  }

  public static noteOverlap(): DomainError {
    return new DomainError(
      'NOTE_OVERLAP', 
      'MIDI notes with same pitch cannot overlap'
    );
  }

  public static operationNotPermitted(operation: string, reason?: string): DomainError {
    const message = reason 
      ? `Operation ${operation} not permitted: ${reason}`
      : `Operation ${operation} not permitted`;
    return new DomainError('OPERATION_NOT_PERMITTED', message);
  }

  public static invalidBpm(bpm: number): DomainError {
    return new DomainError(
      'INVALID_BPM', 
      `BPM must be between 30 and 300, got ${bpm}`
    );
  }

  public static invalidTimeRange(start: number, length: number): DomainError {
    return new DomainError(
      'INVALID_TIME_RANGE', 
      `Invalid time range: start=${start}, length=${length}. Start must be >= 0 and length must be > 0`
    );
  }
} 