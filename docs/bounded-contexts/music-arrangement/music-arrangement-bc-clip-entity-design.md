# MusicArrangement BC - Corrected Clip Entity Design

## Overview

This document corrects the previous design by properly modeling Clip as an Entity rather than a Value Object, which better reflects its domain characteristics and business requirements.

## Why Clip Should Be an Entity

### Entity Characteristics of Clip

1. **Unique Identity**: Each clip has a unique ClipId that distinguishes it from others
2. **Lifecycle Management**: Clips are created, modified, and deleted independently
3. **Mutable State**: Clips have internal state that changes over time
4. **Business Behavior**: Clips have their own domain logic and operations
5. **Independent Existence**: Clips can exist and be referenced outside of tracks

### Problems with Clip as Value Object

1. **Identity Confusion**: VOs are identified by their values, but clips need unique IDs
2. **Immutability Conflict**: VOs should be immutable, but clips need to change state
3. **Lifecycle Mismatch**: VOs don't have independent lifecycles, but clips do
4. **Behavioral Complexity**: VOs should be simple, but clips have complex behaviors

## Corrected Domain Model

### 1. Clip Entity Hierarchy

```typescript
// Base Clip Entity
export abstract class Clip extends Entity<ClipId> {
  protected constructor(
    clipId: ClipId,
    protected _range: TimeRangeVO,
    protected _metadata: ClipMetadata,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(clipId, createdAt, updatedAt);
  }

  // Common clip operations
  public moveToRange(newRange: TimeRangeVO): void {
    this.validateRange(newRange);
    this._range = newRange;
    this.updateTimestamp();
    this.addDomainEvent(new ClipMovedEvent(this.id, this._range));
  }

  public updateMetadata(metadata: ClipMetadata): void {
    this._metadata = metadata;
    this.updateTimestamp();
    this.addDomainEvent(new ClipMetadataUpdatedEvent(this.id, metadata));
  }

  // Abstract methods for specific clip types
  public abstract getType(): ClipType;
  public abstract getDuration(): number;
  public abstract clone(): Clip;

  // Getters
  public get range(): TimeRangeVO { return this._range; }
  public get metadata(): ClipMetadata { return this._metadata; }
  public get clipId(): ClipId { return this.id; }

  protected validateRange(range: TimeRangeVO): void {
    if (range.start < 0) {
      throw new DomainError('INVALID_CLIP_RANGE', 'Clip start time cannot be negative');
    }
    if (range.length <= 0) {
      throw new DomainError('INVALID_CLIP_RANGE', 'Clip length must be positive');
    }
  }
}

// Audio Clip Entity
export class AudioClip extends Clip {
  private _audioSource: AudioSourceRef;
  private _gain: number;
  private _fadeIn?: number;
  private _fadeOut?: number;

  constructor(
    clipId: ClipId,
    range: TimeRangeVO,
    audioSource: AudioSourceRef,
    metadata: ClipMetadata,
    gain: number = 1.0,
    fadeIn?: number,
    fadeOut?: number
  ) {
    super(clipId, range, metadata);
    this._audioSource = audioSource;
    this._gain = gain;
    this._fadeIn = fadeIn;
    this._fadeOut = fadeOut;
  }

  public static create(
    range: TimeRangeVO,
    audioSource: AudioSourceRef,
    metadata: ClipMetadata
  ): AudioClip {
    const clipId = ClipId.create();
    const clip = new AudioClip(clipId, range, audioSource, metadata);
    clip.addDomainEvent(new AudioClipCreatedEvent(clipId, range, audioSource));
    return clip;
  }

  public setGain(gain: number): void {
    if (gain < 0) {
      throw new DomainError('INVALID_GAIN', 'Gain cannot be negative');
    }
    this._gain = gain;
    this.updateTimestamp();
    this.addDomainEvent(new AudioClipGainChangedEvent(this.id, gain));
  }

  public setFadeIn(fadeIn: number): void {
    if (fadeIn < 0) {
      throw new DomainError('INVALID_FADE', 'Fade in cannot be negative');
    }
    this._fadeIn = fadeIn;
    this.updateTimestamp();
    this.addDomainEvent(new AudioClipFadeChangedEvent(this.id, 'fadeIn', fadeIn));
  }

  public setFadeOut(fadeOut: number): void {
    if (fadeOut < 0) {
      throw new DomainError('INVALID_FADE', 'Fade out cannot be negative');
    }
    this._fadeOut = fadeOut;
    this.updateTimestamp();
    this.addDomainEvent(new AudioClipFadeChangedEvent(this.id, 'fadeOut', fadeOut));
  }

  public getType(): ClipType {
    return ClipType.AUDIO;
  }

  public getDuration(): number {
    return this._range.length;
  }

  public clone(): AudioClip {
    const newClipId = ClipId.create();
    return new AudioClip(
      newClipId,
      this._range,
      this._audioSource,
      this._metadata,
      this._gain,
      this._fadeIn,
      this._fadeOut
    );
  }

  // Getters
  public get audioSource(): AudioSourceRef { return this._audioSource; }
  public get gain(): number { return this._gain; }
  public get fadeIn(): number | undefined { return this._fadeIn; }
  public get fadeOut(): number | undefined { return this._fadeOut; }
}

// MIDI Clip Entity
export class MidiClip extends Clip {
  private _notes: Map<string, MidiNote>; // Use Map for efficient note management
  private _instrument: InstrumentRef;
  private _velocity?: number;

  constructor(
    clipId: ClipId,
    range: TimeRangeVO,
    instrument: InstrumentRef,
    metadata: ClipMetadata,
    velocity?: number
  ) {
    super(clipId, range, metadata);
    this._notes = new Map();
    this._instrument = instrument;
    this._velocity = velocity;
  }

  public static create(
    range: TimeRangeVO,
    instrument: InstrumentRef,
    metadata: ClipMetadata
  ): MidiClip {
    const clipId = ClipId.create();
    const clip = new MidiClip(clipId, range, instrument, metadata);
    clip.addDomainEvent(new MidiClipCreatedEvent(clipId, range, instrument));
    return clip;
  }

  public addNote(note: MidiNote): void {
    // Validate note is within clip range
    if (!this._range.contains(note.range)) {
      throw new DomainError('NOTE_OUTSIDE_CLIP_RANGE', 'MIDI note must be within clip range');
    }

    // Check for overlapping notes with same pitch
    const overlappingNote = this.findOverlappingNote(note);
    if (overlappingNote) {
      throw new DomainError('NOTE_OVERLAP', 'MIDI notes with same pitch cannot overlap');
    }

    const noteId = note.id.toString();
    this._notes.set(noteId, note);
    this.updateTimestamp();
    this.addDomainEvent(new MidiNoteAddedEvent(this.id, note));
  }

  public removeNote(noteId: MidiNoteId): void {
    const noteIdStr = noteId.toString();
    const note = this._notes.get(noteIdStr);
    
    if (!note) {
      throw new DomainError('NOTE_NOT_FOUND', 'MIDI note not found in clip');
    }

    this._notes.delete(noteIdStr);
    this.updateTimestamp();
    this.addDomainEvent(new MidiNoteRemovedEvent(this.id, note));
  }

  public updateNote(noteId: MidiNoteId, updatedNote: MidiNote): void {
    const noteIdStr = noteId.toString();
    const existingNote = this._notes.get(noteIdStr);
    
    if (!existingNote) {
      throw new DomainError('NOTE_NOT_FOUND', 'MIDI note not found in clip');
    }

    // Validate updated note is within clip range
    if (!this._range.contains(updatedNote.range)) {
      throw new DomainError('NOTE_OUTSIDE_CLIP_RANGE', 'Updated MIDI note must be within clip range');
    }

    this._notes.set(noteIdStr, updatedNote);
    this.updateTimestamp();
    this.addDomainEvent(new MidiNoteUpdatedEvent(this.id, existingNote, updatedNote));
  }

  public quantizeNotes(quantizeValue: QuantizeValue): void {
    const originalNotes = Array.from(this._notes.values());
    const quantizedNotes = new Map<string, MidiNote>();

    for (const [noteId, note] of this._notes) {
      const quantizedNote = note.quantize(quantizeValue);
      quantizedNotes.set(noteId, quantizedNote);
    }

    this._notes = quantizedNotes;
    this.updateTimestamp();
    this.addDomainEvent(new MidiClipQuantizedEvent(this.id, quantizeValue, originalNotes));
  }

  public transposeNotes(semitones: number): void {
    const originalNotes = Array.from(this._notes.values());
    const transposedNotes = new Map<string, MidiNote>();

    for (const [noteId, note] of this._notes) {
      const transposedNote = note.transpose(semitones);
      transposedNotes.set(noteId, transposedNote);
    }

    this._notes = transposedNotes;
    this.updateTimestamp();
    this.addDomainEvent(new MidiClipTransposedEvent(this.id, semitones, originalNotes));
  }

  public setInstrument(instrument: InstrumentRef): void {
    this._instrument = instrument;
    this.updateTimestamp();
    this.addDomainEvent(new MidiClipInstrumentChangedEvent(this.id, instrument));
  }

  public getType(): ClipType {
    return ClipType.MIDI;
  }

  public getDuration(): number {
    return this._range.length;
  }

  public clone(): MidiClip {
    const newClipId = ClipId.create();
    const clonedClip = new MidiClip(
      newClipId,
      this._range,
      this._instrument,
      this._metadata,
      this._velocity
    );

    // Clone all notes
    for (const [noteId, note] of this._notes) {
      const clonedNote = note.clone();
      clonedClip._notes.set(clonedNote.id.toString(), clonedNote);
    }

    return clonedClip;
  }

  private findOverlappingNote(newNote: MidiNote): MidiNote | null {
    for (const note of this._notes.values()) {
      if (note.pitch === newNote.pitch && note.range.intersects(newNote.range)) {
        return note;
      }
    }
    return null;
  }

  // Getters
  public get notes(): MidiNote[] { return Array.from(this._notes.values()); }
  public get instrument(): InstrumentRef { return this._instrument; }
  public get velocity(): number | undefined { return this._velocity; }
  public get noteCount(): number { return this._notes.size; }
}
```

