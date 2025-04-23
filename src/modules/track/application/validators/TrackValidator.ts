import { injectable } from 'inversify';
import { TrackId } from '../../domain/value-objects/track/TrackId';
import { TrackType } from '../../domain/value-objects/track/TrackType';
import { ClipId } from '../../domain/value-objects/clips/ClipId';
import { MidiNote } from '../../domain/value-objects/note/MidiNote';
import { ValidationResult, ValidationError } from '../../../shared/validation/ValidationResult';

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

  validateAddInputTrackToBus(busTrackId: TrackId, inputTrackId: TrackId): ValidationResult {
    const errors: ValidationError[] = [];

    if (!busTrackId) {
      errors.push(new ValidationError('busTrackId', 'Bus track ID is required'));
    }

    if (!inputTrackId) {
      errors.push(new ValidationError('inputTrackId', 'Input track ID is required'));
    }

    return new ValidationResult(errors);
  }

  validateRemoveInputTrackFromBus(busTrackId: TrackId, inputTrackId: TrackId): ValidationResult {
    return this.validateAddInputTrackToBus(busTrackId, inputTrackId);
  }

  validateAddNoteToClip(clipId: ClipId, note: MidiNote): ValidationResult {
    const errors: string[] = [];

    if (!clipId) {
      errors.push('Clip ID cannot be null');
    }

    if (!note) {
      errors.push('Note cannot be null');
    } else {
      if (note.noteNumber < 0 || note.noteNumber > 127) {
        errors.push('Note number must be between 0 and 127');
      }
      if (note.velocity < 0 || note.velocity > 127) {
        errors.push('Velocity must be between 0 and 127');
      }
      if (note.startTime < 0) {
        errors.push('Start time cannot be negative');
      }
      if (note.duration <= 0) {
        errors.push('Duration must be positive');
      }
    }

    return new ValidationResult(errors.map(message => new ValidationError('note', message)));
  }

  validateUpdateNoteInClip(clipId: ClipId, noteIndex: number, note: MidiNote): ValidationResult {
    const errors: string[] = [];

    if (!clipId) {
      errors.push('Clip ID cannot be null');
    }

    if (noteIndex < 0) {
      errors.push('Note index cannot be negative');
    }

    if (!note) {
      errors.push('Note cannot be null');
    } else {
      if (note.noteNumber < 0 || note.noteNumber > 127) {
        errors.push('Note number must be between 0 and 127');
      }
      if (note.velocity < 0 || note.velocity > 127) {
        errors.push('Velocity must be between 0 and 127');
      }
      if (note.startTime < 0) {
        errors.push('Start time cannot be negative');
      }
      if (note.duration <= 0) {
        errors.push('Duration must be positive');
      }
    }

    return new ValidationResult(errors.map(message => new ValidationError('note', message)));
  }

  validateRemoveNoteFromClip(clipId: ClipId, noteIndex: number): ValidationResult {
    const errors: string[] = [];

    if (!clipId) {
      errors.push('Clip ID cannot be null');
    }

    if (noteIndex < 0) {
      errors.push('Note index cannot be negative');
    }

    return new ValidationResult(errors.map(message => new ValidationError('noteIndex', message)));
  }
} 