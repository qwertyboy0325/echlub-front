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

// Placeholder for PeerId - should be imported from collaboration module
export interface PeerId {
  toString(): string;
  equals(other: PeerId): boolean;
}

// Placeholder for CollaborationState - should be imported from collaboration module
export interface CollaborationState {
  canApplyOperation(operation: any, peerId: PeerId): boolean;
  recordOperation(operation: any, peerId: PeerId): void;
}

/**
 * Track Aggregate Root
 * Manages audio and MIDI tracks with clips and collaboration
 * Uses event sourcing for undo/redo support
 */
export class Track extends EventSourcedAggregateRoot<TrackId> {
  private constructor(
    private readonly _trackId: TrackId,
    private readonly _ownerId: PeerId,
    private readonly _trackType: TrackType,
    private _clips: Map<ClipId, Clip>, // Now stores Clip entities
    private _metadata: TrackMetadata,
    private _collaborationState: CollaborationState,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(_trackId, createdAt, updatedAt); // Initialize EventSourcedAggregateRoot with TrackId
  }

  // Factory method for new tracks
  public static create(
    trackId: TrackId,
    ownerId: PeerId,
    trackType: TrackType,
    metadata: TrackMetadata
  ): Track {
    const track = new Track(
      trackId,
      ownerId,
      trackType,
      new Map(),
      metadata,
      { 
        canApplyOperation: () => true, 
        recordOperation: () => {} 
      } as CollaborationState // Temporary implementation
    );
    
    // Raise event instead of direct state change
    track.raiseEvent(new TrackCreatedEvent(trackId, ownerId, trackType));
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
    const clip = this._clips.get(clipId);
    if (!clip) {
      throw new Error('Clip not found in track');
    }

    this.raiseEvent(new ClipRemovedFromTrackEvent(this._trackId, clipId, clip.getType()));
  }

  // Move clip within track
  public moveClip(clipId: ClipId, newRange: TimeRangeVO): void {
    const clip = this._clips.get(clipId);
    if (!clip) {
      throw new Error('Clip not found in track');
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
      throw new Error('Only instrument tracks can contain MIDI notes');
    }
    
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new Error('MIDI clip not found');
    }
    
