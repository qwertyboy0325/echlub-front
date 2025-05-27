import { injectable } from 'inversify';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { Track } from '../../domain/aggregates/Track';
import { PeerId } from '../../domain/events/TrackEvents';
import { AudioClip } from '../../domain/entities/AudioClip';
import { MidiClip } from '../../domain/entities/MidiClip';
import { MidiNote } from '../../domain/entities/MidiNote';
import { TrackId } from '../../domain/value-objects/TrackId';
import { ClipId } from '../../domain/value-objects/ClipId';
import { MidiNoteId } from '../../domain/value-objects/MidiNoteId';
import { TrackType } from '../../domain/value-objects/TrackType';
import { TrackMetadata } from '../../domain/value-objects/TrackMetadata';
import { ClipMetadata } from '../../domain/value-objects/ClipMetadata';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import { AudioSourceRef } from '../../domain/value-objects/AudioSourceRef';
import { InstrumentRef } from '../../domain/value-objects/InstrumentRef';
import { QuantizeValue } from '../../domain/value-objects/QuantizeValue';
import { DomainError } from '../../domain/errors/DomainError';

// Placeholder for event bus - should be imported from core
interface IEventBus {
  publish(event: any): void;
}

// ✅ Helper function to create PeerId
function createPeerId(id: string): PeerId {
  return {
    toString: () => id,
    equals: (other: PeerId) => other.toString() === id
  };
}

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
 * ✅ Clean Architecture Compliant Music Arrangement Service
 * 
 * This service is the ONLY entry point for users to interact with the Music Arrangement BC.
 * It accepts only simple data types (strings, numbers, plain objects) and returns DTOs.
 * Domain objects are never exposed to the outside world.
 */
@injectable()
export class MusicArrangementService {
  constructor(
    private trackRepository: TrackRepository,
    private clipRepository: ClipRepository,
    private eventBus: IEventBus
  ) {}

  // ✅ Track Operations - Clean API
  async createTrack(
    ownerId: string,
    type: string,
    name: string
  ): Promise<string> {
    try {
      const trackType = TrackType.fromString(type);
      const metadata = TrackMetadata.create(name);
      const trackId = TrackId.create();
      const peerIdObj = createPeerId(ownerId);
      
      const track = Track.create(trackId, peerIdObj, trackType, metadata);
      
      await this.trackRepository.save(track);
      this.publishDomainEvents(track);
      
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
      const track = await this.trackRepository.findById(TrackId.fromString(trackId));
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
      const track = await this.trackRepository.findById(TrackId.fromString(trackId));
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      // Delete all clips first
      await this.clipRepository.deleteByTrackId(TrackId.fromString(trackId));
      
      // Then delete the track
      await this.trackRepository.delete(TrackId.fromString(trackId));
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  // ✅ Clip Operations - Clean API
  async createAudioClip(
    trackId: string,
    timeRange: TimeRangeDTO,
    audioSource: { url: string; name: string },
    name: string
  ): Promise<string> {
    try {
      const track = await this.trackRepository.findById(TrackId.fromString(trackId));
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime);
      const audioSourceRef = AudioSourceRef.create(audioSource.url, audioSource.name);
      const metadata = ClipMetadata.create(name);
      
      const audioClip = AudioClip.create(range, audioSourceRef, metadata);
      track.addClip(audioClip);
      
      await this.trackRepository.saveWithClips(track);
      await this.clipRepository.save(audioClip);
      
      this.publishDomainEvents(track);
      
      return audioClip.clipId.toString();
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
      const track = await this.trackRepository.findById(TrackId.fromString(trackId));
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime);
      const instrumentRef = InstrumentRef.create(instrument.type, instrument.name);
      const metadata = ClipMetadata.create(name);
      
      const midiClip = MidiClip.create(range, instrumentRef, metadata);
      track.addClip(midiClip);
      
      await this.trackRepository.saveWithClips(track);
      await this.clipRepository.save(midiClip);
      
      this.publishDomainEvents(track);
      
      return midiClip.clipId.toString();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async getClipsInTrack(trackId: string): Promise<ClipInfoDTO[]> {
    try {
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
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

  // ✅ MIDI Operations - Clean API
  async addMidiNote(
    trackId: string,
    clipId: string,
    pitch: number,
    velocity: number,
    timeRange: TimeRangeDTO
  ): Promise<string> {
    try {
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime);
      const note = MidiNote.create(pitch, velocity, range);
      track.addMidiNoteToClip(ClipId.fromString(clipId), note);
      
      await this.trackRepository.saveWithClips(track);
      this.publishDomainEvents(track);
      
      return note.noteId.toString();
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
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      const quantize = QuantizeValue.fromString(quantizeValue);
      track.quantizeMidiClip(ClipId.fromString(clipId), quantize);
      
      await this.trackRepository.saveWithClips(track);
      this.publishDomainEvents(track);
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
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
      if (!track) {
        throw DomainError.trackNotFound(trackId);
      }

      track.transposeMidiClip(ClipId.fromString(clipId), semitones);
      
      await this.trackRepository.saveWithClips(track);
      this.publishDomainEvents(track);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  // ✅ System Operations - Clean API
  async getSystemStats(): Promise<SystemStatsDTO> {
    try {
      // This would typically come from a dedicated query service
      const tracks = await this.trackRepository.findAll();
      const clips = await this.clipRepository.findAll();
      
      return {
        trackCount: tracks.length,
        clipCount: clips.length,
        eventCount: 0 // Would come from EventStore
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
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
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
      const track = await this.trackRepository.findById(TrackId.fromString(trackId));
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
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
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
        errors: [error.message]
      };
    }
  }

  // ✅ Private helper methods
  private publishDomainEvents(aggregate: any): void {
    const events = aggregate.getUncommittedEvents();
    events.forEach(event => this.eventBus.publish(event));
    aggregate.markEventsAsCommitted();
  }
}