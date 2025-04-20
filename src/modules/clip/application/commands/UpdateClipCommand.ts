import { ClipId } from '../../domain/value-objects/ClipId';

export interface MidiNoteUpdate {
  id: string;
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
}

export interface ClipUpdates {
  startTime?: number;
  duration?: number;
  gain?: number;
  offset?: number;
  notes?: MidiNoteUpdate[];
}

export class UpdateClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly updates: ClipUpdates
  ) {
    if (updates.startTime !== undefined && updates.startTime < 0) {
      throw new Error('Start time cannot be negative');
    }
    if (updates.duration !== undefined && updates.duration <= 0) {
      throw new Error('Duration must be positive');
    }
    if (updates.gain !== undefined && updates.gain < 0) {
      throw new Error('Gain cannot be negative');
    }
    if (updates.offset !== undefined && updates.offset < 0) {
      throw new Error('Offset cannot be negative');
    }
    if (updates.notes) {
      for (const note of updates.notes) {
        if (note.startTime < 0) throw new Error('Note start time cannot be negative');
        if (note.duration <= 0) throw new Error('Note duration must be positive');
        if (note.pitch < 0 || note.pitch > 127) throw new Error('Note pitch must be between 0 and 127');
        if (note.velocity < 0 || note.velocity > 127) throw new Error('Note velocity must be between 0 and 127');
      }
    }
  }
} 