import { DomainEvent } from '../../../../core/events/DomainEvent';
import { UndoableEvent } from '../../domain/events/MidiEvents';
import type { EventStore } from '../../infrastructure/events/EventStore';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { Track } from '../../domain/aggregates/Track';
import { TrackId } from '../../domain/value-objects/TrackId';
import { DomainError } from '../../domain/errors/DomainError';

/**
 * Command for undo/redo operations
 */
export interface UndoRedoCommand {
  aggregateId: string;
  commandType: 'undo' | 'redo';
  userId: string;
  timestamp: Date;
}

/**
 * Undo/Redo operation result
 */
export interface UndoRedoResult {
  success: boolean;
  eventsApplied: DomainEvent[];
  newVersion: number;
  error?: string;
}

/**
 * Undo/Redo stack entry
 */
interface UndoRedoStackEntry {
  originalEvent: UndoableEvent;
  undoEvent: DomainEvent;
  aggregateId: string;
  version: number;
  timestamp: Date;
  userId: string;
}

/**
 * Undo/Redo Service
 * Manages undo/redo operations using event sourcing
 * Maintains separate undo/redo stacks per aggregate
 */
export class UndoRedoService {
  private undoStacks: Map<string, UndoRedoStackEntry[]> = new Map();
  private redoStacks: Map<string, UndoRedoStackEntry[]> = new Map();
  private readonly maxStackSize: number = 50; // Configurable stack size

  constructor(
    private eventStore: EventStore,
    private trackRepository: TrackRepository
  ) {}

  /**
   * Record an undoable event for future undo operations
   */
  public async recordUndoableEvent(
    event: UndoableEvent,
    aggregateId: string,
    version: number,
    userId: string
  ): Promise<void> {
    try {
      // Create undo event
      const undoEvent = event.createUndoEvent();
      
      // Create stack entry
      const stackEntry: UndoRedoStackEntry = {
        originalEvent: event,
        undoEvent,
        aggregateId,
        version,
        timestamp: new Date(),
        userId
      };

      // Add to undo stack
      this.addToUndoStack(aggregateId, stackEntry);
      
      // Clear redo stack when new operation is recorded
      this.clearRedoStack(aggregateId);
      
    } catch (error) {
      console.error('Failed to record undoable event:', error);
      throw DomainError.operationNotPermitted('recordUndoableEvent', 'Failed to create undo event');
    }
  }

