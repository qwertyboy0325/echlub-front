import { injectable, inject } from 'inversify';
import type { IMediator } from '../../../../core/mediator/IMediator';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

// Commands
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { CreateAudioClipCommand } from '../commands/CreateAudioClipCommand';
import { CreateMidiClipCommand } from '../commands/CreateMidiClipCommand';
import { AddMidiNoteCommand } from '../commands/AddMidiNoteCommand';
import { QuantizeMidiClipCommand } from '../commands/QuantizeMidiClipCommand';
import { TransposeMidiClipCommand } from '../commands/TransposeMidiClipCommand';

// Queries
import { GetTrackByIdQuery } from '../queries/GetTrackByIdQuery';
import { GetTrackWithClipsQuery } from '../queries/GetTrackWithClipsQuery';

// Domain types for internal conversion
import { TrackId } from '../../domain/value-objects/TrackId';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackType } from '../../domain/value-objects/TrackType';
import { TrackMetadata } from '../../domain/value-objects/TrackMetadata';
import { ClipMetadata } from '../../domain/value-objects/ClipMetadata';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import { AudioSourceRef } from '../../domain/value-objects/AudioSourceRef';
import { InstrumentRef } from '../../domain/value-objects/InstrumentRef';
import { QuantizeValue } from '../../domain/value-objects/QuantizeValue';
import { DomainError } from '../../domain/errors/DomainError';

// Domain types for return values
import type { Track } from '../../domain/aggregates/Track';

// ✅ DTOs for Clean Architecture compliance
export interface TrackInfoDTO {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  clipCount: number;
}

export interface ClipInfoDTO {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface TimeRangeDTO {
  startTime: number;
  endTime: number;
}

export interface InstrumentDTO {
  type: string;
  name: string;
}

export interface SystemStatsDTO {
  trackCount: number;
  clipCount: number;
  eventCount: number;
}

export interface TrackStatusDTO {
  name: string;
  clipCount: number;
}

export interface DebugInfoDTO {
  eventCount: number;
  recentEvents: Array<{ type: string; timestamp: Date }>;
  version: number;
}

export interface ValidationResultDTO {
  valid: boolean;
  errors: string[];
}

/**
 * ✅ Clean Architecture Compliant Music Arrangement Service with Command Pattern
 * 
 * This service is the ONLY entry point for users to interact with the Music Arrangement BC.
 * It accepts only simple data types (strings, numbers, plain objects) and returns DTOs.
 * All operations go through the Command/Query pattern via Mediator.
 * Domain objects are never exposed to the outside world.
 */
@injectable()
export class MusicArrangementService {
  constructor(
    @inject(MusicArrangementTypes.MusicArrangementMediator)
    private readonly mediator: IMediator
  ) {}

