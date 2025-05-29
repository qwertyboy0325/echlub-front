# MusicArrangement BC - Undo/Redo Design Extension

## Overview

This document extends the MusicArrangement BC design to support comprehensive undo/redo functionality for MIDI operations, leveraging the existing @core event sourcing infrastructure.

## Current Limitations

1. **Basic AggregateRoot Usage**: Current design uses `@core/AggregateRoot` instead of `@core/EventSourcedAggregateRoot`
2. **No Command Pattern**: Missing command/handler pattern for operation tracking
3. **Limited State Reconstruction**: Cannot rebuild historical states
4. **No Operation History**: Lacks detailed operation tracking for undo/redo
5. **Entity-based Design**: With Clip and MidiNote as entities, we need proper event sourcing for all entities

## Enhanced Architecture for Undo/Redo

### 1. Event Sourced Track Aggregate

```typescript
// Enhanced Track aggregate with event sourcing
export class Track extends EventSourcedAggregateRoot<TrackId> {
  private constructor(
    private readonly _trackId: TrackId,
    private readonly _ownerId: PeerId,
    private readonly _trackType: TrackType,
    private _clips: Map<ClipId, Clip>, // Now stores Clip entities
    private _metadata: TrackMetadata,
    private _collaborationState: CollaborationState
  ) {
    super(); // Initialize EventSourcedAggregateRoot
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
      CollaborationState.initial()
    );
    
    // Raise event instead of direct state change
    track.raiseEvent(new TrackCreatedEvent(trackId, ownerId, trackType));
    return track;
  }

  // MIDI operations that raise events
  public addMidiNoteToClip(clipId: ClipId, note: MidiNote): void {
    if (!this._trackType.isInstrument()) {
      throw new DomainError('TRACK_TYPE_MISMATCH');
    }
    
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE');
    }
    
    // Raise event instead of direct modification
    this.raiseEvent(new MidiNoteAddedEvent(this._trackId, clipId, note));
  }

  public removeMidiNoteFromClip(clipId: ClipId, noteId: MidiNoteId): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE');
    }
    
    const midiClip = clip as MidiClip;
    const note = midiClip.notes.find(n => n.noteId.equals(noteId));
    if (!note) {
      throw new DomainError('NOTE_NOT_FOUND');
    }
    
    this.raiseEvent(new MidiNoteRemovedEvent(this._trackId, clipId, noteId, note));
  }

  public updateMidiNote(clipId: ClipId, noteId: MidiNoteId, newNote: MidiNote): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE');
    }
    
    const midiClip = clip as MidiClip;
    const oldNote = midiClip.notes.find(n => n.noteId.equals(noteId));
    if (!oldNote) {
      throw new DomainError('NOTE_NOT_FOUND');
    }
    
    this.raiseEvent(new MidiNoteUpdatedEvent(this._trackId, clipId, noteId, oldNote, newNote));
  }

  public quantizeMidiClip(clipId: ClipId, quantizeValue: QuantizeValue): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE');
    }
    
    const midiClip = clip as MidiClip;
    const originalNotes = [...midiClip.notes];
    this.raiseEvent(new MidiClipQuantizedEvent(this._trackId, clipId, quantizeValue, originalNotes));
  }

  public transposeMidiClip(clipId: ClipId, semitones: number): void {
    const clip = this._clips.get(clipId);
    if (!clip || clip.getType() !== ClipType.MIDI) {
      throw new DomainError('CLIP_NOT_FOUND_OR_WRONG_TYPE');
    }
    
    const midiClip = clip as MidiClip;
    const originalNotes = [...midiClip.notes];
    this.raiseEvent(new MidiClipTransposedEvent(this._trackId, clipId, semitones, originalNotes));
  }

  // Event application method (required by EventSourcedAggregateRoot)
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventName) {
      case 'TrackCreated':
        this.applyTrackCreatedEvent(event as TrackCreatedEvent);
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
      // ... other event handlers
    }
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
}
```

### 2. Enhanced MIDI Events with Undo Information

