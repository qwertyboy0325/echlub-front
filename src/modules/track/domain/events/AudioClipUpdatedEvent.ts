import { IDomainEvent } from '../interfaces/IDomainEvent';
import { FadeSettings } from '../value-objects/FadeSettings';

export interface AudioClipChanges {
  gain?: number;
  offset?: number;
  fadeIn?: FadeSettings | null;
  fadeOut?: FadeSettings | null;
}

export class AudioClipUpdatedEvent implements IDomainEvent {
  readonly eventType = 'track:clip:audio:updated';
  readonly timestamp = new Date();

  constructor(
    readonly aggregateId: string,
    readonly payload: AudioClipChanges
  ) {}

  getEventName(): string {
    return 'audio:updated';
  }
} 