import type { ICommand } from '../../../../core/mediator/ICommand';

/**
 * 設置玩家角色命令
 */
export class SetPlayerRoleCommand implements ICommand<void> {
  readonly type = 'SetPlayerRole';

  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly roleColor: string
  ) {}
} 