```typescript
// Enhanced MIDI events with undo/redo support
export class MidiNoteAddedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly note: MidiNoteVO,
    public readonly insertIndex?: number // For precise undo positioning
  ) {
    super('MidiNoteAdded', trackId.toString());
  }

  // Create inverse event for undo
  public createUndoEvent(): MidiNoteRemovedEvent {
    const noteIndex = this.insertIndex ?? -1; // Will need to be calculated
    return new MidiNoteRemovedEvent(this.trackId, this.clipId, noteIndex, this.note);
  }
}

export class MidiNoteRemovedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly removedNote: MidiNote // Store removed note for undo
  ) {
    super('MidiNoteRemoved', trackId.toString());
  }

  public createUndoEvent(): MidiNoteAddedEvent {
    return new MidiNoteAddedEvent(this.trackId, this.clipId, this.removedNote);
  }
}

export class MidiNoteUpdatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly oldNote: MidiNote, // Store old state for undo
    public readonly newNote: MidiNote
  ) {
    super('MidiNoteUpdated', trackId.toString());
  }

  public createUndoEvent(): MidiNoteUpdatedEvent {
    return new MidiNoteUpdatedEvent(this.trackId, this.clipId, this.noteId, this.newNote, this.oldNote);
  }
}

export class MidiClipQuantizedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly quantizeValue: QuantizeValue,
    public readonly originalNotes: MidiNote[] // Store original state for undo
  ) {
    super('MidiClipQuantized', trackId.toString());
  }

  public createUndoEvent(): MidiClipNotesReplacedEvent {
    return new MidiClipNotesReplacedEvent(this.trackId, this.clipId, this.originalNotes);
  }
}

export class MidiClipTransposedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly semitones: number,
    public readonly originalNotes: MidiNote[]
  ) {
    super('MidiClipTransposed', trackId.toString());
  }

  public createUndoEvent(): MidiClipNotesReplacedEvent {
    return new MidiClipNotesReplacedEvent(this.trackId, this.clipId, this.originalNotes);
  }
}

// Utility event for restoring complete note state
export class MidiClipNotesReplacedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly notes: MidiNote[]
  ) {
    super('MidiClipNotesReplaced', trackId.toString());
  }
}
```

### 3. Command Pattern Implementation

```typescript
// Base command interface
export interface Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly userId: PeerId;
}

// Base command handler interface
export interface CommandHandler<T extends Command> {
  handle(command: T): Promise<CommandResult>;
}

export interface CommandResult {
  success: boolean;
  events: DomainEvent[];
  error?: string;
}

// MIDI Commands
export class AddMidiNoteCommand implements Command {
  public readonly commandId: string = nanoid();
  public readonly timestamp: Date = new Date();

  constructor(
    public readonly userId: PeerId,
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly note: MidiNote
  ) {}
}

export class RemoveMidiNoteCommand implements Command {
  public readonly commandId: string = nanoid();
  public readonly timestamp: Date = new Date();

  constructor(
    public readonly userId: PeerId,
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId
  ) {}
}

export class UpdateMidiNoteCommand implements Command {
  public readonly commandId: string = nanoid();
  public readonly timestamp: Date = new Date();

  constructor(
    public readonly userId: PeerId,
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly newNote: MidiNote
  ) {}
}

export class QuantizeMidiClipCommand implements Command {
  public readonly commandId: string = nanoid();
  public readonly timestamp: Date = new Date();

  constructor(
    public readonly userId: PeerId,
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly quantizeValue: QuantizeValue
  ) {}
}

// Command Handlers
@injectable()
export class AddMidiNoteCommandHandler implements CommandHandler<AddMidiNoteCommand> {
  constructor(
    private trackRepository: TrackRepository,
    private eventBus: IEventBus
  ) {}

  async handle(command: AddMidiNoteCommand): Promise<CommandResult> {
    try {
      const track = await this.trackRepository.findById(command.trackId);
      if (!track) {
        return { success: false, events: [], error: 'Track not found' };
      }

      track.addMidiNoteToClip(command.clipId, command.note);
      await this.trackRepository.save(track);

      const events = track.getUncommittedEvents();
      events.forEach(event => this.eventBus.publish(event));
      track.clearUncommittedEvents();

      return { success: true, events };
    } catch (error) {
      return { success: false, events: [], error: error.message };
    }
  }
}
```

### 4. Undo/Redo Service

