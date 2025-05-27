# MusicArrangement Bounded Context (BC) - Technical Specification

## Overview

The MusicArrangement BC is responsible for managing digital audio workstation (DAW) functionality, including audio and MIDI track management, clip operations, real-time collaboration, and audio playback integration. This BC replaces and extends the original Track BC with enhanced collaboration and MIDI capabilities.

## Core Domain Concepts

### 1. Aggregates and Entities

| Type / Category | Role | Key Properties | Main Behaviors | Invariants |
|----------------|------|----------------|----------------|------------|
| **Track** (Aggregate Root) | Unified track abstraction | `trackId: TrackId`<br>`ownerId: PeerId`<br>`trackType: TrackType`<br>`clips: Map<ClipId, Clip>`<br>`collaborationState: CollaborationState` | `addClip(clip)`<br>`moveClip(id, newRange)`<br>`removeClip(id)`<br>`addMidiNoteToClip(clipId, note)`<br>`quantizeMidiClip(clipId, value)` | Clips must not overlap<br>Clip type must match track type |
| **Clip** (Entity) | Audio/MIDI content container | `clipId: ClipId`<br>`range: TimeRangeVO`<br>`metadata: ClipMetadata`<br>`createdAt: Date`<br>`updatedAt: Date` | `moveToRange(range)`<br>`updateMetadata(metadata)`<br>`getType()`<br>`clone()` | `range.start ≥ 0`<br>`range.length > 0` |
| **AudioClip** (Entity) | Audio content entity | `audioSource: AudioSourceRef`<br>`gain: number`<br>`fadeIn?: number`<br>`fadeOut?: number` | `setGain(gain)`<br>`setFadeIn(time)`<br>`setFadeOut(time)` | `gain ≥ 0`<br>`fadeIn, fadeOut ≥ 0` |
| **MidiClip** (Entity) | MIDI content entity | `notes: Map<string, MidiNote>`<br>`instrument: InstrumentRef`<br>`velocity?: number` | `addNote(note)`<br>`removeNote(noteId)`<br>`quantizeNotes(value)`<br>`transposeNotes(semitones)` | Notes must be within clip range<br>No overlapping notes with same pitch |
| **MidiNote** (Entity) | Individual MIDI note | `noteId: MidiNoteId`<br>`pitch: number (0-127)`<br>`velocity: number (0-127)`<br>`range: TimeRangeVO` | `setPitch(pitch)`<br>`setVelocity(velocity)`<br>`transpose(semitones)`<br>`quantize(value)` | `0 ≤ pitch ≤ 127`<br>`0 ≤ velocity ≤ 127` |

### 2. Value Objects

#### Core Value Objects

- **TimeRangeVO**: Represents time segments with start and length
- **TrackType**: Enum for AUDIO, INSTRUMENT, BUS track types
- **ClipId**: Unique identifier for clips (extends @core/UniqueId)
- **TrackId**: Unique identifier for tracks (extends @core/UniqueId)
- **MidiNoteId**: Unique identifier for MIDI notes (extends @core/UniqueId)

#### Audio-specific Value Objects

- **AudioSourceRef**: Reference to audio sources (samples, recordings)
- **Bpm**: BPM value object with validation (30-300 range)

#### MIDI-specific Value Objects

- **InstrumentRef**: Reference to instruments (synth, sampler, plugin)
- **QuantizeValue**: Quantization settings (1/4, 1/8, 1/16, etc.)
- **VectorClock**: For collaboration conflict resolution

#### Metadata Value Objects

- **ClipMetadata**: Clip metadata (name, color, tags, etc.)
- **TrackMetadata**: Track metadata (name, color, volume, pan, etc.)

## Architecture Design

### 1. Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (React Components, UI Controllers)                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ MusicArrangement│ │ EventSynchronizer│ │ MidiArrangement ││
│  │    Service      │ │                 │ │    Service      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Collaboration   │ │   AudioAdapter  │ │ MidiAudioAdapter││
│  │    Adapter      │ │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Track Aggregate │ │ Clip Entities   │ │ Domain Services ││
│  │                 │ │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Domain Events   │ │  Value Objects  │ │   Factories     ││
│  │                 │ │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Repositories  │ │     Adapters    │ │   Persistence   ││
│  │                 │ │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2. Integration with Core Framework

#### Base Classes Usage

