import { EventSourcedAggregateRoot } from '../../../../core/entities/EventSourcedAggregateRoot';
import { DomainEvent } from '../../../../core/events/DomainEvent';
import { TrackId } from '../value-objects/TrackId';
import { TrackType } from '../value-objects/TrackType';
import { TrackMetadata } from '../value-objects/TrackMetadata';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';
import { QuantizeValue } from '../value-objects/QuantizeValue';
import { Clip } from '../entities/Clip';
import { AudioClip } from '../entities/AudioClip';
import { MidiClip } from '../entities/MidiClip';
import { MidiNote } from '../entities/MidiNote';
import { ClipId } from '../value-objects/ClipId';
import { MidiNoteId } from '../value-objects/MidiNoteId';
import { ClipType } from '../value-objects/ClipType';
import { DomainError } from '../errors/DomainError';

// Import events from separated files
import {
  PeerId,
  TrackCreatedEvent,
  ClipAddedToTrackEvent,
  ClipRemovedFromTrackEvent,
  ClipMovedInTrackEvent,
  TrackMetadataUpdatedEvent
} from '../events/TrackEvents';

import {
  MidiNoteAddedEvent,
  MidiNoteRemovedEvent,
  MidiNoteUpdatedEvent,
  MidiClipQuantizedEvent,
  MidiClipTransposedEvent,
  MidiClipNotesReplacedEvent
} from '../events/MidiEvents';

import {
  AudioClipGainChangedEvent
} from '../events/ClipEvents';

// Define specific operation types
export interface TrackOperation {
  type: string;
  aggregateId: string;
  timestamp: Date;
  userId: string;
}

export interface AddClipOperation extends TrackOperation {
  type: 'AddClip';
  clipId: string;
  clipData: any;
}

export interface RemoveClipOperation extends TrackOperation {
  type: 'RemoveClip';
  clipId: string;
}

// Placeholder for CollaborationState - should be imported from collaboration module
export interface CollaborationState {
  canApplyOperation(operation: TrackOperation, peerId: PeerId): boolean;
  recordOperation(operation: TrackOperation, peerId: PeerId): void;
}

/**
 * Track Aggregate Root
 * Manages audio and MIDI tracks with clips and collaboration
 * Uses event sourcing for undo/redo support
 */
export class Track extends EventSourcedAggregateRoot<TrackId> {
  private _trackId: TrackId;
  private _ownerId: PeerId;
  private _trackType: TrackType;
  private _clips: Map<string, Clip>;
  private _metadata: TrackMetadata;
  private _collaborationState: CollaborationState;

  private constructor(
    trackId: TrackId,
    ownerId?: PeerId,
    trackType?: TrackType,
    clips?: Map<string, Clip>,
    metadata?: TrackMetadata,
    collaborationState?: CollaborationState,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(trackId, createdAt, updatedAt);
    this._trackId = trackId;
    this._ownerId = ownerId!;
    this._trackType = trackType!;
    this._clips = clips || new Map();
    this._metadata = metadata!;
    this._collaborationState = collaborationState || { 
      canApplyOperation: () => true, 
      recordOperation: () => {} 
    };
  }

  // Factory method for new tracks
  public static create(
    trackId: TrackId,
    ownerId: PeerId,
    trackType: TrackType,
    metadata: TrackMetadata
  ): Track {
    const track = new Track(trackId);
    
    // Raise event instead of direct state change
    track.raiseEvent(new TrackCreatedEvent(trackId, ownerId, trackType, metadata));
    return track;
  }

  // Factory method for loading from events (event sourcing)
  public static fromHistory(trackId: TrackId, events: DomainEvent[]): Track {
    const track = new Track(trackId);
    track.loadFromHistory(events);
    return track;
  }

  // Core business logic - Add clip entity to track
  public addClip(clip: Clip): void {
    this.validateClipType(clip);
    this.validateNoOverlap(clip.range);
    
    this.raiseEvent(new ClipAddedToTrackEvent(this._trackId, clip.clipId, clip.getType()));
  }

  // Remove clip from track
  public removeClip(clipId: ClipId): void {
    const clip = this._clips.get(clipId.toString());
    if (!clip) {
      throw DomainError.clipNotFound(clipId.toString());
    }

    this.raiseEvent(new ClipRemovedFromTrackEvent(this._trackId, clipId, clip.getType()));
  }

