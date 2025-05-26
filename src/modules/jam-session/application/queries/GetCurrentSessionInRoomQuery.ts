import type { IQuery } from '../../../../core/mediator/IQuery';
import type { SessionDto } from '../types';

/**
 * 獲取房間中當前會話查詢
 */
export class GetCurrentSessionInRoomQuery implements IQuery<SessionDto | null> {
  readonly type = 'GetCurrentSessionInRoom';
  
  constructor(public readonly roomId: string) {}
} 