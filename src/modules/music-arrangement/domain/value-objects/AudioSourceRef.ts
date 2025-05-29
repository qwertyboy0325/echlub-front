import { ValueObject } from '../../../../core/value-objects/ValueObject';

export enum AudioSourceType {
  SAMPLE = 'sample',
  RECORDING = 'recording',
  WEBRTC_BUFFER = 'webrtc_buffer'
}

export enum AudioSourceStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  ERROR = 'error'
}

export interface AudioSourceRefProps {
  type: AudioSourceType;
  sourceId: string;
  status: AudioSourceStatus;
  url?: string;
  buffer?: ArrayBuffer; // For WebRTC audio buffers
  metadata?: {
    duration?: number;
    sampleRate?: number;
    channels?: number;
    collaboratorId?: string; // For WebRTC sources
    sessionId?: string; // For WebRTC sources
  };
}

/**
 * Audio source reference value object
 * References audio sources (samples, recordings) with their status
 */
export class AudioSourceRef extends ValueObject<AudioSourceRefProps> {
  constructor(props: AudioSourceRefProps) {
    super(props);
  }

  public static sample(sampleId: string, url?: string): AudioSourceRef {
    return new AudioSourceRef({
      type: AudioSourceType.SAMPLE,
      sourceId: sampleId,
      status: AudioSourceStatus.PENDING,
      url
    });
  }

  public static recording(recordingId: string, url?: string): AudioSourceRef {
    return new AudioSourceRef({
      type: AudioSourceType.RECORDING,
      sourceId: recordingId,
      status: AudioSourceStatus.PENDING,
      url
    });
  }

  public static webrtcBuffer(
    collaboratorId: string, 
    sessionId: string, 
    buffer: ArrayBuffer,
    metadata?: { duration?: number; sampleRate?: number; channels?: number }
  ): AudioSourceRef {
    return new AudioSourceRef({
      type: AudioSourceType.WEBRTC_BUFFER,
      sourceId: `${sessionId}-${collaboratorId}-${Date.now()}`,
      status: AudioSourceStatus.SYNCED,
      buffer,
      metadata: {
        ...metadata,
        collaboratorId,
        sessionId
      }
    });
  }

  protected validateProps(props: AudioSourceRefProps): AudioSourceRefProps {
    if (!props.sourceId || props.sourceId.trim() === '') {
      throw new Error('Source ID cannot be empty');
    }
    if (!Object.values(AudioSourceType).includes(props.type)) {
      throw new Error(`Invalid audio source type: ${props.type}`);
    }
    if (!Object.values(AudioSourceStatus).includes(props.status)) {
      throw new Error(`Invalid audio source status: ${props.status}`);
    }
    return props;
  }

  protected equalsCore(other: AudioSourceRef): boolean {
    return this.props.type === other.props.type &&
           this.props.sourceId === other.props.sourceId &&
           this.props.status === other.props.status &&
           this.props.url === other.props.url &&
           this.props.buffer === other.props.buffer;
  }

  // Business methods
  public isSynced(): boolean {
    return this.props.status === AudioSourceStatus.SYNCED;
  }

  public isPending(): boolean {
    return this.props.status === AudioSourceStatus.PENDING;
  }

  public hasError(): boolean {
    return this.props.status === AudioSourceStatus.ERROR;
  }

  public withStatus(status: AudioSourceStatus): AudioSourceRef {
    return new AudioSourceRef({ ...this.props, status });
  }

  public withUrl(url: string): AudioSourceRef {
    return new AudioSourceRef({ ...this.props, url });
  }

  public withMetadata(metadata: AudioSourceRefProps['metadata']): AudioSourceRef {
    return new AudioSourceRef({ ...this.props, metadata });
  }

  public withBuffer(buffer: ArrayBuffer): AudioSourceRef {
    return new AudioSourceRef({ ...this.props, buffer });
  }

  // Getters
  public get type(): AudioSourceType {
    return this.props.type;
  }

  public get sourceId(): string {
    return this.props.sourceId;
  }

  public get status(): AudioSourceStatus {
    return this.props.status;
  }

  public get url(): string | undefined {
    return this.props.url;
  }

  public get metadata(): AudioSourceRefProps['metadata'] {
    return this.props.metadata;
  }

  public get duration(): number | undefined {
    return this.props.metadata?.duration;
  }

  public get buffer(): ArrayBuffer | undefined {
    return this.props.buffer;
  }

  public get collaboratorId(): string | undefined {
    return this.props.metadata?.collaboratorId;
  }

  public get sessionId(): string | undefined {
    return this.props.metadata?.sessionId;
  }

  public isWebRTCBuffer(): boolean {
    return this.props.type === AudioSourceType.WEBRTC_BUFFER;
  }
} 