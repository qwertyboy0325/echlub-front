import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 切換玩家準備狀態命令
 */
export class TogglePlayerReadyCommand implements ICommand<void> {
  readonly type = 'TogglePlayerReady';

  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly isReady: boolean
  ) {}
} 