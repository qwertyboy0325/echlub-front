import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { MidiNoteId } from '../../domain/value-objects/MidiNoteId';

export class RemoveMidiNoteCommand implements ICommand<void> {
  public readonly type = 'RemoveMidiNote';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId
  ) {}
} 