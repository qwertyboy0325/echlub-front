import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 加入 JamSession 命令
 */
export class JoinJamSessionCommand implements ICommand<void> {
  readonly type = 'JoinJamSession';

  constructor(
    public readonly sessionId: string,
    public readonly peerId: string
  ) {}
} 