import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 結束 JamSession 命令
 */
export class EndJamSessionCommand implements ICommand<void> {
  readonly type = 'EndJamSession';

  constructor(
    public readonly sessionId: string,
    public readonly initiatorPeerId: string
  ) {}
} 