  // Move clip within track
  public moveClip(clipId: ClipId, newRange: TimeRangeVO): void {
    const clip = this._clips.get(clipId.toString());
    if (!clip) {
      throw DomainError.clipNotFound(clipId.toString());
    }

    // Validate no overlap with other clips
    this.validateNoOverlapExcept(newRange, clipId);
    
    const oldRange = clip.range;
    this.raiseEvent(new ClipMovedInTrackEvent(this._trackId, clipId, oldRange, newRange));
  }

  // Update track metadata
  public updateMetadata(metadata: TrackMetadata): void {
    this.raiseEvent(new TrackMetadataUpdatedEvent(this._trackId, metadata));
  }

  // MIDI-specific operations that raise events
  public addMidiNoteToClip(clipId: ClipId, note: MidiNote): void {
    if (!this._trackType.isInstrument()) {
      throw DomainError.trackTypeMismatch('addMidiNote', this._trackType.toString());
    }
    
    const clip = this._clips.get(clipId.toString());
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw DomainError.clipTypeMismatch('MIDI', clip?.getType().toString() || 'unknown');
    }
    
    // Raise event instead of direct modification
    this.raiseEvent(new MidiNoteAddedEvent(this._trackId, clipId, note));
  }

  public removeMidiNoteFromClip(clipId: ClipId, noteId: MidiNoteId): void {
    const clip = this._clips.get(clipId.toString());
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw DomainError.clipTypeMismatch('MIDI', clip?.getType().toString() || 'unknown');
    }

    const midiClip = clip as MidiClip;
    const note = midiClip.notes.find(n => n.noteId.equals(noteId));
    if (!note) {
      throw DomainError.midiNoteNotFound(noteId.toString());
    }
    
    this.raiseEvent(new MidiNoteRemovedEvent(this._trackId, clipId, noteId, note));
  }

  public updateMidiNote(clipId: ClipId, noteId: MidiNoteId, newNote: MidiNote): void {
    const clip = this._clips.get(clipId.toString());
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw DomainError.clipTypeMismatch('MIDI', clip?.getType().toString() || 'unknown');
    }
    
    const midiClip = clip as MidiClip;
    const oldNote = midiClip.notes.find(n => n.noteId.equals(noteId));
    if (!oldNote) {
      throw DomainError.midiNoteNotFound(noteId.toString());
    }
    
    this.raiseEvent(new MidiNoteUpdatedEvent(this._trackId, clipId, noteId, oldNote, newNote));
  }

  public quantizeMidiClip(clipId: ClipId, quantizeValue: QuantizeValue): void {
    const clip = this._clips.get(clipId.toString());
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw DomainError.clipTypeMismatch('MIDI', clip?.getType().toString() || 'unknown');
    }

    const midiClip = clip as MidiClip;
    const originalNotes = [...midiClip.notes];
    this.raiseEvent(new MidiClipQuantizedEvent(this._trackId, clipId, quantizeValue, originalNotes));
  }

  public transposeMidiClip(clipId: ClipId, semitones: number): void {
    const clip = this._clips.get(clipId.toString());
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw DomainError.clipTypeMismatch('MIDI', clip?.getType().toString() || 'unknown');
    }

    const midiClip = clip as MidiClip;
    const originalNotes = [...midiClip.notes];
    this.raiseEvent(new MidiClipTransposedEvent(this._trackId, clipId, semitones, originalNotes));
  }

  // Audio-specific operations
  public setAudioClipGain(clipId: ClipId, gain: number): void {
    if (!this._trackType.isAudio()) {
      throw DomainError.trackTypeMismatch('setAudioClipGain', this._trackType.toString());
    }

    const clip = this._clips.get(clipId.toString());
    if (!clip || clip.getType() !== ClipType.AUDIO) {
      throw DomainError.clipTypeMismatch('AUDIO', clip?.getType().toString() || 'unknown');
    }

    if (gain < 0) {
      throw DomainError.invalidGain(gain);
    }

    this.raiseEvent(new AudioClipGainChangedEvent(this._trackId, clipId, gain));
  }

  // Event application method (required by EventSourcedAggregateRoot)
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventName) {
      case 'TrackCreated':
        this.applyTrackCreatedEvent(event as TrackCreatedEvent);
        break;
      case 'ClipAddedToTrack':
        this.applyClipAddedToTrackEvent(event as ClipAddedToTrackEvent);
        break;
      case 'ClipRemovedFromTrack':
        this.applyClipRemovedFromTrackEvent(event as ClipRemovedFromTrackEvent);
        break;
      case 'ClipMovedInTrack':
        this.applyClipMovedInTrackEvent(event as ClipMovedInTrackEvent);
        break;
      case 'TrackMetadataUpdated':
        this.applyTrackMetadataUpdatedEvent(event as TrackMetadataUpdatedEvent);
        break;
      case 'MidiNoteAdded':
        this.applyMidiNoteAddedEvent(event as MidiNoteAddedEvent);
        break;
      case 'MidiNoteRemoved':
        this.applyMidiNoteRemovedEvent(event as MidiNoteRemovedEvent);
        break;
      case 'MidiNoteUpdated':
        this.applyMidiNoteUpdatedEvent(event as MidiNoteUpdatedEvent);
        break;
      case 'MidiClipQuantized':
        this.applyMidiClipQuantizedEvent(event as MidiClipQuantizedEvent);
        break;
      case 'MidiClipTransposed':
        this.applyMidiClipTransposedEvent(event as MidiClipTransposedEvent);
        break;
      case 'MidiClipNotesReplaced':
        this.applyMidiClipNotesReplacedEvent(event as MidiClipNotesReplacedEvent);
        break;
      case 'AudioClipGainChanged':
        this.applyAudioClipGainChangedEvent(event as AudioClipGainChangedEvent);
        break;
      default:
        // Ignore unknown events for forward compatibility
        console.warn(`Unknown event type: ${event.eventName}`);
    }
  }

  // Event application methods - these reconstruct state from events
  private applyTrackCreatedEvent(event: TrackCreatedEvent): void {
    this._trackId = event.trackId;
    this._ownerId = event.ownerId;
    this._metadata = event.metadata;
    
    // Ensure TrackType is properly reconstructed from event data
    if (event.trackType instanceof TrackType) {
      this._trackType = event.trackType;
    } else {
      // Handle case where trackType is serialized as plain object
      const trackTypeData = event.trackType as any;
      if (trackTypeData.props && trackTypeData.props.type) {
        this._trackType = TrackType.fromString(trackTypeData.props.type);
      } else if (typeof trackTypeData === 'string') {
        this._trackType = TrackType.fromString(trackTypeData);
      } else {
        // Fallback to instrument type
        this._trackType = TrackType.instrument();
      }
    }
    
    this._clips = new Map();
    this._collaborationState = { 
      canApplyOperation: () => true, 
      recordOperation: () => {} 
    };
  }

  private applyClipAddedToTrackEvent(event: ClipAddedToTrackEvent): void {
    // In event sourcing, we need to reconstruct the clip from the repository
    // Since we don't have the clip instance in the event, we create a placeholder
    // that will be replaced by the actual clip in the command handler
    
    console.log(`Applying ClipAddedToTrackEvent: Clip ${event.clipId.toString()} added to track ${event.trackId.toString()}`);
    
    // Note: The actual clip will be added via addClipToState() method
    // This event application just records that a clip was added
    // The command handler is responsible for calling addClipToState() with the actual clip instance
    
    // For event sourcing consistency, we mark that this clip exists
    // The actual clip data will be loaded by the repository's loadWithClips method
  }

  private applyClipRemovedFromTrackEvent(event: ClipRemovedFromTrackEvent): void {
    this._clips.delete(event.clipId.toString());
  }

  private applyClipMovedInTrackEvent(event: ClipMovedInTrackEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip) {
      // Apply the range change to the clip
      clip.moveToRange(event.newRange);
    }
  }

  private applyTrackMetadataUpdatedEvent(event: TrackMetadataUpdatedEvent): void {
    this._metadata = event.metadata;
  }

  private applyMidiNoteAddedEvent(event: MidiNoteAddedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.addNote(event.note);
    }
  }

  private applyMidiNoteRemovedEvent(event: MidiNoteRemovedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.removeNote(event.noteId);
    }
  }

  private applyMidiNoteUpdatedEvent(event: MidiNoteUpdatedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.updateNote(event.noteId, event.newNote);
    }
  }

  private applyMidiClipQuantizedEvent(event: MidiClipQuantizedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.quantizeNotes(event.quantizeValue);
    }
  }

  private applyMidiClipTransposedEvent(event: MidiClipTransposedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.transposeNotes(event.semitones);
    }
  }

  private applyMidiClipNotesReplacedEvent(event: MidiClipNotesReplacedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      // Replace all notes with the provided notes
      // This is used for undo operations
      this.replaceAllNotesInClip(midiClip, event.notes);
    }
  }

  private applyAudioClipGainChangedEvent(event: AudioClipGainChangedEvent): void {
    const clip = this._clips.get(event.clipId.toString());
    if (clip && clip.getType() === ClipType.AUDIO) {
      const audioClip = clip as AudioClip;
      audioClip.setGain(event.gain);
    }
  }

  // Helper method to replace all notes in a MIDI clip (for undo operations)
  private replaceAllNotesInClip(midiClip: MidiClip, notes: MidiNote[]): void {
    // Clear existing notes
    const existingNotes = [...midiClip.notes];
    for (const note of existingNotes) {
      midiClip.removeNote(note.noteId);
    }
    
    // Add new notes
    for (const note of notes) {
      midiClip.addNote(note);
    }
  }

  // Collaboration support
  public applyRemoteOperation(operation: TrackOperation, peerId: PeerId): void {
    if (!this._collaborationState.canApplyOperation(operation, peerId)) {
      throw DomainError.operationNotPermitted(operation.type, 'Insufficient permissions');
    }
    
    this.executeOperation(operation);
    this._collaborationState.recordOperation(operation, peerId);
  }

  private executeOperation(operation: TrackOperation): void {
    // Execute the operation based on its type
    // This would be implemented based on the specific operation types
    console.log(`Executing operation: ${operation.type}`);
  }

  // Validation methods
  private validateClipType(clip: Clip): void {
    if (this._trackType.isAudio() && clip.getType() !== ClipType.AUDIO) {
      throw DomainError.clipTypeMismatch('AUDIO', clip.getType().toString());
    }
    if (this._trackType.isInstrument() && clip.getType() !== ClipType.MIDI) {
      throw DomainError.clipTypeMismatch('MIDI', clip.getType().toString());
    }
  }

  private validateNoOverlap(range: TimeRangeVO): void {
    for (const clip of this._clips.values()) {
      if (clip.range.intersects(range)) {
        throw DomainError.clipOverlap();
      }
    }
  }

  private validateNoOverlapExcept(range: TimeRangeVO, excludeClipId: ClipId): void {
    for (const [clipIdStr, clip] of this._clips) {
      if (clipIdStr !== excludeClipId.toString() && clip.range.intersects(range)) {
        throw DomainError.clipOverlap();
      }
    }
  }

  // Query methods
  public getClipsInRange(range: TimeRangeVO): Clip[] {
    return Array.from(this._clips.values())
      .filter(clip => clip.range.intersects(range));
  }

  public getClipsAtTime(timePoint: number): Clip[] {
    return Array.from(this._clips.values())
      .filter(clip => timePoint >= clip.range.start && timePoint < clip.range.end);
  }

  public getClipsByType(clipType: ClipType): Clip[] {
    return Array.from(this._clips.values())
      .filter(clip => clip.getType() === clipType);
  }

  public hasClips(): boolean {
    return this._clips.size > 0;
  }

  public isEmpty(): boolean {
    return this._clips.size === 0;
  }

  // Getters
  public get trackId(): TrackId { 
    return this._trackId; 
  }

  public get ownerId(): PeerId { 
    return this._ownerId; 
  }

  public get trackType(): TrackType { 
    return this._trackType; 
  }

  public get clips(): ReadonlyMap<string, Clip> { 
    return this._clips; 
  }

  public get metadata(): TrackMetadata {
    return this._metadata;
  }

  public get name(): string {
    return this._metadata.name;
  }

  public get clipCount(): number {
    return this._clips.size;
  }

  public get duration(): number {
    if (this._clips.size === 0) return 0;
    return Math.max(...Array.from(this._clips.values()).map(clip => clip.range.end));
  }

  public getClip(clipId: ClipId): Clip | undefined { 
    return this._clips.get(clipId.toString()); 
  }

  public getMidiClip(clipId: ClipId): MidiClip | undefined {
    const clip = this._clips.get(clipId.toString());
    return clip && clip.getType() === ClipType.MIDI ? clip as MidiClip : undefined;
  }

  public getAudioClip(clipId: ClipId): AudioClip | undefined {
    const clip = this._clips.get(clipId.toString());
    return clip && clip.getType() === ClipType.AUDIO ? clip as AudioClip : undefined;
  }

  // Event sourcing helper methods
  public addClipToState(clip: Clip): void {
    // This method is used by command handlers to add clips to track state
    // after domain events have been raised and applied
    // It ensures the clip is immediately available for subsequent operations
    this._clips.set(clip.clipId.toString(), clip);
    console.log(`Clip ${clip.clipId.toString()} added to track state. Total clips: ${this._clips.size}`);
  }
} 