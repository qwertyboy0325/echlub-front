import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { DeleteTrackCommand } from '../DeleteTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackDeletedEvent } from '../../../domain/events/TrackDeletedEvent';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { TrackOperationError } from '../../../domain/errors/TrackError';
import { TrackId } from '../../../domain/value-objects/track/TrackId';

@injectable()
export class DeleteTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: DeleteTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new TrackOperationError(`Track with id ${command.trackId} not found`);
    }

    // 檢查是否有其他軌道依賴於此軌道（例如：作為匯流排的輸入）
    const hasDependencies = await this.checkTrackDependencies(command.trackId);
    if (hasDependencies) {
      throw new TrackOperationError('Cannot delete track: other tracks depend on it');
    }

    await this.repository.delete(command.trackId);

    const event = new TrackDeletedEvent(command.trackId);
    await this.eventBus.publish(event);
  }

  private async checkTrackDependencies(trackId: TrackId): Promise<boolean> {
    // 這裡應該實現檢查邏輯
    // 例如：檢查是否有匯流排軌道使用此軌道作為輸入
    // 目前返回 false 表示沒有依賴
    return false;
  }
} 