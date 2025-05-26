import type { ICommand } from '../../../core/mediator/ICommand';
import type { IQuery as CoreQuery } from '../../../core/mediator/IQuery';

/**
 * 命令 DTOs
 */
export interface CreateJamSessionCommandDto extends ICommand<string> {
  readonly type: 'CreateJamSessionCommand';
  readonly roomId: string;
  readonly initiatorPeerId: string;
}

export interface JoinJamSessionCommandDto extends ICommand<void> {
  readonly type: 'JoinJamSessionCommand';
  readonly sessionId: string;
  readonly peerId: string;
}

export interface SetPlayerRoleCommandDto extends ICommand<void> {
  readonly type: 'SetPlayerRoleCommand';
  readonly sessionId: string;
  readonly peerId: string;
  readonly roleId: string;
}

export interface TogglePlayerReadyCommandDto extends ICommand<void> {
  readonly type: 'TogglePlayerReadyCommand';
  readonly sessionId: string;
  readonly peerId: string;
  readonly isReady: boolean;
}

export interface StartJamSessionCommandDto extends ICommand<void> {
  readonly type: 'StartJamSessionCommand';
  readonly sessionId: string;
}

export interface StartNextRoundCommandDto extends ICommand<void> {
  readonly type: 'StartNextRoundCommand';
  readonly sessionId: string;
  readonly durationSeconds: number;
}

export interface EndCurrentRoundCommandDto extends ICommand<void> {
  readonly type: 'EndCurrentRoundCommand';
  readonly sessionId: string;
}

export interface EndJamSessionCommandDto extends ICommand<void> {
  readonly type: 'EndJamSessionCommand';
  readonly sessionId: string;
  readonly initiatorPeerId: string;
}

/**
 * 查詢 DTOs
 */
export interface GetSessionByIdQueryDto extends CoreQuery<SessionDto | null> {
  readonly type: 'GetSessionByIdQuery';
  readonly sessionId: string;
}

export interface GetCurrentSessionInRoomQueryDto extends CoreQuery<SessionDto | null> {
  readonly type: 'GetCurrentSessionInRoomQuery';
  readonly roomId: string;
}

/**
 * 資料傳輸物件
 */
export interface SessionDto {
  readonly sessionId: string;
  readonly roomId: string;
  readonly status: string;
  readonly currentRoundNumber: number;
  readonly rounds: RoundDto[];
  readonly players: PlayerDto[];
}

export interface PlayerDto {
  readonly peerId: string;
  readonly role: RoleDto | null;
  readonly isReady: boolean;
  readonly joinedAt: string;
}

export interface RoleDto {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

export interface RoundDto {
  readonly roundNumber: number;
  readonly startedAt: string;
  readonly durationSeconds: number;
  readonly endedAt: string | null;
  readonly isActive: boolean;
} 