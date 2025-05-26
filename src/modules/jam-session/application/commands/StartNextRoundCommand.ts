import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 開始下一回合命令
 */
export class StartNextRoundCommand implements ICommand<void> {
  readonly type = 'StartNextRound';

  constructor(
    public readonly sessionId: string,
    public readonly durationSeconds: number = 60
  ) {}
} 