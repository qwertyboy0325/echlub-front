import { injectable, inject } from 'inversify';
import { IMediator as CoreMediator } from '../../../../core/mediator/IMediator';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { ICommand } from '../../../../core/mediator/ICommand';
import type { IQuery } from '../../../../core/mediator/IQuery';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { SessionDto } from '../types';
import { CreateJamSessionCommand } from '../commands/CreateJamSessionCommand';
import { JoinJamSessionCommand } from '../commands/JoinJamSessionCommand';
import { SetPlayerRoleCommand } from '../commands/SetPlayerRoleCommand';
import { TogglePlayerReadyCommand } from '../commands/TogglePlayerReadyCommand';
import { StartJamSessionCommand } from '../commands/StartJamSessionCommand';
import { StartNextRoundCommand } from '../commands/StartNextRoundCommand';
import { EndCurrentRoundCommand } from '../commands/EndCurrentRoundCommand';
import { EndJamSessionCommand } from '../commands/EndJamSessionCommand';
import { GetSessionByIdQuery } from '../queries/GetSessionByIdQuery';
import { GetCurrentSessionInRoomQuery } from '../queries/GetCurrentSessionInRoomQuery';

@injectable()
export class Mediator implements CoreMediator {
  private commandHandlers: Map<string, ICommandHandler<any, any>> = new Map();
  private queryHandlers: Map<string, IQueryHandler<any, any>> = new Map();

  constructor(
    @inject(JamSessionTypes.CreateJamSessionHandler) createHandler: ICommandHandler<CreateJamSessionCommand, string>,
    @inject(JamSessionTypes.JoinJamSessionHandler) joinHandler: ICommandHandler<JoinJamSessionCommand, void>,
    @inject(JamSessionTypes.SetPlayerRoleHandler) setRoleHandler: ICommandHandler<SetPlayerRoleCommand, void>,
    @inject(JamSessionTypes.TogglePlayerReadyHandler) toggleReadyHandler: ICommandHandler<TogglePlayerReadyCommand, void>,
    @inject(JamSessionTypes.StartJamSessionHandler) startHandler: ICommandHandler<StartJamSessionCommand, void>,
    @inject(JamSessionTypes.StartNextRoundHandler) startNextRoundHandler: ICommandHandler<StartNextRoundCommand, void>,
    @inject(JamSessionTypes.EndCurrentRoundHandler) endCurrentRoundHandler: ICommandHandler<EndCurrentRoundCommand, void>,
    @inject(JamSessionTypes.EndJamSessionHandler) endHandler: ICommandHandler<EndJamSessionCommand, void>,
    @inject(JamSessionTypes.GetSessionByIdHandler) getSessionByIdHandler: IQueryHandler<GetSessionByIdQuery, SessionDto | null>,
    @inject(JamSessionTypes.GetCurrentSessionInRoomHandler) getCurrentSessionInRoomHandler: IQueryHandler<GetCurrentSessionInRoomQuery, SessionDto | null>
  ) {
    this.registerCommandHandler('CreateJamSession', createHandler);
    this.registerCommandHandler('JoinJamSession', joinHandler);
    this.registerCommandHandler('SetPlayerRole', setRoleHandler);
    this.registerCommandHandler('TogglePlayerReady', toggleReadyHandler);
    this.registerCommandHandler('StartJamSession', startHandler);
    this.registerCommandHandler('StartNextRound', startNextRoundHandler);
    this.registerCommandHandler('EndCurrentRound', endCurrentRoundHandler);
    this.registerCommandHandler('EndJamSession', endHandler);

    this.registerQueryHandler('GetSessionById', getSessionByIdHandler);
    this.registerQueryHandler('GetCurrentSessionInRoom', getCurrentSessionInRoomHandler);
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
    const commandName = command.constructor.name;
    const handler = this.commandHandlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`);
    }

    return handler.handle(command);
  }

  async query<TResult>(query: IQuery<TResult>): Promise<TResult> {
    const queryName = query.constructor.name;
    const handler = this.queryHandlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    return handler.handle(query);
  }
} 