import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { UndoRedoService, UndoRedoResult } from '../services/UndoRedoService';
import { TrackId } from '../../domain/value-objects/TrackId';
import { DomainError } from '../../domain/errors/DomainError';
import { 
  BaseCommandHandler, 
  CommandContext, 
  CommandResult 
} from './BaseCommandHandler';

// Import the UndoRedoStackEntry interface
interface UndoRedoStackEntry {
  originalEvent: any;
  undoEvent: any;
  aggregateId: string;
  version: number;
  timestamp: Date;
  userId: string;
}

/**
 * Undo Command
 */
export interface UndoCommand {
  trackId: TrackId;
  userId: string;
}

/**
 * Redo Command
 */
export interface RedoCommand {
  trackId: TrackId;
  userId: string;
}

/**
 * Batch Undo Command
 */
export interface BatchUndoCommand {
  trackId: TrackId;
  count: number;
  userId: string;
}

/**
 * Batch Redo Command
 */
export interface BatchRedoCommand {
  trackId: TrackId;
  count: number;
  userId: string;
}

/**
 * Undo/Redo Command Handler
 * Handles undo and redo operations for tracks
 */
export class UndoRedoCommandHandler {
  constructor(
    private readonly trackRepository: TrackRepository,
    private readonly undoRedoService: UndoRedoService
  ) {}

  /**
   * Execute undo operation
   */
  public async undo(command: UndoCommand): Promise<CommandResult<UndoRedoResult>> {
    try {
      this.validateUndoCommand(command);

      // Check if undo is available
      if (!this.undoRedoService.canUndo(command.trackId.toString())) {
        return {
          success: false,
          error: 'Nothing to undo',
          eventsGenerated: 0,
          undoableEventsRecorded: 0
        };
      }

      // Execute undo
      const result = await this.undoRedoService.undo(
        command.trackId.toString(),
        command.userId
      );

      if (result.success) {
        console.log(`Undo successful for track ${command.trackId.toString()}`);
        console.log(`Applied ${result.eventsApplied.length} undo events`);
      }

      return {
        success: result.success,
        result,
        error: result.error,
        eventsGenerated: result.eventsApplied.length,
        undoableEventsRecorded: 0 // Undo doesn't create new undoable events
      };

    } catch (error) {
      console.error('Undo operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Undo failed',
        eventsGenerated: 0,
        undoableEventsRecorded: 0
      };
    }
  }

  /**
   * Execute redo operation
   */
  public async redo(command: RedoCommand): Promise<CommandResult<UndoRedoResult>> {
    try {
      this.validateRedoCommand(command);

      // Check if redo is available
      if (!this.undoRedoService.canRedo(command.trackId.toString())) {
        return {
          success: false,
          error: 'Nothing to redo',
          eventsGenerated: 0,
          undoableEventsRecorded: 0
        };
      }

      // Execute redo
      const result = await this.undoRedoService.redo(
        command.trackId.toString(),
        command.userId
      );

      if (result.success) {
        console.log(`Redo successful for track ${command.trackId.toString()}`);
        console.log(`Applied ${result.eventsApplied.length} redo events`);
      }

      return {
        success: result.success,
        result,
        error: result.error,
        eventsGenerated: result.eventsApplied.length,
        undoableEventsRecorded: 1 // Redo recreates the undoable event
      };

    } catch (error) {
      console.error('Redo operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Redo failed',
        eventsGenerated: 0,
        undoableEventsRecorded: 0
      };
    }
  }

  /**
   * Execute batch undo operation
   */
  public async batchUndo(command: BatchUndoCommand): Promise<CommandResult<UndoRedoResult>> {
    try {
      this.validateBatchUndoCommand(command);

      const result = await this.undoRedoService.batchUndo(
        command.trackId.toString(),
        command.count,
        command.userId
      );

      if (result.success) {
        console.log(`Batch undo successful for track ${command.trackId.toString()}`);
        console.log(`Applied ${result.eventsApplied.length} undo events`);
      }

      return {
        success: result.success,
        result,
        error: result.error,
        eventsGenerated: result.eventsApplied.length,
        undoableEventsRecorded: 0
      };

    } catch (error) {
      console.error('Batch undo operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch undo failed',
        eventsGenerated: 0,
        undoableEventsRecorded: 0
      };
    }
  }

