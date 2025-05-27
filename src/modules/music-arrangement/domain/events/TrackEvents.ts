import { DomainEvent } from '../../../../core/events/DomainEvent';
import { TrackId } from '../value-objects/TrackId';
import { TrackType } from '../value-objects/TrackType';
import { TrackMetadata } from '../value-objects/TrackMetadata';
import { ClipId } from '../value-objects/ClipId';
import { ClipType } from '../value-objects/ClipType';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';

// Import PeerId from collaboration module (placeholder for now)
export interface PeerId {
  toString(): string;
  equals(other: PeerId): boolean;
}

/**
 * Track Created Event
 * Raised when a new track is created
 */
export class TrackCreatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly ownerId: PeerId,
    public readonly trackType: TrackType
  ) {
    super('TrackCreated', trackId.toString());
  }
}

/**
 * Clip Added to Track Event
 * Raised when a clip is added to a track
 */
export class ClipAddedToTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly clipType: ClipType
  ) {
    super('ClipAddedToTrack', trackId.toString());
  }
}

/**
 * Clip Removed from Track Event
 * Raised when a clip is removed from a track
 */
export class ClipRemovedFromTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly clipType: ClipType
  ) {
    super('ClipRemovedFromTrack', trackId.toString());
  }
}

/**
 * Clip Moved in Track Event
 * Raised when a clip is moved within a track
 */
export class ClipMovedInTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly oldRange: TimeRangeVO,
    public readonly newRange: TimeRangeVO
  ) {
    super('ClipMovedInTrack', trackId.toString());
  }
}

/**
 * Track Metadata Updated Event
 * Raised when track metadata is updated
 */
export class TrackMetadataUpdatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly metadata: TrackMetadata
  ) {
    super('TrackMetadataUpdated', trackId.toString());
  }
} 