### 2. MIDI Note as Entity

```typescript
// MIDI Note Entity (not Value Object)
export class MidiNote extends Entity<MidiNoteId> {
  private _pitch: number;
  private _velocity: number;
  private _range: TimeRangeVO;

  constructor(
    noteId: MidiNoteId,
    pitch: number,
    velocity: number,
    range: TimeRangeVO
  ) {
    super(noteId);
    this.validatePitch(pitch);
    this.validateVelocity(velocity);
    this._pitch = pitch;
    this._velocity = velocity;
    this._range = range;
  }

  public static create(
    pitch: number,
    velocity: number,
    range: TimeRangeVO
  ): MidiNote {
    const noteId = MidiNoteId.create();
    return new MidiNote(noteId, pitch, velocity, range);
  }

  public setPitch(pitch: number): void {
    this.validatePitch(pitch);
    this._pitch = pitch;
    this.updateTimestamp();
  }

  public setVelocity(velocity: number): void {
    this.validateVelocity(velocity);
    this._velocity = velocity;
    this.updateTimestamp();
  }

  public setRange(range: TimeRangeVO): void {
    this._range = range;
    this.updateTimestamp();
  }

  public transpose(semitones: number): MidiNote {
    const newPitch = Math.max(0, Math.min(127, this._pitch + semitones));
    return new MidiNote(MidiNoteId.create(), newPitch, this._velocity, this._range);
  }

  public quantize(quantizeValue: QuantizeValue): MidiNote {
    const quantizedRange = this._range.quantize(quantizeValue);
    return new MidiNote(MidiNoteId.create(), this._pitch, this._velocity, quantizedRange);
  }

  public clone(): MidiNote {
    return new MidiNote(MidiNoteId.create(), this._pitch, this._velocity, this._range);
  }

  private validatePitch(pitch: number): void {
    if (pitch < 0 || pitch > 127) {
      throw new DomainError('INVALID_MIDI_PITCH', 'MIDI pitch must be between 0 and 127');
    }
  }

  private validateVelocity(velocity: number): void {
    if (velocity < 0 || velocity > 127) {
      throw new DomainError('INVALID_MIDI_VELOCITY', 'MIDI velocity must be between 0 and 127');
    }
  }

  // Getters
  public get pitch(): number { return this._pitch; }
  public get velocity(): number { return this._velocity; }
  public get range(): TimeRangeVO { return this._range; }
  public get noteId(): MidiNoteId { return this.id; }
  
  public get noteName(): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(this._pitch / 12) - 1;
    const note = noteNames[this._pitch % 12];
    return `${note}${octave}`;
  }
}
```

