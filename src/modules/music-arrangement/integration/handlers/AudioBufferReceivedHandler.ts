import type { AudioBufferReceivedEvent } from '../events/AudioBufferReceivedEvent';
import type { MusicArrangementService } from '../../application/services/MusicArrangementService';
import { AudioSourceRef } from '../../domain/value-objects/AudioSourceRef';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import { ClipMetadata } from '../../domain/value-objects/ClipMetadata';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackMetadata } from '../../domain/value-objects/TrackMetadata';
import { TrackType } from '../../domain/value-objects/TrackType';

/**
 * Handler for audio buffer received from collaboration BC
 * Creates audio clips from WebRTC audio buffers
 */
export class AudioBufferReceivedHandler {
  constructor(
    private readonly musicArrangementService: MusicArrangementService
  ) {}

  public async handle(event: AudioBufferReceivedEvent): Promise<void> {
    try {
      const { collaboratorId, sessionId, buffer, metadata, trackId } = event.data;

      // Create audio source reference for WebRTC buffer
      const audioSource = AudioSourceRef.webrtcBuffer(
        collaboratorId,
        sessionId,
        buffer,
        {
          duration: metadata.duration,
          sampleRate: metadata.sampleRate,
          channels: metadata.channels
        }
      );

      // Create time range for the audio clip
      const timeRange = new TimeRangeVO(
        metadata.timestamp, // Start time based on when received
        metadata.duration
      );

      // Create clip metadata
      const clipMetadata = ClipMetadata.create(
        `Collaboration Audio - ${collaboratorId}`,
        {
          description: `Received from ${collaboratorId} in session ${sessionId} at ${new Date().toISOString()}`,
          tags: ['collaboration', 'webrtc', collaboratorId]
        }
      );

      // Determine target track
      let targetTrackId: TrackId;
      if (trackId) {
        targetTrackId = TrackId.fromString(trackId);
      } else {
        // Create a new collaboration track if no specific track is specified
        const trackMetadata = TrackMetadata.create(
          `Collaboration Track - ${collaboratorId}`,
          {
            description: `Track for collaboration with ${collaboratorId} in session ${sessionId}`,
            tags: ['collaboration', 'webrtc', collaboratorId]
          }
        );
        
        targetTrackId = await this.musicArrangementService.createTrack(
          collaboratorId as any, // PeerId - assuming collaboratorId can be used as PeerId
          TrackType.audio(),
          trackMetadata
        );
      }

      // Add audio clip to track
      await this.musicArrangementService.createAudioClip(
        targetTrackId,
        timeRange,
        audioSource,
        clipMetadata
      );

      console.log(`Audio buffer from collaborator ${collaboratorId} added to track ${targetTrackId.value}`);
    } catch (error) {
      console.error('Failed to handle audio buffer received event:', error);
      throw error;
    }
  }
} 