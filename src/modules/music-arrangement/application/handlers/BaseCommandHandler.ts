import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { UndoRedoService } from '../services/UndoRedoService';
import { Track } from '../../domain/aggregates/Track';
import { TrackId } from '../../domain/value-objects/TrackId';
import { DomainError } from '../../domain/errors/DomainError';
import { UndoableEvent } from '../../domain/events/MidiEvents';

/**
 * Command execution context
 */
export interface CommandContext {
  userId: string;
  timestamp: Date;
  trackingEnabled?: boolean;
}

/**
 * Command execution result
 */
export interface CommandResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  eventsGenerated: number;
  undoableEventsRecorded: number;
}

/**
 * Base Command Handler
 * Provides common functionality for all command handlers including:
 * - Track loading and saving
 * - Undo/redo event recording
 * - Error handling
 * - Event publishing
 */
export abstract class BaseCommandHandler<TCommand, TResult = void> {
  constructor(
    protected readonly trackRepository: TrackRepository,
    protected readonly undoRedoService?: UndoRedoService
  ) {}

  /**
   * Execute command with full undo/redo support
   */
  public async execute(
    command: TCommand, 
    context: CommandContext
  ): Promise<CommandResult<TResult>> {
    try {
      // Execute the specific command logic
      const result = await this.handleCommand(command, context);
      
      return {
        success: true,
        result,
        eventsGenerated: 0, // Will be updated by subclasses
        undoableEventsRecorded: 0 // Will be updated by subclasses
      };
    } catch (error) {
      console.error('Command execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        eventsGenerated: 0,
        undoableEventsRecorded: 0
      };
    }
  }

  /**
   * Abstract method that subclasses must implement
   */
  protected abstract handleCommand(command: TCommand, context: CommandContext): Promise<TResult>;

  /**
   * Load track with error handling
   */
  protected async loadTrack(trackId: TrackId): Promise<Track> {
    const track = await this.trackRepository.loadWithClips(trackId);
    if (!track) {
      throw DomainError.trackNotFound(trackId.toString());
    }
    return track;
  }

  /**
   * Save track and handle undo/redo recording
   */
  protected async saveTrackWithUndoSupport(
    track: Track, 
    context: CommandContext
  ): Promise<{ eventsGenerated: number; undoableEventsRecorded: number }> {
    const uncommittedEvents = track.getUncommittedEvents();
    let undoableEventsRecorded = 0;

    // Record undoable events before saving
    if (this.undoRedoService && context.trackingEnabled !== false) {
      for (const event of uncommittedEvents) {
        if (this.isUndoableEvent(event)) {
          await this.undoRedoService.recordUndoableEvent(
            event as UndoableEvent,
            track.trackId.toString(),
            track.version + uncommittedEvents.indexOf(event) + 1,
            context.userId
          );
          undoableEventsRecorded++;
        }
      }
    }

    // Save the track
    await this.trackRepository.saveWithClips(track);

    // Publish domain events (placeholder for event bus integration)
    this.publishDomainEvents(uncommittedEvents);

    return {
      eventsGenerated: uncommittedEvents.length,
      undoableEventsRecorded
    };
  }

  /**
   * Check if an event is undoable
   */
  private isUndoableEvent(event: any): event is UndoableEvent {
    return typeof event.createUndoEvent === 'function';
  }

  /**
   * Publish domain events (placeholder for event bus integration)
   */
  protected publishDomainEvents(events: any[]): void {
    events.forEach(event => {
      console.log('Publishing domain event:', event.eventName, event);
      // In a real implementation, this would use an event bus
    });
  }

  /**
   * Validate command parameters
   */
  protected validateCommand(command: TCommand): void {
    if (!command) {
      throw DomainError.operationNotPermitted('execute', 'Command cannot be null or undefined');
    }
  }

  /**
   * Create command context with defaults
   */
  public static createContext(
    userId: string, 
    options: Partial<CommandContext> = {}
  ): CommandContext {
    return {
      userId,
      timestamp: new Date(),
      trackingEnabled: true,
      ...options
    };
  }
}

/**
 * Legacy command handler interface for backward compatibility
 */
export interface ICommandHandler<TCommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

/**
 * Enhanced command handler interface with context support
 */
export interface IEnhancedCommandHandler<TCommand, TResult = void> {
  execute(command: TCommand, context: CommandContext): Promise<CommandResult<TResult>>;
} 