### 3. Updated Track Aggregate

```typescript
export class Track extends EventSourcedAggregateRoot<TrackId> {
  private constructor(
    private readonly _trackId: TrackId,
    private readonly _ownerId: PeerId,
    private readonly _trackType: TrackType,
    private _clips: Map<ClipId, Clip>, // Now stores Clip entities
    private _metadata: TrackMetadata,
    private _collaborationState: CollaborationState
  ) {
    super();
  }

  // Add clip entity to track
  public addClip(clip: Clip): void {
    this.validateClipType(clip);
    this.validateNoOverlap(clip.range);
    
    this._clips.set(clip.clipId, clip);
    this.raiseEvent(new ClipAddedToTrackEvent(this._trackId, clip.clipId, clip.getType()));
  }

  // Remove clip from track
  public removeClip(clipId: ClipId): void {
    const clip = this._clips.get(clipId);
    if (!clip) {
      throw new DomainError('CLIP_NOT_FOUND', 'Clip not found in track');
    }

    this._clips.delete(clipId);
    this.raiseEvent(new ClipRemovedFromTrackEvent(this._trackId, clipId, clip.getType()));
  }

  // Move clip within track
  public moveClip(clipId: ClipId, newRange: TimeRangeVO): void {
    const clip = this._clips.get(clipId);
    if (!clip) {
      throw new DomainError('CLIP_NOT_FOUND', 'Clip not found in track');
    }

    // Validate no overlap with other clips
    this.validateNoOverlapExcept(newRange, clipId);
    
    const oldRange = clip.range;
    clip.moveToRange(newRange);
    this.raiseEvent(new ClipMovedInTrackEvent(this._trackId, clipId, oldRange, newRange));
  }

  // MIDI-specific operations
  public addMidiNoteToClip(clipId: ClipId, note: MidiNote): void {
    if (!this._trackType.isInstrument()) {
      throw new DomainError('TRACK_TYPE_MISMATCH', 'Only instrument tracks can contain MIDI notes');
    }

    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE', 'MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    midiClip.addNote(note);
    this.raiseEvent(new MidiNoteAddedToTrackEvent(this._trackId, clipId, note.noteId));
  }

  public removeMidiNoteFromClip(clipId: ClipId, noteId: MidiNoteId): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE', 'MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    midiClip.removeNote(noteId);
    this.raiseEvent(new MidiNoteRemovedFromTrackEvent(this._trackId, clipId, noteId));
  }

  private validateClipType(clip: Clip): void {
    if (this._trackType.isAudio() && clip.getType() !== ClipType.AUDIO) {
      throw new DomainError('CLIP_TYPE_MISMATCH', 'Audio tracks can only contain audio clips');
    }
    if (this._trackType.isInstrument() && clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_TYPE_MISMATCH', 'Instrument tracks can only contain MIDI clips');
    }
  }

  private validateNoOverlap(range: TimeRangeVO): void {
    for (const clip of this._clips.values()) {
      if (clip.range.intersects(range)) {
        throw new DomainError('CLIP_OVERLAP', 'Clips cannot overlap');
      }
    }
  }

  private validateNoOverlapExcept(range: TimeRangeVO, excludeClipId: ClipId): void {
    for (const [clipId, clip] of this._clips) {
      if (!clipId.equals(excludeClipId) && clip.range.intersects(range)) {
        throw new DomainError('CLIP_OVERLAP', 'Clips cannot overlap');
      }
    }
  }

  // Getters
  public get clips(): ReadonlyMap<ClipId, Clip> { return this._clips; }
  public getClip(clipId: ClipId): Clip | undefined { return this._clips.get(clipId); }
}
```