  // ✅ Track Operations - Clean API with Command Pattern
  async createTrack(
    ownerId: string,
    type: string,
    name: string
  ): Promise<string> {
    try {
      const trackType = TrackType.fromString(type);
      const metadata = TrackMetadata.create(name);
      
      const command = new CreateTrackCommand(ownerId, trackType, metadata);
      const trackId = await this.mediator.send(command) as TrackId;
      
      return trackId.toString();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async getTrackInfo(trackId: string): Promise<TrackInfoDTO | null> {
    try {
      const query = new GetTrackByIdQuery(TrackId.fromString(trackId));
      const track = await this.mediator.query(query) as Track | null;
      
      if (!track) {
        return null;
      }

      return {
        id: track.trackId.toString(),
        name: track.metadata.name,
        type: track.trackType.toString(),
        ownerId: track.ownerId.toString(),
        clipCount: track.clips.size
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async deleteTrack(trackId: string): Promise<void> {
    try {
      // Note: DeleteTrackCommand would need to be implemented
      // For now, we'll throw an error indicating this needs implementation
      throw new Error('DELETE_TRACK_NOT_IMPLEMENTED: Delete track command not yet implemented');
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  // ✅ Clip Operations - Clean API with Command Pattern
  async createAudioClip(
    trackId: string,
    timeRange: TimeRangeDTO,
    audioSource: { url: string; name: string },
    name: string
  ): Promise<string> {
    try {
      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime);
      const audioSourceRef = AudioSourceRef.sample(audioSource.name, audioSource.url);
      const metadata = ClipMetadata.create(name);
      
      const command = new CreateAudioClipCommand(
        TrackId.fromString(trackId),
        range,
        audioSourceRef,
        metadata
      );
      
      const clipId = await this.mediator.send(command) as ClipId;
      return clipId.toString();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async createMidiClip(
    trackId: string,
    timeRange: TimeRangeDTO,
    instrument: InstrumentDTO,
    name: string
  ): Promise<string> {
    try {
      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime);
      const instrumentRef = InstrumentRef.synth(instrument.type, instrument.name);
      const metadata = ClipMetadata.create(name);
      
      const command = new CreateMidiClipCommand(
        TrackId.fromString(trackId),
        range,
        instrumentRef,
        metadata
      );
      
      const clipId = await this.mediator.send(command);
      return clipId.toString();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async getClipsInTrack(trackId: string): Promise<ClipInfoDTO[]> {
    try {
      const query = new GetTrackWithClipsQuery(TrackId.fromString(trackId));
      const track = await this.mediator.query(query);
      
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      return Array.from(track.clips.values()).map(clip => ({
        id: clip.clipId.toString(),
        name: clip.metadata.name,
        type: clip.getType().toString(),
        startTime: clip.range.startTime,
        endTime: clip.range.endTime,
        duration: clip.range.duration
      }));
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  // ✅ MIDI Operations - Clean API with Command Pattern
  async addMidiNote(
    trackId: string,
    clipId: string,
    pitch: number,
    velocity: number,
    timeRange: TimeRangeDTO
  ): Promise<string> {
    try {
      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime);
      
      const command = new AddMidiNoteCommand(
        TrackId.fromString(trackId),
        ClipId.fromString(clipId),
        pitch,
        velocity,
        range
      );
      
      const noteId = await this.mediator.send(command);
      return noteId.toString();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async quantizeMidiClip(
    trackId: string,
    clipId: string,
    quantizeValue: string
  ): Promise<void> {
    try {
      const quantize = QuantizeValue.fromString(quantizeValue);
      
      const command = new QuantizeMidiClipCommand(
        TrackId.fromString(trackId),
        ClipId.fromString(clipId),
        quantize
      );
      
      await this.mediator.send(command);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async transposeMidiClip(
    trackId: string,
    clipId: string,
    semitones: number
  ): Promise<void> {
    try {
      const command = new TransposeMidiClipCommand(
        TrackId.fromString(trackId),
        ClipId.fromString(clipId),
        semitones
      );
      
      await this.mediator.send(command);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  // ✅ System Operations - Clean API (These would need Query implementations)
  async getSystemStats(): Promise<SystemStatsDTO> {
    try {
      // Note: This would need GetSystemStatsQuery implementation
      // For now, return placeholder data
      return {
        trackCount: 0,
        clipCount: 0,
        eventCount: 0
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async getTrackStatus(trackId: string): Promise<TrackStatusDTO> {
    try {
      const query = new GetTrackWithClipsQuery(TrackId.fromString(trackId));
      const track = await this.mediator.query(query);
      
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      return {
        name: track.metadata.name,
        clipCount: track.clips.size
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async getDebugInfo(trackId: string): Promise<DebugInfoDTO> {
    try {
      const query = new GetTrackByIdQuery(TrackId.fromString(trackId));
      const track = await this.mediator.query(query);
      
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      // This would typically come from EventStore
      return {
        eventCount: 0,
        recentEvents: [],
        version: track.version
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async validateTrackState(trackId: string): Promise<ValidationResultDTO> {
    try {
      const query = new GetTrackWithClipsQuery(TrackId.fromString(trackId));
      const track = await this.mediator.query(query);
      
      if (!track) {
        return {
          valid: false,
          errors: ['Track not found']
        };
      }

      // Perform domain validation
      const errors: string[] = [];
      
      // Add validation logic here
      if (track.clips.size === 0) {
        errors.push('Track has no clips');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}