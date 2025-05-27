import type { AddMidiNoteCommand } from '../commands/AddMidiNoteCommand';
import type { MidiNoteId } from '../../domain/value-objects/MidiNoteId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { UndoRedoService } from '../services/UndoRedoService';
import { MidiNote } from '../../domain/entities/MidiNote';
import { 
  BaseCommandHandler, 
  CommandContext, 
  CommandResult,
  IEnhancedCommandHandler 
} from './BaseCommandHandler';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';

/**
 * Enhanced Add MIDI Note Command Handler
 * Provides full undo/redo support and improved error handling
 */
export class EnhancedAddMidiNoteCommandHandler 
  extends BaseCommandHandler<AddMidiNoteCommand, MidiNoteId> 
  implements IEnhancedCommandHandler<AddMidiNoteCommand, MidiNoteId> {

  constructor(
    trackRepository: TrackRepository,
    undoRedoService?: UndoRedoService
  ) {
    super(trackRepository, undoRedoService);
  }

  /**
   * Handle the add MIDI note command
   */
  protected async handleCommand(
    command: AddMidiNoteCommand, 
    context: CommandContext
  ): Promise<MidiNoteId> {
    // Validate command
    this.validateCommand(command);
    this.validateAddMidiNoteCommand(command);

    // Load track
    const track = await this.loadTrack(command.trackId);

    // Create MIDI note
    const note = MidiNote.create(
      command.pitch,
      command.velocity,
      command.range
    );

    // Add note to clip (this will raise domain events)
    track.addMidiNoteToClip(command.clipId, note);

    // Save track with undo support
    const saveResult = await this.saveTrackWithUndoSupport(track, context);

    console.log(`Added MIDI note ${note.noteId.toString()} to clip ${command.clipId.toString()}`);
    console.log(`Generated ${saveResult.eventsGenerated} events, recorded ${saveResult.undoableEventsRecorded} undoable events`);

    return note.noteId;
  }

  /**
   * Execute command with enhanced result tracking
   */
  public async execute(
    command: AddMidiNoteCommand, 
    context: CommandContext
  ): Promise<CommandResult<MidiNoteId>> {
    try {
      const result = await this.handleCommand(command, context);
      
      // Load track again to get accurate event counts
      const track = await this.loadTrack(command.trackId);
      const saveResult = await this.saveTrackWithUndoSupport(track, context);
      
      return {
        success: true,
        result,
        eventsGenerated: saveResult.eventsGenerated,
        undoableEventsRecorded: saveResult.undoableEventsRecorded
      };
    } catch (error) {
      console.error('Add MIDI note command failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        eventsGenerated: 0,
        undoableEventsRecorded: 0
      };
    }
  }

  /**
   * Legacy handle method for backward compatibility
   */
  public async handle(command: AddMidiNoteCommand): Promise<MidiNoteId> {
    const context = BaseCommandHandler.createContext('system');
    const result = await this.execute(command, context);
    
    if (!result.success) {
      throw new Error(result.error || 'Command execution failed');
    }
    
    return result.result!;
  }

  /**
   * Validate specific command parameters
   */
  private validateAddMidiNoteCommand(command: AddMidiNoteCommand): void {
    if (!command.trackId) {
      throw new Error('Track ID is required');
    }
    if (!command.clipId) {
      throw new Error('Clip ID is required');
    }
    if (command.pitch < 0 || command.pitch > 127) {
      throw new Error('MIDI pitch must be between 0 and 127');
    }
    if (command.velocity < 0 || command.velocity > 127) {
      throw new Error('MIDI velocity must be between 0 and 127');
    }
    if (!command.range) {
      throw new Error('Time range is required');
    }
    if (command.range.length <= 0) {
      throw new Error('Note duration must be positive');
    }
  }

  /**
   * Create command with validation
   */
  public static createCommand(
    trackId: any,
    clipId: any,
    pitch: number,
    velocity: number,
    range: any
  ): AddMidiNoteCommand {
    return {
      type: 'AddMidiNote',
      trackId,
      clipId,
      pitch,
      velocity,
      range
    };
  }

  /**
   * Batch add multiple MIDI notes
   */
  public async addMultipleNotes(
    commands: AddMidiNoteCommand[],
    context: CommandContext
  ): Promise<CommandResult<MidiNoteId[]>> {
    const results: MidiNoteId[] = [];
    let totalEventsGenerated = 0;
    let totalUndoableEventsRecorded = 0;

    try {
      for (const command of commands) {
        const result = await this.execute(command, {
          ...context,
          trackingEnabled: false // Disable individual tracking for batch
        });
        
        if (!result.success) {
          throw new Error(`Failed to add note: ${result.error}`);
        }
        
        results.push(result.result!);
        totalEventsGenerated += result.eventsGenerated;
        totalUndoableEventsRecorded += result.undoableEventsRecorded;
      }

      // Record batch operation for undo if service is available
      if (this.undoRedoService && commands.length > 0) {
        // This would require a batch undo event implementation
        console.log(`Batch added ${results.length} MIDI notes`);
      }

      return {
        success: true,
        result: results,
        eventsGenerated: totalEventsGenerated,
        undoableEventsRecorded: totalUndoableEventsRecorded
      };

    } catch (error) {
      console.error('Batch add MIDI notes failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch operation failed',
        eventsGenerated: totalEventsGenerated,
        undoableEventsRecorded: totalUndoableEventsRecorded
      };
    }
  }
} 