```typescript
// Domain Layer - Using @core base classes
import { AggregateRoot } from '@core/entities/AggregateRoot';
import { Entity } from '@core/entities/Entity';
import { ValueObject } from '@core/value-objects/ValueObject';
import { UniqueId } from '@core/value-objects/UniqueId';
import { DomainEvent } from '@core/events/DomainEvent';

// Track Aggregate extends core AggregateRoot
export class Track extends AggregateRoot {
  // Inherits domain event management from AggregateRoot
  // addDomainEvent(), getDomainEvents(), clearDomainEvents()
}

// Clip entities extend core Entity
export abstract class Clip extends Entity<ClipId> {
  // Inherits identity and lifecycle management from Entity
  // equals(), createdAt, updatedAt, updateTimestamp()
}

// All IDs extend core UniqueId
export class TrackId extends UniqueId<string> {
  public static create(): TrackId {
    return new TrackId(crypto.randomUUID());
  }
}

export class ClipId extends UniqueId<string> {
  public static create(): ClipId {
    return new ClipId(crypto.randomUUID());
  }
}

// All value objects extend core ValueObject
export class TimeRangeVO extends ValueObject<TimeRangeProps> {
  protected equalsCore(other: TimeRangeVO): boolean {
    return this.props.start === other.props.start && 
           this.props.length === other.props.length;
  }
}

// Repository interfaces extend core IRepository
import { IRepository } from '@core/repositories/IRepository';
export interface TrackRepository extends IRepository<Track, TrackId> {
  findByOwnerId(ownerId: PeerId): Promise<Track[]>;
  saveWithClips(track: Track): Promise<void>;
  loadWithClips(id: TrackId): Promise<Track | null>;
}

export interface ClipRepository extends IRepository<Clip, ClipId> {
  findByTrackId(trackId: TrackId): Promise<Clip[]>;
  findByType(type: ClipType): Promise<Clip[]>;
}
```

## Domain Model Implementation

### 1. Track Aggregate (Core)

```typescript
export class Track extends AggregateRoot {
  private constructor(
    private readonly _trackId: TrackId,
    private readonly _ownerId: PeerId,
    private readonly _trackType: TrackType,
    private _clips: Map<ClipId, Clip>, // Now stores Clip entities
    private _metadata: TrackMetadata,
    private _collaborationState: CollaborationState
  ) {
    super(); // Initialize AggregateRoot
  }

  // Factory method
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
      CollaborationState.initial()
    );
    
    // Add domain event using inherited method
    track.addDomainEvent(new TrackCreatedEvent(trackId, ownerId, trackType));
    return track;
  }

  // Core business logic - Add clip entity to track
  public addClip(clip: Clip): void {
    this.validateClipType(clip);
    this.validateNoOverlap(clip.range);
    
    this._clips.set(clip.clipId, clip);
    this.addDomainEvent(new ClipAddedToTrackEvent(this._trackId, clip.clipId, clip.getType()));
  }

  // Remove clip from track
  public removeClip(clipId: ClipId): void {
    const clip = this._clips.get(clipId);
    if (!clip) {
      throw new DomainError('CLIP_NOT_FOUND', 'Clip not found in track');
    }

    this._clips.delete(clipId);
    this.addDomainEvent(new ClipRemovedFromTrackEvent(this._trackId, clipId, clip.getType()));
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
    this.addDomainEvent(new ClipMovedInTrackEvent(this._trackId, clipId, oldRange, newRange));
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
    this.addDomainEvent(new MidiNoteAddedToTrackEvent(this._trackId, clipId, note.noteId));
  }

  public removeMidiNoteFromClip(clipId: ClipId, noteId: MidiNoteId): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE', 'MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    midiClip.removeNote(noteId);
    this.addDomainEvent(new MidiNoteRemovedFromTrackEvent(this._trackId, clipId, noteId));
  }

  public quantizeMidiClip(clipId: ClipId, quantizeValue: QuantizeValue): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE', 'MIDI clip not found');
    }

    const midiClip = clip as MidiClip;
    midiClip.quantizeNotes(quantizeValue);
    this.addDomainEvent(new MidiClipQuantizedInTrackEvent(this._trackId, clipId, quantizeValue));
  }

  // Collaboration support
  public applyRemoteOperation(operation: ClipOperation, peerId: PeerId): void {
    if (!this._collaborationState.canApplyOperation(operation, peerId)) {
      throw new DomainError('OPERATION_NOT_PERMITTED');
    }
    
    this.executeOperation(operation);
    this._collaborationState.recordOperation(operation, peerId);
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
  public get trackId(): TrackId { return this._trackId; }
  public get ownerId(): PeerId { return this._ownerId; }
  public get trackType(): TrackType { return this._trackType; }
  public get clips(): ReadonlyMap<ClipId, Clip> { return this._clips; }
  public getClip(clipId: ClipId): Clip | undefined { return this._clips.get(clipId); }
}
```

