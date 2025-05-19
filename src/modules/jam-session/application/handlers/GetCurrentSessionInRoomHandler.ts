import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetCurrentSessionInRoomQuery } from '../queries/GetCurrentSessionInRoomQuery';
import type { SessionDto } from '../types';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { SessionDtoMapper } from '../mappers/SessionDtoMapper';

/**
 * 獲取房間當前會話查詢處理器
 */
@injectable()
export class GetCurrentSessionInRoomHandler implements IQueryHandler<GetCurrentSessionInRoomQuery, SessionDto | null> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.SessionDtoMapper) private readonly dtoMapper: SessionDtoMapper
  ) {}

  /**
   * 處理獲取房間當前會話查詢
   * @param query 查詢參數
   */
  async handle(query: GetCurrentSessionInRoomQuery): Promise<SessionDto | null> {
    const session = await this.sessionRepository.findCurrentSessionInRoom(query.roomId);
    return session ? this.dtoMapper.toDto(session) : null;
  }
} 