  /**
   * Undo the last operation for an aggregate
   */
  public async undo(aggregateId: string, userId: string): Promise<UndoRedoResult> {
    const undoStack = this.undoStacks.get(aggregateId) || [];
    
    if (undoStack.length === 0) {
      return {
        success: false,
        eventsApplied: [],
        newVersion: 0,
        error: 'Nothing to undo'
      };
    }

    try {
      // Get the last undoable operation
      const lastEntry = undoStack[undoStack.length - 1];
      
      // Verify user permissions (basic check)
      if (lastEntry.userId !== userId) {
        throw DomainError.operationNotPermitted('undo', 'User can only undo their own operations');
      }

      // Load current aggregate state
      const track = await this.loadTrackFromEvents(aggregateId);
      if (!track) {
        throw DomainError.trackNotFound(aggregateId);
      }

      // Get current version
      const currentEvents = await this.eventStore.getEventsForAggregate(aggregateId);
      const currentVersion = currentEvents.length;

      // Apply undo event
      const undoEvents = [lastEntry.undoEvent];
      await this.eventStore.saveEvents(aggregateId, undoEvents, currentVersion);

      // Move from undo stack to redo stack
      this.moveToRedoStack(aggregateId, lastEntry);

      return {
        success: true,
        eventsApplied: undoEvents,
        newVersion: currentVersion + 1,
      };

    } catch (error) {
      console.error('Undo operation failed:', error);
      return {
        success: false,
        eventsApplied: [],
        newVersion: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Redo the last undone operation for an aggregate
   */
  public async redo(aggregateId: string, userId: string): Promise<UndoRedoResult> {
    const redoStack = this.redoStacks.get(aggregateId) || [];
    
    if (redoStack.length === 0) {
      return {
        success: false,
        eventsApplied: [],
        newVersion: 0,
        error: 'Nothing to redo'
      };
    }

    try {
      // Get the last undone operation
      const lastEntry = redoStack[redoStack.length - 1];
      
      // Verify user permissions
      if (lastEntry.userId !== userId) {
        throw DomainError.operationNotPermitted('redo', 'User can only redo their own operations');
      }

      // Load current aggregate state
      const track = await this.loadTrackFromEvents(aggregateId);
      if (!track) {
        throw DomainError.trackNotFound(aggregateId);
      }

      // Get current version
      const currentEvents = await this.eventStore.getEventsForAggregate(aggregateId);
      const currentVersion = currentEvents.length;

      // Apply original event (redo)
      const redoEvents = [lastEntry.originalEvent];
      await this.eventStore.saveEvents(aggregateId, redoEvents, currentVersion);

      // Move from redo stack back to undo stack
      this.moveToUndoStack(aggregateId, lastEntry);

      return {
        success: true,
        eventsApplied: redoEvents,
        newVersion: currentVersion + 1,
      };

    } catch (error) {
      console.error('Redo operation failed:', error);
      return {
        success: false,
        eventsApplied: [],
        newVersion: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if undo is available for an aggregate
   */
  public canUndo(aggregateId: string): boolean {
    const undoStack = this.undoStacks.get(aggregateId) || [];
    return undoStack.length > 0;
  }

  /**
   * Check if redo is available for an aggregate
   */
  public canRedo(aggregateId: string): boolean {
    const redoStack = this.redoStacks.get(aggregateId) || [];
    return redoStack.length > 0;
  }

  /**
   * Get undo stack size for an aggregate
   */
  public getUndoStackSize(aggregateId: string): number {
    const undoStack = this.undoStacks.get(aggregateId) || [];
    return undoStack.length;
  }

  /**
   * Get redo stack size for an aggregate
   */
  public getRedoStackSize(aggregateId: string): number {
    const redoStack = this.redoStacks.get(aggregateId) || [];
    return redoStack.length;
  }

  /**
   * Clear all undo/redo history for an aggregate
   */
  public clearHistory(aggregateId: string): void {
    this.undoStacks.delete(aggregateId);
    this.redoStacks.delete(aggregateId);
  }

  /**
   * Get undo/redo history for debugging
   */
  public getHistory(aggregateId: string): {
    undoStack: UndoRedoStackEntry[];
    redoStack: UndoRedoStackEntry[];
  } {
    return {
      undoStack: [...(this.undoStacks.get(aggregateId) || [])],
      redoStack: [...(this.redoStacks.get(aggregateId) || [])]
    };
  }

  /**
   * Batch undo multiple operations
   */
  public async batchUndo(
    aggregateId: string, 
    count: number, 
    userId: string
  ): Promise<UndoRedoResult> {
    const results: DomainEvent[] = [];
    let currentVersion = 0;

    try {
      for (let i = 0; i < count; i++) {
        const result = await this.undo(aggregateId, userId);
        if (!result.success) {
          break;
        }
        results.push(...result.eventsApplied);
        currentVersion = result.newVersion;
      }

      return {
        success: results.length > 0,
        eventsApplied: results,
        newVersion: currentVersion,
      };

    } catch (error) {
      return {
        success: false,
        eventsApplied: results,
        newVersion: currentVersion,
        error: error instanceof Error ? error.message : 'Batch undo failed'
      };
    }
  }

  /**
   * Batch redo multiple operations
   */
  public async batchRedo(
    aggregateId: string, 
    count: number, 
    userId: string
  ): Promise<UndoRedoResult> {
    const results: DomainEvent[] = [];
    let currentVersion = 0;

    try {
      for (let i = 0; i < count; i++) {
        const result = await this.redo(aggregateId, userId);
        if (!result.success) {
          break;
        }
        results.push(...result.eventsApplied);
        currentVersion = result.newVersion;
      }

      return {
        success: results.length > 0,
        eventsApplied: results,
        newVersion: currentVersion,
      };

    } catch (error) {
      return {
        success: false,
        eventsApplied: results,
        newVersion: currentVersion,
        error: error instanceof Error ? error.message : 'Batch redo failed'
      };
    }
  }

  // Private helper methods

  private addToUndoStack(aggregateId: string, entry: UndoRedoStackEntry): void {
    let undoStack = this.undoStacks.get(aggregateId) || [];
    
    // Add new entry
    undoStack.push(entry);
    
    // Enforce max stack size
    if (undoStack.length > this.maxStackSize) {
      undoStack = undoStack.slice(-this.maxStackSize);
    }
    
    this.undoStacks.set(aggregateId, undoStack);
  }

  private addToRedoStack(aggregateId: string, entry: UndoRedoStackEntry): void {
    let redoStack = this.redoStacks.get(aggregateId) || [];
    
    // Add new entry
    redoStack.push(entry);
    
    // Enforce max stack size
    if (redoStack.length > this.maxStackSize) {
      redoStack = redoStack.slice(-this.maxStackSize);
    }
    
    this.redoStacks.set(aggregateId, redoStack);
  }

  private moveToRedoStack(aggregateId: string, entry: UndoRedoStackEntry): void {
    // Remove from undo stack
    const undoStack = this.undoStacks.get(aggregateId) || [];
    const newUndoStack = undoStack.slice(0, -1);
    this.undoStacks.set(aggregateId, newUndoStack);
    
    // Add to redo stack
    this.addToRedoStack(aggregateId, entry);
  }

  private moveToUndoStack(aggregateId: string, entry: UndoRedoStackEntry): void {
    // Remove from redo stack
    const redoStack = this.redoStacks.get(aggregateId) || [];
    const newRedoStack = redoStack.slice(0, -1);
    this.redoStacks.set(aggregateId, newRedoStack);
    
    // Add to undo stack
    this.addToUndoStack(aggregateId, entry);
  }

  private clearRedoStack(aggregateId: string): void {
    this.redoStacks.delete(aggregateId);
  }

  private async loadTrackFromEvents(aggregateId: string): Promise<Track | null> {
    try {
      const trackId = TrackId.fromString(aggregateId);
      const events = await this.eventStore.getEventsForAggregate(aggregateId);
      
      if (events.length === 0) {
        return null;
      }

      return Track.fromHistory(trackId, events);
    } catch (error) {
      console.error('Failed to load track from events:', error);
      return null;
    }
  }
} 