import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 創建 JamSession 命令
 */
export class CreateJamSessionCommand implements ICommand<string> {
  readonly type = 'CreateJamSession';

  constructor(
    public readonly roomId: string,
    public readonly initiatorPeerId: string
  ) {}
} 