### 2. Clip Entity Hierarchy

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

  protected addDomainEvent(event: DomainEvent): void {
    // Clip entities can also raise domain events
    // These will be collected by the Track aggregate
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

### 3. MIDI Note Entity

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

## Domain Events

### 1. Track-level Events

| Event Name | Trigger | Payload | Purpose |
|------------|---------|---------|---------|
| `TrackCreated` | `Track.create()` | `{ trackId, ownerId, trackType }` | Track initialization |
| `ClipAddedToTrack` | `Track.addClip()` | `{ trackId, clipId, clipType }` | Clip added to track |
| `ClipRemovedFromTrack` | `Track.removeClip()` | `{ trackId, clipId, clipType }` | Clip removed from track |
| `ClipMovedInTrack` | `Track.moveClip()` | `{ trackId, clipId, oldRange, newRange }` | Clip position changed |
| `MidiNoteAddedToTrack` | `Track.addMidiNoteToClip()` | `{ trackId, clipId, noteId }` | MIDI note added via track |
| `MidiNoteRemovedFromTrack` | `Track.removeMidiNoteFromClip()` | `{ trackId, clipId, noteId }` | MIDI note removed via track |

### 2. Clip-level Events

| Event Name | Trigger | Payload | Purpose |
|------------|---------|---------|---------|
| `AudioClipCreated` | `AudioClip.create()` | `{ clipId, range, audioSource }` | Audio clip creation |
| `MidiClipCreated` | `MidiClip.create()` | `{ clipId, range, instrument }` | MIDI clip creation |
| `ClipMoved` | `Clip.moveToRange()` | `{ clipId, newRange }` | Clip range changed |
| `ClipMetadataUpdated` | `Clip.updateMetadata()` | `{ clipId, metadata }` | Clip metadata changed |
| `AudioClipGainChanged` | `AudioClip.setGain()` | `{ clipId, gain }` | Audio clip gain changed |
| `MidiNoteAdded` | `MidiClip.addNote()` | `{ clipId, note }` | MIDI note added to clip |
| `MidiNoteRemoved` | `MidiClip.removeNote()` | `{ clipId, note }` | MIDI note removed from clip |
| `MidiClipQuantized` | `MidiClip.quantizeNotes()` | `{ clipId, quantizeValue, originalNotes }` | MIDI clip quantized |
| `MidiClipTransposed` | `MidiClip.transposeNotes()` | `{ clipId, semitones, originalNotes }` | MIDI clip transposed |

### 3. Integration Events (Cross-BC)

| Event Name | Publisher | Subscriber | Payload | Purpose |
|------------|-----------|------------|---------|---------|
| `music.track-operation` | MusicArrangement App | Collaboration BC | `{ operation, trackId, peerId }` | Real-time collaboration |
| `music.clip-operation` | MusicArrangement App | Collaboration BC | `{ operation, clipId, peerId }` | Clip-level collaboration |
| `jam.clock-tick` | JamSession BC | MusicArrangement | `{ positionSeconds, bpm }` | Playback synchronization |
| `jam.round-started` | JamSession BC | MusicArrangement | `{ roundId, tempo, bars }` | Jam session coordination |
| `sample.uploaded` | Upload BC | MusicArrangement | `{ sampleId, metadata }` | New audio source available |
| `plugin.loaded` | Plugin BC | MusicArrangement | `{ pluginId, instrumentRef }` | New instrument available |

## Application Services

### 1. MusicArrangementService

```typescript
@injectable()
export class MusicArrangementService {
  constructor(
    private trackRepository: TrackRepository,
    private clipRepository: ClipRepository,
    private eventBus: IEventBus,
    private collaborationAdapter: CollaborationAdapter
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

  // Clip operations
  async createAudioClip(
    trackId: TrackId,
    range: TimeRangeVO,
    audioSource: AudioSourceRef,
    metadata: ClipMetadata
  ): Promise<ClipId> {
    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new ApplicationError('TRACK_NOT_FOUND');
    }

    const audioClip = AudioClip.create(range, audioSource, metadata);
    track.addClip(audioClip);
    
    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(audioClip);
    
    this.publishDomainEvents(track);
    
    return audioClip.clipId;
  }

  async createMidiClip(
    trackId: TrackId,
    range: TimeRangeVO,
    instrument: InstrumentRef,
    metadata: ClipMetadata
  ): Promise<ClipId> {
    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new ApplicationError('TRACK_NOT_FOUND');
    }

    const midiClip = MidiClip.create(range, instrument, metadata);
    track.addClip(midiClip);
    
    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(midiClip);
    
    this.publishDomainEvents(track);
    
    return midiClip.clipId;
  }

  // MIDI operations
  async addMidiNote(
    trackId: TrackId,
    clipId: ClipId,
    pitch: number,
    velocity: number,
    range: TimeRangeVO
  ): Promise<MidiNoteId> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new ApplicationError('TRACK_NOT_FOUND');
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
      throw new ApplicationError('TRACK_NOT_FOUND');
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
      throw new ApplicationError('TRACK_NOT_FOUND');
    }

    track.quantizeMidiClip(clipId, quantizeValue);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  // Collaboration
  async applyRemoteOperation(
    trackId: TrackId,
    operation: ClipOperation,
    peerId: PeerId
  ): Promise<void> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw new ApplicationError('TRACK_NOT_FOUND');
    }

    track.applyRemoteOperation(operation, peerId);
    
    await this.trackRepository.saveWithClips(track);
    
    this.publishDomainEvents(track);
  }

  private publishDomainEvents(aggregate: AggregateRoot): void {
    const events = aggregate.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    aggregate.clearDomainEvents();
  }
}
```

## Repository Implementations

### 1. Track Repository

```typescript
@injectable()
export class TrackRepositoryImpl implements TrackRepository {
  constructor(
    private dataSource: DataSource,
    private clipRepository: ClipRepository
  ) {}

  async findById(id: TrackId): Promise<Track | null> {
    // Implementation for basic track loading
    // Does not include clips by default for performance
  }

  async save(track: Track): Promise<void> {
    // Save track without clips
  }

  async saveWithClips(track: Track): Promise<void> {
    // Save track and all its clips in a transaction
    await this.dataSource.transaction(async (manager) => {
      // Save track
      await this.saveTrackEntity(track, manager);
      
      // Save all clips
      for (const clip of track.clips.values()) {
        await this.clipRepository.save(clip);
      }
    });
  }

  async loadWithClips(id: TrackId): Promise<Track | null> {
    // Load track with all its clips
    const track = await this.findById(id);
    if (!track) return null;

    const clips = await this.clipRepository.findByTrackId(id);
    // Reconstruct track with clips
    
    return track;
  }

  async findByOwnerId(ownerId: PeerId): Promise<Track[]> {
    // Find all tracks owned by a specific peer
  }
}
```

### 2. Clip Repository

```typescript
@injectable()
export class ClipRepositoryImpl implements ClipRepository {
  constructor(private dataSource: DataSource) {}

  async findById(id: ClipId): Promise<Clip | null> {
    // Load clip by ID, determining type and creating appropriate entity
  }

  async save(clip: Clip): Promise<void> {
    // Save clip entity, handling polymorphism
    if (clip instanceof AudioClip) {
      await this.saveAudioClip(clip);
    } else if (clip instanceof MidiClip) {
      await this.saveMidiClip(clip);
    }
  }

  async delete(id: ClipId): Promise<void> {
    // Delete clip and related data
  }

  async findByTrackId(trackId: TrackId): Promise<Clip[]> {
    // Find all clips belonging to a track
  }

  async findByType(type: ClipType): Promise<Clip[]> {
    // Find clips by type (AUDIO or MIDI)
  }

  private async saveAudioClip(clip: AudioClip): Promise<void> {
    // Save audio clip specific data
  }

  private async saveMidiClip(clip: MidiClip): Promise<void> {
    // Save MIDI clip and all its notes
    await this.dataSource.transaction(async (manager) => {
      // Save clip
      await this.saveMidiClipEntity(clip, manager);
      
      // Save all notes
      for (const note of clip.notes) {
        await this.saveMidiNote(note, clip.clipId, manager);
      }
    });
  }
}
```

## Benefits of Entity-based Design

### ✅ Proper Domain Modeling

1. **Clear Identity**: Each clip and note has unique identity that persists over time
2. **Lifecycle Management**: Entities can be created, modified, and deleted independently
3. **State Encapsulation**: Entity state is properly encapsulated with business logic
4. **Rich Behavior**: Complex operations are contained within the appropriate entities

### ✅ Better Persistence

1. **Independent Storage**: Clips can be stored and retrieved independently
2. **Relationship Management**: Clear relationships between tracks, clips, and notes
3. **Event Sourcing Ready**: Entity changes generate domain events naturally
4. **Caching**: Individual entities can be cached and managed separately

### ✅ Enhanced Collaboration

1. **Granular Operations**: Individual entity operations can be synchronized
2. **Conflict Resolution**: Easier to resolve conflicts at the entity level
3. **Permission Management**: Permissions can be applied per entity
4. **Audit Trail**: Complete history of entity changes

### ✅ Improved Performance

1. **Lazy Loading**: Entities can be loaded on demand
2. **Selective Updates**: Only modified entities need to be saved
3. **Memory Management**: Better control over entity lifecycle in memory
4. **Batch Operations**: Multiple entity operations can be batched efficiently

This design provides a solid foundation for complex DAW functionality while maintaining proper domain modeling principles and supporting advanced features like undo/redo, real-time collaboration, and audio integration.
