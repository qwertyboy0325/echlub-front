import { IntegrationEvent } from '../../../../core/events/IntegrationEvent';

export interface AudioBufferReceivedEventData {
  collaboratorId: string;
  sessionId: string;
  buffer: ArrayBuffer;
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
    timestamp: number;
  };
  trackId?: string; // Optional target track
}

/**
 * Integration Event: Audio buffer received from collaboration BC
 * Triggered when WebRTC audio data is received from a collaborator
 */
export class AudioBufferReceivedEvent extends IntegrationEvent {
  public static readonly EVENT_NAME = 'music-arrangement.audio-buffer-received';
  public readonly data: AudioBufferReceivedEventData;

  constructor(data: AudioBufferReceivedEventData) {
    super();
    this.data = data;
  }

  get eventType(): string {
    return AudioBufferReceivedEvent.EVENT_NAME;
  }

  public static create(
    collaboratorId: string,
    sessionId: string,
    buffer: ArrayBuffer,
    metadata: {
      duration: number;
      sampleRate: number;
      channels: number;
      timestamp: number;
    },
    trackId?: string
  ): AudioBufferReceivedEvent {
    return new AudioBufferReceivedEvent({
      collaboratorId,
      sessionId,
      buffer,
      metadata,
      trackId
    });
  }
} 