import { injectable } from 'inversify';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { Track, PeerId } from '../../domain/aggregates/Track';
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

// Placeholder for event bus - should be imported from core
interface IEventBus {
  publish(event: any): void;
}

/**
 * Music Arrangement Application Service
 * Orchestrates track and clip operations
 */
@injectable()
export class MusicArrangementService {
  constructor(
    private trackRepository: TrackRepository,
    private clipRepository: ClipRepository,
    private eventBus: IEventBus
  ) {}

  // Track operations
  async createTrack(
    ownerId: PeerId,
    trackType: TrackType,
    metadata: TrackMetadata
  ): Promise<TrackId> {
    const trackId = TrackId.create();
    const track = Track.create(trackId, ownerId, trackType, metadata);
    
    await this.trackRepository.save(track);
    this.publishDomainEvents(track);
    
    return trackId;
  }

  async getTrack(trackId: TrackId): Promise<Track | null> {
    return await this.trackRepository.findById(trackId);
  }

  async getTrackWithClips(trackId: TrackId): Promise<Track | null> {
    return await this.trackRepository.loadWithClips(trackId);
  }

  async updateTrackMetadata(
    trackId: TrackId,
    metadata: TrackMetadata
  ): Promise<void> {
    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.updateMetadata(metadata);
    
    await this.trackRepository.save(track);
    this.publishDomainEvents(track);
  }

  async deleteTrack(trackId: TrackId): Promise<void> {
    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    // Delete all clips first
    await this.clipRepository.deleteByTrackId(trackId);
    
    // Then delete the track
    await this.trackRepository.delete(trackId);
  }

  // Audio clip operations
  async createAudioClip(
    trackId: TrackId,
    range: TimeRangeVO,
    audioSource: AudioSourceRef,
    metadata: ClipMetadata
  ): Promise<ClipId> {
    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const audioClip = AudioClip.create(range, audioSource, metadata);
    track.addClip(audioClip);
    
    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(audioClip);
    
    this.publishDomainEvents(track);
    
    return audioClip.clipId;
  }

  async setAudioClipGain(
    trackId: TrackId,
    clipId: ClipId,
    gain: number
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.setAudioClipGain(clipId, gain);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  // MIDI clip operations
  async createMidiClip(
    trackId: TrackId,
    range: TimeRangeVO,
    instrument: InstrumentRef,
    metadata: ClipMetadata
  ): Promise<ClipId> {
    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const midiClip = MidiClip.create(range, instrument, metadata);
    track.addClip(midiClip);
    
    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(midiClip);
    
    this.publishDomainEvents(track);
    
    return midiClip.clipId;
  }

  // MIDI note operations
  async addMidiNote(
    trackId: TrackId,
    clipId: ClipId,
    pitch: number,
    velocity: number,
    range: TimeRangeVO
  ): Promise<MidiNoteId> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const note = MidiNote.create(pitch, velocity, range);
    track.addMidiNoteToClip(clipId, note);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
    
    return note.noteId;
  }

  async removeMidiNote(
    trackId: TrackId,
    clipId: ClipId,
    noteId: MidiNoteId
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.removeMidiNoteFromClip(clipId, noteId);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  async quantizeMidiClip(
    trackId: TrackId,
    clipId: ClipId,
    quantizeValue: QuantizeValue
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.quantizeMidiClip(clipId, quantizeValue);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  async transposeMidiClip(
    trackId: TrackId,
    clipId: ClipId,
    semitones: number
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.transposeMidiClip(clipId, semitones);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  // Clip operations
  async moveClip(
    trackId: TrackId,
    clipId: ClipId,
    newRange: TimeRangeVO
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.moveClip(clipId, newRange);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  async removeClip(
    trackId: TrackId,
    clipId: ClipId
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.removeClip(clipId);
    await this.clipRepository.delete(clipId);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  // Query operations
  async getTracksByOwner(ownerId: PeerId): Promise<Track[]> {
    return await this.trackRepository.findByOwnerId(ownerId);
  }

  async getTracksInTimeRange(startTime: number, endTime: number): Promise<Track[]> {
    return await this.trackRepository.findTracksInTimeRange(startTime, endTime);
  }

  async getClipsInTimeRange(range: TimeRangeVO): Promise<any[]> {
    return await this.clipRepository.findInTimeRange(range);
  }

  // Collaboration support
  async applyRemoteOperation(
    trackId: TrackId,
    operation: any,
    peerId: PeerId
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.applyRemoteOperation(operation, peerId);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  // Helper methods
  private publishDomainEvents(aggregate: any): void {
    if (aggregate.getDomainEvents) {
      const events = aggregate.getDomainEvents();
      events.forEach((event: any) => this.eventBus.publish(event));
      aggregate.clearDomainEvents();
    }
  }
} 