```typescript
export interface UndoableEvent extends DomainEvent {
  createUndoEvent(): DomainEvent;
}

export interface OperationHistory {
  commandId: string;
  command: Command;
  events: DomainEvent[];
  timestamp: Date;
  userId: PeerId;
}

@injectable()
export class UndoRedoService {
  private undoStack: OperationHistory[] = [];
  private redoStack: OperationHistory[] = [];
  private maxHistorySize: number = 100;

  constructor(
    private trackRepository: TrackRepository,
    private eventBus: IEventBus
  ) {}

  // Record operation for undo/redo
  public recordOperation(command: Command, events: DomainEvent[]): void {
    const operation: OperationHistory = {
      commandId: command.commandId,
      command,
      events,
      timestamp: command.timestamp,
      userId: command.userId
    };

    this.undoStack.push(operation);
    
    // Clear redo stack when new operation is performed
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  // Undo last operation
  public async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) {
      return false;
    }

    const operation = this.undoStack.pop()!;
    
    try {
      // Create undo events from the original events
      const undoEvents = this.createUndoEvents(operation.events);
      
      // Apply undo events to the track
      await this.applyUndoEvents(operation.command, undoEvents);
      
      // Move operation to redo stack
      this.redoStack.push(operation);
      
      return true;
    } catch (error) {
      // If undo fails, put operation back
      this.undoStack.push(operation);
      throw error;
    }
  }

  // Redo last undone operation
  public async redo(): Promise<boolean> {
    if (this.redoStack.length === 0) {
      return false;
    }

    const operation = this.redoStack.pop()!;
    
    try {
      // Re-apply the original events
      await this.applyRedoEvents(operation.command, operation.events);
      
      // Move operation back to undo stack
      this.undoStack.push(operation);
      
      return true;
    } catch (error) {
      // If redo fails, put operation back
      this.redoStack.push(operation);
      throw error;
    }
  }

  private createUndoEvents(originalEvents: DomainEvent[]): DomainEvent[] {
    const undoEvents: DomainEvent[] = [];
    
    // Process events in reverse order for undo
    for (let i = originalEvents.length - 1; i >= 0; i--) {
      const event = originalEvents[i];
      
      if (this.isUndoableEvent(event)) {
        const undoEvent = (event as UndoableEvent).createUndoEvent();
        undoEvents.push(undoEvent);
      }
    }
    
    return undoEvents;
  }

  private async applyUndoEvents(originalCommand: Command, undoEvents: DomainEvent[]): Promise<void> {
    // Extract track ID from command
    const trackId = this.extractTrackId(originalCommand);
    const track = await this.trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Track not found for undo operation');
    }

    // Apply undo events
    undoEvents.forEach(event => {
      track.applyEvent(event);
    });

    await this.trackRepository.save(track);
    
    // Publish undo events
    undoEvents.forEach(event => this.eventBus.publish(event));
  }

  private async applyRedoEvents(command: Command, events: DomainEvent[]): Promise<void> {
    const trackId = this.extractTrackId(command);
    const track = await this.trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Track not found for redo operation');
    }

    // Re-apply original events
    events.forEach(event => {
      track.applyEvent(event);
    });

    await this.trackRepository.save(track);
    
    // Publish redo events
    events.forEach(event => this.eventBus.publish(event));
  }

  private isUndoableEvent(event: DomainEvent): event is UndoableEvent {
    return 'createUndoEvent' in event && typeof (event as any).createUndoEvent === 'function';
  }

  private extractTrackId(command: Command): TrackId {
    // Extract trackId from command based on command type
    if ('trackId' in command) {
      return (command as any).trackId;
    }
    throw new Error('Cannot extract trackId from command');
  }

  // Get undo/redo state
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoStackSize(): number {
    return this.undoStack.length;
  }

  public getRedoStackSize(): number {
    return this.redoStack.length;
  }

  // Clear history
  public clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
```

### 5. Enhanced MusicArrangementService with Undo/Redo

