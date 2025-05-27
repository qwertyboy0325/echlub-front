import { DomainEvent } from '../../../../../core/events/DomainEvent';
import { TrackId } from '../../value-objects/TrackId';
import { ClipId } from '../../value-objects/ClipId';
import { PeerId } from '../../aggregates/Track';

export interface ClipOperation {
  type: 'ADD' | 'REMOVE' | 'MOVE' | 'UPDATE';
  clipId: ClipId;
  data?: any;
  timestamp: Date;
}

/**
 * Music Clip Operation Integration Event
 * Published for cross-BC collaboration
 */
export class MusicClipOperationEvent extends DomainEvent {
  constructor(
    public readonly operation: ClipOperation,
    public readonly trackId: TrackId,
    public readonly peerId: PeerId
  ) {
    super('music.clip-operation', trackId.toString());
  }

  public get eventData() {
    return {
      operation: {
        type: this.operation.type,
        clipId: this.operation.clipId.toString(),
        data: this.operation.data,
        timestamp: this.operation.timestamp.toISOString()
      },
      trackId: this.trackId.toString(),
      peerId: this.peerId.toString()
    };
  }
} 