import { injectable, inject } from 'inversify';
import type { IMediator } from '../../../../core/mediator/IMediator';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { ICommand } from '../../../../core/mediator/ICommand';
import type { IQuery } from '../../../../core/mediator/IQuery';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

// Commands
import type { CreateTrackCommand } from '../commands/CreateTrackCommand';
import type { CreateAudioClipCommand } from '../commands/CreateAudioClipCommand';
import type { CreateMidiClipCommand } from '../commands/CreateMidiClipCommand';
import type { AddMidiNoteCommand } from '../commands/AddMidiNoteCommand';
import type { QuantizeMidiClipCommand } from '../commands/QuantizeMidiClipCommand';

// Queries
import type { GetTrackByIdQuery } from '../queries/GetTrackByIdQuery';
import type { GetTrackWithClipsQuery } from '../queries/GetTrackWithClipsQuery';
import type { GetTracksByOwnerQuery } from '../queries/GetTracksByOwnerQuery';

// Return types
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { MidiNoteId } from '../../domain/value-objects/MidiNoteId';
import type { Track } from '../../domain/aggregates/Track';

@injectable()
export class MusicArrangementMediator implements IMediator {
  private commandHandlers: Map<string, ICommandHandler<any, any>> = new Map();
  private queryHandlers: Map<string, IQueryHandler<any, any>> = new Map();

  constructor(
    // Command Handlers
    @inject(MusicArrangementTypes.CreateTrackCommandHandler) 
    createTrackHandler: ICommandHandler<CreateTrackCommand, TrackId>,
    @inject(MusicArrangementTypes.CreateAudioClipCommandHandler) 
    createAudioClipHandler: ICommandHandler<CreateAudioClipCommand, ClipId>,
    @inject(MusicArrangementTypes.CreateMidiClipCommandHandler) 
    createMidiClipHandler: ICommandHandler<CreateMidiClipCommand, ClipId>,
    @inject(MusicArrangementTypes.AddMidiNoteCommandHandler) 
    addMidiNoteHandler: ICommandHandler<AddMidiNoteCommand, MidiNoteId>,
    @inject(MusicArrangementTypes.QuantizeMidiClipCommandHandler) 
    quantizeMidiClipHandler: ICommandHandler<QuantizeMidiClipCommand, void>,

    // Query Handlers
    @inject(MusicArrangementTypes.GetTrackByIdQueryHandler) 
    getTrackByIdHandler: IQueryHandler<GetTrackByIdQuery, Track | null>,
    @inject(MusicArrangementTypes.GetTrackWithClipsQueryHandler) 
    getTrackWithClipsHandler: IQueryHandler<GetTrackWithClipsQuery, Track | null>,
    @inject(MusicArrangementTypes.GetTracksByOwnerQueryHandler) 
    getTracksByOwnerHandler: IQueryHandler<GetTracksByOwnerQuery, Track[]>
  ) {
    // Register command handlers
    this.registerCommandHandler('CreateTrack', createTrackHandler);
    this.registerCommandHandler('CreateAudioClip', createAudioClipHandler);
    this.registerCommandHandler('CreateMidiClip', createMidiClipHandler);
    this.registerCommandHandler('AddMidiNote', addMidiNoteHandler);
    this.registerCommandHandler('QuantizeMidiClip', quantizeMidiClipHandler);

    // Register query handlers
    this.registerQueryHandler('GetTrackById', getTrackByIdHandler);
    this.registerQueryHandler('GetTrackWithClips', getTrackWithClipsHandler);
    this.registerQueryHandler('GetTracksByOwner', getTracksByOwnerHandler);
  }

  private registerCommandHandler<TCommand extends ICommand<TResult>, TResult>(
    commandName: string,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.commandHandlers.set(commandName, handler);
  }

  private registerQueryHandler<TQuery extends IQuery<TResult>, TResult>(
    queryName: string,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.queryHandlers.set(queryName, handler);
  }

  async send<TResult>(command: ICommand<TResult>): Promise<TResult> {
    const commandName = command.type;
    const handler = this.commandHandlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`);
    }

    return handler.handle(command);
  }

  async query<TResult>(query: IQuery<TResult>): Promise<TResult> {
    const queryName = query.type;
    const handler = this.queryHandlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    return handler.handle(query);
  }
} 