import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { MidiNoteId } from '../../domain/value-objects/MidiNoteId';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';

export class AddMidiNoteCommand implements ICommand<MidiNoteId> {
  public readonly type = 'AddMidiNote';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly pitch: number,
    public readonly velocity: number,
    public readonly range: TimeRangeVO,
    public readonly userId: string
  ) {}
} 