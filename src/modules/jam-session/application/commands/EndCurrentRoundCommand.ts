import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 結束當前回合命令
 */
export class EndCurrentRoundCommand implements ICommand<void> {
  readonly type = 'EndCurrentRound';

  constructor(
    public readonly sessionId: string
  ) {}
} 