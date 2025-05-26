import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 音軌創建事件
 */
export class TrackCreatedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly trackId: string,
    public readonly playerId: string
  ) {
    super(JamEventTypes.TRACK_CREATED, sessionId);
  }
} 