```typescript
@injectable()
export class MusicArrangementService {
  constructor(
    private trackRepository: TrackRepository,
    private eventBus: IEventBus,
    private undoRedoService: UndoRedoService,
    private addMidiNoteHandler: AddMidiNoteCommandHandler,
    private removeMidiNoteHandler: RemoveMidiNoteCommandHandler,
    private updateMidiNoteHandler: UpdateMidiNoteCommandHandler,
    private quantizeMidiClipHandler: QuantizeMidiClipCommandHandler
  ) {}

  async addMidiNote(
    userId: PeerId,
    trackId: TrackId,
    clipId: ClipId,
    pitch: number,
    velocity: number,
    range: TimeRangeVO
  ): Promise<void> {
    const note = MidiNote.create(pitch, velocity, range);
    const command = new AddMidiNoteCommand(userId, trackId, clipId, note);
    
    const result = await this.addMidiNoteHandler.handle(command);
    
    if (result.success) {
      // Record operation for undo/redo
      this.undoRedoService.recordOperation(command, result.events);
    } else {
      throw new Error(result.error);
    }
  }

  async removeMidiNote(
    userId: PeerId,
    trackId: TrackId,
    clipId: ClipId,
    noteId: MidiNoteId
  ): Promise<void> {
    const command = new RemoveMidiNoteCommand(userId, trackId, clipId, noteId);
    
    const result = await this.removeMidiNoteHandler.handle(command);
    
    if (result.success) {
      this.undoRedoService.recordOperation(command, result.events);
    } else {
      throw new Error(result.error);
    }
  }

  async updateMidiNote(
    userId: PeerId,
    trackId: TrackId,
    clipId: ClipId,
    noteId: MidiNoteId,
    newPitch: number,
    newVelocity: number,
    newRange: TimeRangeVO
  ): Promise<void> {
    const newNote = MidiNote.create(newPitch, newVelocity, newRange);
    const command = new UpdateMidiNoteCommand(userId, trackId, clipId, noteId, newNote);
    
    const result = await this.updateMidiNoteHandler.handle(command);
    
    if (result.success) {
      this.undoRedoService.recordOperation(command, result.events);
    } else {
      throw new Error(result.error);
    }
  }

  async quantizeMidiClip(
    userId: PeerId,
    trackId: TrackId,
    clipId: ClipId,
    quantizeValue: QuantizeValue
  ): Promise<void> {
    const command = new QuantizeMidiClipCommand(userId, trackId, clipId, quantizeValue);
    
    const result = await this.quantizeMidiClipHandler.handle(command);
    
    if (result.success) {
      this.undoRedoService.recordOperation(command, result.events);
    } else {
      throw new Error(result.error);
    }
  }

  // Undo/Redo operations
  async undo(): Promise<boolean> {
    return await this.undoRedoService.undo();
  }

  async redo(): Promise<boolean> {
    return await this.undoRedoService.redo();
  }

  canUndo(): boolean {
    return this.undoRedoService.canUndo();
  }

  canRedo(): boolean {
    return this.undoRedoService.canRedo();
  }
}
```

### 6. Repository Implementation with Event Sourcing

```typescript
@injectable()
export class EventSourcedTrackRepository implements TrackRepository {
  constructor(
    private eventStore: EventStore,
    private trackFactory: TrackFactory
  ) {}

  async findById(id: TrackId): Promise<Track | null> {
    const events = await this.eventStore.getEventsForAggregate(id.toString());
    
    if (events.length === 0) {
      return null;
    }

    // Create empty track and load from history
    const track = this.trackFactory.createEmpty(id);
    track.loadFromHistory(events);
    
    return track;
  }

  async save(track: Track): Promise<void> {
    const uncommittedEvents = track.getUncommittedEvents();
    
    if (uncommittedEvents.length === 0) {
      return;
    }

    await this.eventStore.saveEvents(
      track.trackId.toString(),
      uncommittedEvents,
      track.version - uncommittedEvents.length
    );

    track.clearUncommittedEvents();
  }

  // Additional methods for event sourcing
  async getEventHistory(id: TrackId, fromVersion?: number): Promise<DomainEvent[]> {
    return await this.eventStore.getEventsForAggregate(id.toString(), fromVersion);
  }

  async replayToVersion(id: TrackId, targetVersion: number): Promise<Track | null> {
    const events = await this.eventStore.getEventsForAggregate(id.toString());
    
    if (events.length === 0) {
      return null;
    }

    // Only replay events up to target version
    const eventsToReplay = events.slice(0, targetVersion + 1);
    
    const track = this.trackFactory.createEmpty(id);
    track.loadFromHistory(eventsToReplay);
    
    return track;
  }
}
```

## Implementation Benefits

### ✅ Complete MIDI Operation Undo/Redo Support

1. **Granular Operations**: Every MIDI note add/remove/update can be undone
2. **Bulk Operations**: Quantize and transpose operations store original state
3. **Precise State Reconstruction**: Event sourcing enables exact state replay
4. **User-specific History**: Operations are tracked per user for collaboration

### ✅ Event Sourcing Advantages

1. **Complete Audit Trail**: Every change is recorded as an event
2. **Time Travel**: Can replay to any point in history
3. **Debugging**: Full operation history for troubleshooting
4. **Collaboration**: Conflict resolution with complete operation context

### ✅ Performance Considerations

1. **Snapshot Support**: Periodic snapshots to avoid replaying all events
2. **Event Compaction**: Merge related events to reduce storage
3. **Lazy Loading**: Load events only when needed
4. **Memory Management**: Limit undo/redo stack size

## Migration Strategy

1. **Phase 1**: Implement EventSourcedAggregateRoot for Track
2. **Phase 2**: Add command pattern for MIDI operations
3. **Phase 3**: Implement UndoRedoService
4. **Phase 4**: Integrate with existing collaboration system
5. **Phase 5**: Add UI controls for undo/redo

This enhanced design provides comprehensive undo/redo capabilities for all MIDI operations while maintaining compatibility with the existing collaboration and audio integration systems. 