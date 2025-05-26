import type { IQuery } from '../../../../core/mediator/IQuery';
import type { SessionDto } from '../types';

/**
 * 根據 ID 獲取會話查詢
 */
export class GetSessionByIdQuery implements IQuery<SessionDto | null> {
  readonly type = 'GetSessionById';
  
  constructor(public readonly sessionId: string) {}
} 