import { DomainEvent } from '../../../../../core/events/DomainEvent';

export interface SampleMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

/**
 * Sample Uploaded Integration Event
 * Received from Upload BC when new audio sources are available
 */
export class SampleUploadedEvent extends DomainEvent {
  constructor(
    public readonly sampleId: string,
    public readonly url: string,
    public readonly metadata: SampleMetadata,
    public readonly uploaderId: string
  ) {
    super('sample.uploaded', sampleId);
  }

  public get eventData() {
    return {
      sampleId: this.sampleId,
      url: this.url,
      metadata: this.metadata,
      uploaderId: this.uploaderId,
      timestamp: this.occurredOn.toISOString()
    };
  }
} 