  /**
   * Execute batch redo operation
   */
  public async batchRedo(command: BatchRedoCommand): Promise<CommandResult<UndoRedoResult>> {
    try {
      this.validateBatchRedoCommand(command);

      const result = await this.undoRedoService.batchRedo(
        command.trackId.toString(),
        command.count,
        command.userId
      );

      if (result.success) {
        console.log(`Batch redo successful for track ${command.trackId.toString()}`);
        console.log(`Applied ${result.eventsApplied.length} redo events`);
      }

      return {
        success: result.success,
        result,
        error: result.error,
        eventsGenerated: result.eventsApplied.length,
        undoableEventsRecorded: command.count // Each redo recreates an undoable event
      };

    } catch (error) {
      console.error('Batch redo operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch redo failed',
        eventsGenerated: 0,
        undoableEventsRecorded: 0
      };
    }
  }

  /**
   * Get undo/redo status for a track
   */
  public getUndoRedoStatus(trackId: TrackId): {
    canUndo: boolean;
    canRedo: boolean;
    undoStackSize: number;
    redoStackSize: number;
  } {
    const trackIdStr = trackId.toString();
    return {
      canUndo: this.undoRedoService.canUndo(trackIdStr),
      canRedo: this.undoRedoService.canRedo(trackIdStr),
      undoStackSize: this.undoRedoService.getUndoStackSize(trackIdStr),
      redoStackSize: this.undoRedoService.getRedoStackSize(trackIdStr)
    };
  }

  /**
   * Clear undo/redo history for a track
   */
  public clearHistory(trackId: TrackId): void {
    this.undoRedoService.clearHistory(trackId.toString());
    console.log(`Cleared undo/redo history for track ${trackId.toString()}`);
  }

  /**
   * Get undo/redo history for debugging
   */
  public getHistory(trackId: TrackId): {
    undoStack: UndoRedoStackEntry[];
    redoStack: UndoRedoStackEntry[];
  } {
    return this.undoRedoService.getHistory(trackId.toString());
  }

  // Validation methods

  private validateUndoCommand(command: UndoCommand): void {
    if (!command.trackId) {
      throw DomainError.operationNotPermitted('undo', 'Track ID is required');
    }
    if (!command.userId) {
      throw DomainError.operationNotPermitted('undo', 'User ID is required');
    }
  }

  private validateRedoCommand(command: RedoCommand): void {
    if (!command.trackId) {
      throw DomainError.operationNotPermitted('redo', 'Track ID is required');
    }
    if (!command.userId) {
      throw DomainError.operationNotPermitted('redo', 'User ID is required');
    }
  }

  private validateBatchUndoCommand(command: BatchUndoCommand): void {
    this.validateUndoCommand(command);
    if (command.count <= 0) {
      throw DomainError.operationNotPermitted('batchUndo', 'Count must be positive');
    }
    if (command.count > 50) {
      throw DomainError.operationNotPermitted('batchUndo', 'Count cannot exceed 50');
    }
  }

  private validateBatchRedoCommand(command: BatchRedoCommand): void {
    this.validateRedoCommand(command);
    if (command.count <= 0) {
      throw DomainError.operationNotPermitted('batchRedo', 'Count must be positive');
    }
    if (command.count > 50) {
      throw DomainError.operationNotPermitted('batchRedo', 'Count cannot exceed 50');
    }
  }

  // Factory methods for commands

  public static createUndoCommand(trackId: TrackId, userId: string): UndoCommand {
    return { trackId, userId };
  }

  public static createRedoCommand(trackId: TrackId, userId: string): RedoCommand {
    return { trackId, userId };
  }

  public static createBatchUndoCommand(
    trackId: TrackId, 
    count: number, 
    userId: string
  ): BatchUndoCommand {
    return { trackId, count, userId };
  }

  public static createBatchRedoCommand(
    trackId: TrackId, 
    count: number, 
    userId: string
  ): BatchRedoCommand {
    return { trackId, count, userId };
  }
} 