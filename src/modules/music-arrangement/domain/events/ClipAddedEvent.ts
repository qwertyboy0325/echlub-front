import { DomainEvent } from '../../../../core/events/DomainEvent';
import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';
import { ClipType } from '../value-objects/ClipType';

/**
 * Clip Added to Track Domain Event
 * Fired when a clip is added to a track
 */
export class ClipAddedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly clipType: ClipType
  ) {
    super('ClipAdded', trackId.toString());
  }

  public get eventData() {
    return {
      trackId: this.trackId.toString(),
      clipId: this.clipId.toString(),
      clipType: this.clipType
    };
  }
} 