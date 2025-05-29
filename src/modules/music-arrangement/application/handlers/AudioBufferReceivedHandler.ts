import type { IntegrationEvent } from '../../../../core/events/IntegrationEvent';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { AudioSourceRef } from '../../domain/value-objects/AudioSourceRef';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import { AudioClip } from '../../domain/entities/AudioClip';
import { ClipMetadata } from '../../domain/value-objects/ClipMetadata';

// Define the audio buffer received event structure
interface AudioBufferReceivedEventData {
  trackId: string;
  audioUrl: string;
  duration: number;
  sampleRate: number;
  channels: number;
  startTime?: number;
  fileName?: string;
  buffer?: ArrayBuffer;
  collaboratorId?: string;
  sessionId?: string;
}

export class AudioBufferReceivedHandler {
  constructor(
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(event: IntegrationEvent): Promise<void> {
    try {
      // Type-safe event data extraction
      const eventData = event as unknown as AudioBufferReceivedEventData;
      
      if (!eventData.trackId || !eventData.audioUrl) {
        console.error('Invalid audio buffer event data: missing required fields');
        return;
      }
      
      // Find the track that requested this audio buffer
      const trackId = TrackId.fromString(eventData.trackId);
      const track = await this.trackRepository.loadWithClips(trackId);
      if (!track) {
        console.warn(`Track not found for audio buffer: ${eventData.trackId}`);
        return;
      }

      // Create audio source reference for recording
      const audioSource = AudioSourceRef.recording(
        `recording-${Date.now()}`,
        eventData.audioUrl
      ).withMetadata({
        duration: eventData.duration,
        sampleRate: eventData.sampleRate,
        channels: eventData.channels
      });

      // Create time range for the clip
      const startTime = eventData.startTime || 0;
      const timeRange = new TimeRangeVO(startTime, eventData.duration);

      // Create audio clip with the received buffer
      const clipMetadata = ClipMetadata.create(eventData.fileName || 'Recorded Audio');
      const audioClip = AudioClip.create(
        timeRange,
        audioSource,
        clipMetadata
      );
      
      track.addClip(audioClip);

      await this.trackRepository.saveWithClips(track);

      console.log(`Audio clip created from buffer: ${audioClip.clipId.value}`);
    } catch (error) {
      console.error('Error handling audio buffer received event:', error);
    }
  }
} 