### 4. Repository Patterns

```typescript
// Clip Repository Interface
export interface ClipRepository {
  findById(id: ClipId): Promise<Clip | null>;
  save(clip: Clip): Promise<void>;
  delete(id: ClipId): Promise<void>;
  findByTrackId(trackId: TrackId): Promise<Clip[]>;
}

// Track Repository with Clip Management
export interface TrackRepository extends IRepository<Track, TrackId> {
  saveWithClips(track: Track): Promise<void>;
  loadWithClips(id: TrackId): Promise<Track | null>;
}
```

## Benefits of Clip as Entity

### ✅ Proper Domain Modeling

1. **Clear Identity**: Each clip has a unique identity that persists over time
2. **Lifecycle Management**: Clips can be created, modified, and deleted independently
3. **State Encapsulation**: Clip state is properly encapsulated within the entity
4. **Business Logic**: Complex clip operations are contained within the entity

### ✅ Better Persistence

1. **Independent Storage**: Clips can be stored and retrieved independently
2. **Relationship Management**: Clear relationships between tracks and clips
3. **Event Sourcing**: Clip changes generate their own domain events
4. **Caching**: Individual clips can be cached and managed separately

### ✅ Enhanced Collaboration

1. **Granular Operations**: Individual clip operations can be synchronized
2. **Conflict Resolution**: Easier to resolve conflicts at the clip level
3. **Permission Management**: Permissions can be applied per clip
4. **Audit Trail**: Complete history of clip changes

### ✅ Improved Performance

1. **Lazy Loading**: Clips can be loaded on demand
2. **Selective Updates**: Only modified clips need to be saved
3. **Memory Management**: Better control over clip lifecycle in memory
4. **Batch Operations**: Multiple clip operations can be batched efficiently

## Migration Strategy

1. **Phase 1**: Implement Clip entities alongside existing VO design
2. **Phase 2**: Update Track aggregate to work with Clip entities
3. **Phase 3**: Implement Clip repositories and persistence
4. **Phase 4**: Migrate existing data from VO to Entity model
5. **Phase 5**: Remove old VO-based implementation

This corrected design properly reflects the domain characteristics of clips and provides a solid foundation for complex DAW functionality. 