import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetSessionByIdQuery } from '../queries/GetSessionByIdQuery';
import type { SessionDto } from '../types';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';
import { SessionDtoMapper } from '../mappers/SessionDtoMapper';

/**
 * 獲取會話查詢處理器
 */
@injectable()
export class GetSessionByIdHandler implements IQueryHandler<GetSessionByIdQuery, SessionDto | null> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(JamSessionTypes.SessionDtoMapper) private readonly dtoMapper: SessionDtoMapper
  ) {}

  /**
   * 處理獲取會話查詢
   * @param query 查詢參數
   */
  async handle(query: GetSessionByIdQuery): Promise<SessionDto | null> {
    const session = await this.sessionRepository.findById(SessionId.fromString(query.sessionId));
    return session ? this.dtoMapper.toDto(session) : null;
  }
} 