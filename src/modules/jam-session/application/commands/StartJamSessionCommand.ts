import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 開始 JamSession 命令
 */
export class StartJamSessionCommand implements ICommand<void> {
  readonly type = 'StartJamSession';

  constructor(
    public readonly sessionId: string,
    public readonly initiatorPeerId: string
  ) {}
}