    // Raise event instead of direct modification
    this.raiseEvent(new MidiNoteAddedEvent(this._trackId, clipId, note));
  }

  public removeMidiNoteFromClip(clipId: ClipId, noteId: MidiNoteId): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new Error('MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    const note = midiClip.notes.find(n => n.noteId.equals(noteId));
    if (!note) {
      throw new Error('NOTE_NOT_FOUND');
    }
    
    this.raiseEvent(new MidiNoteRemovedEvent(this._trackId, clipId, noteId, note));
  }

  public updateMidiNote(clipId: ClipId, noteId: MidiNoteId, newNote: MidiNote): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new Error('MIDI clip not found');
    }
    
    const midiClip = clip as MidiClip;
    const oldNote = midiClip.notes.find(n => n.noteId.equals(noteId));
    if (!oldNote) {
      throw new Error('NOTE_NOT_FOUND');
    }
    
    this.raiseEvent(new MidiNoteUpdatedEvent(this._trackId, clipId, noteId, oldNote, newNote));
  }

  public quantizeMidiClip(clipId: ClipId, quantizeValue: QuantizeValue): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new Error('MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    const originalNotes = [...midiClip.notes];
    this.raiseEvent(new MidiClipQuantizedEvent(this._trackId, clipId, quantizeValue, originalNotes));
  }

  public transposeMidiClip(clipId: ClipId, semitones: number): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new Error('MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    const originalNotes = [...midiClip.notes];
    this.raiseEvent(new MidiClipTransposedEvent(this._trackId, clipId, semitones, originalNotes));
  }

  // Audio-specific operations
  public setAudioClipGain(clipId: ClipId, gain: number): void {
    if (!this._trackType.isAudio()) {
      throw new Error('Only audio tracks can have audio clips');
    }

    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.AUDIO) {
      throw new Error('Audio clip not found');
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
      case 'AudioClipGainChanged':
        this.applyAudioClipGainChangedEvent(event as AudioClipGainChangedEvent);
        break;
      // Add other event handlers as needed
    }
  }

  // Event application methods
  private applyTrackCreatedEvent(event: TrackCreatedEvent): void {
    // Track is already created in constructor, no additional state changes needed
  }

  private applyClipAddedToTrackEvent(event: ClipAddedToTrackEvent): void {
    // The clip should be provided in the event or loaded separately
    // For now, this is a placeholder - in real implementation, 
    // the clip would be reconstructed from the event data
  }

  private applyClipRemovedFromTrackEvent(event: ClipRemovedFromTrackEvent): void {
    this._clips.delete(event.clipId);
  }

  private applyClipMovedInTrackEvent(event: ClipMovedInTrackEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip) {
      clip.moveToRange(event.newRange);
    }
  }

  private applyTrackMetadataUpdatedEvent(event: TrackMetadataUpdatedEvent): void {
    this._metadata = event.metadata;
  }

  private applyMidiNoteAddedEvent(event: MidiNoteAddedEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.addNote(event.note);
    }
  }

  private applyMidiNoteRemovedEvent(event: MidiNoteRemovedEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.removeNote(event.noteId);
    }
  }

  private applyMidiNoteUpdatedEvent(event: MidiNoteUpdatedEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.updateNote(event.noteId, event.newNote);
    }
  }

  private applyMidiClipQuantizedEvent(event: MidiClipQuantizedEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.quantizeNotes(event.quantizeValue);
    }
  }

  private applyMidiClipTransposedEvent(event: MidiClipTransposedEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip && clip.getType() === ClipType.MIDI) {
      const midiClip = clip as MidiClip;
      midiClip.transposeNotes(event.semitones);
    }
  }

  private applyAudioClipGainChangedEvent(event: AudioClipGainChangedEvent): void {
    const clip = this._clips.get(event.clipId);
    if (clip && clip.getType() === ClipType.AUDIO) {
      const audioClip = clip as AudioClip;
      audioClip.setGain(event.gain);
    }
  }

  // Collaboration support
  public applyRemoteOperation(operation: any, peerId: PeerId): void {
    if (!this._collaborationState.canApplyOperation(operation, peerId)) {
      throw new Error('Operation not permitted');
    }
    
    // this.executeOperation(operation);
    this._collaborationState.recordOperation(operation, peerId);
  }

  // Validation methods
  private validateClipType(clip: Clip): void {
    if (this._trackType.isAudio() && clip.getType() !== ClipType.AUDIO) {
      throw new Error('Audio tracks can only contain audio clips');
    }
    if (this._trackType.isInstrument() && clip.getType() !== ClipType.MIDI) {
      throw new Error('Instrument tracks can only contain MIDI clips');
    }
  }

  private validateNoOverlap(range: TimeRangeVO): void {
    for (const clip of this._clips.values()) {
      if (clip.range.intersects(range)) {
        throw new Error('Clips cannot overlap');
      }
    }
  }

  private validateNoOverlapExcept(range: TimeRangeVO, excludeClipId: ClipId): void {
    for (const [clipId, clip] of this._clips) {
      if (!clipId.equals(excludeClipId) && clip.range.intersects(range)) {
        throw new Error('Clips cannot overlap');
      }
    }
  }

  // Query methods
  public getClipsInRange(range: TimeRangeVO): Clip[] {
    return Array.from(this._clips.values()).filter(clip => 
      clip.range.intersects(range)
    );
  }

  public getClipsAtTime(timePoint: number): Clip[] {
    return Array.from(this._clips.values()).filter(clip => 
      clip.contains(timePoint)
    );
  }

  public getClipsByType(clipType: ClipType): Clip[] {
    return Array.from(this._clips.values()).filter(clip => 
      clip.getType() === clipType
    );
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

  public get clips(): ReadonlyMap<ClipId, Clip> { 
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
    return Math.max(...Array.from(this._clips.values()).map(clip => clip.endTime));
  }

  public getClip(clipId: ClipId): Clip | undefined { 
    return this._clips.get(clipId); 
  }

  public getMidiClip(clipId: ClipId): MidiClip | undefined {
    const clip = this._clips.get(clipId);
    return clip?.getType() === ClipType.MIDI ? clip as MidiClip : undefined;
  }

  public getAudioClip(clipId: ClipId): AudioClip | undefined {
    const clip = this._clips.get(clipId);
    return clip?.getType() === ClipType.AUDIO ? clip as AudioClip : undefined;
  }
}

// Placeholder event classes - these should be properly implemented
class TrackCreatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly ownerId: PeerId,
    public readonly trackType: TrackType
  ) {
    super('TrackCreated', trackId.toString());
  }
}

class ClipAddedToTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly clipType: ClipType
  ) {
    super('ClipAddedToTrack', trackId.toString());
  }
}

class ClipRemovedFromTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly clipType: ClipType
  ) {
    super('ClipRemovedFromTrack', trackId.toString());
  }
}

class ClipMovedInTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly oldRange: TimeRangeVO,
    public readonly newRange: TimeRangeVO
  ) {
    super('ClipMovedInTrack', trackId.toString());
  }
}

class TrackMetadataUpdatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly metadata: TrackMetadata
  ) {
    super('TrackMetadataUpdated', trackId.toString());
  }
}

class MidiNoteAddedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly note: MidiNote
  ) {
    super('MidiNoteAdded', trackId.toString());
  }
}

class MidiNoteRemovedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly removedNote: MidiNote
  ) {
    super('MidiNoteRemoved', trackId.toString());
  }
}

class MidiNoteUpdatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly oldNote: MidiNote,
    public readonly newNote: MidiNote
  ) {
    super('MidiNoteUpdated', trackId.toString());
  }
}

class MidiClipQuantizedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly quantizeValue: QuantizeValue,
    public readonly originalNotes: MidiNote[]
  ) {
    super('MidiClipQuantized', trackId.toString());
  }
}

class MidiClipTransposedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly semitones: number,
    public readonly originalNotes: MidiNote[]
  ) {
    super('MidiClipTransposed', trackId.toString());
  }
}

class AudioClipGainChangedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly gain: number
  ) {
    super('AudioClipGainChanged', trackId.toString());
  }
} 