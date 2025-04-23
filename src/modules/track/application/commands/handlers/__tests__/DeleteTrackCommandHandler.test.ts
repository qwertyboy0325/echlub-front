import { Container } from 'inversify';
import { TrackTypes } from '../../../../di/TrackTypes';
import { DeleteTrackCommandHandler } from '../DeleteTrackCommandHandler';
import { DeleteTrackCommand } from '../../DeleteTrackCommand';
import { ITrackRepository } from '../../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../../core/event-bus/IEventBus';
import { TrackId } from '../../../../domain/value-objects/track/TrackId';
import { AudioTrack } from '../../../../domain/entities/AudioTrack';
import { TrackRouting } from '../../../../domain/value-objects/track/TrackRouting';
import { TrackDeletedEvent } from '../../../../domain/events/TrackDeletedEvent';
import { TrackOperationError } from '../../../../domain/errors/TrackError';

describe('DeleteTrackCommandHandler', () => {
  let container: Container;
  let handler: DeleteTrackCommandHandler;
  let mockRepository: jest.Mocked<ITrackRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let trackId: TrackId;
  let track: AudioTrack;

  beforeEach(() => {
    container = new Container();

    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn()
    } as any;

    container.bind(TrackTypes.TrackRepository).toConstantValue(mockRepository);
    container.bind(TrackTypes.EventBus).toConstantValue(mockEventBus);
    container.bind(DeleteTrackCommandHandler).toSelf();

    handler = container.get(DeleteTrackCommandHandler);

    trackId = TrackId.create();
    track = new AudioTrack(trackId, 'Test Track', new TrackRouting('input-1', 'output-1'));
  });

  it('應該成功刪除軌道並發布事件', async () => {
    const command = new DeleteTrackCommand(trackId);
    mockRepository.findById.mockResolvedValue(track);
    mockRepository.delete.mockResolvedValue();
    mockEventBus.publish.mockResolvedValue();

    await handler.handle(command);

    expect(mockRepository.findById).toHaveBeenCalledWith(trackId);
    expect(mockRepository.delete).toHaveBeenCalledWith(trackId);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(TrackDeletedEvent)
    );
  });

  it('當軌道不存在時應該拋出錯誤', async () => {
    const command = new DeleteTrackCommand(trackId);
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(handler.handle(command))
      .rejects
      .toThrow(new TrackOperationError(`Track with id ${trackId} not found`));

    expect(mockRepository.delete).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 這個測試可以在實現了 checkTrackDependencies 方法後添加
  it('當軌道有依賴關係時應該拋出錯誤', async () => {
    const command = new DeleteTrackCommand(trackId);
    mockRepository.findById.mockResolvedValue(track);
    
    // 模擬有依賴關係的情況
    jest.spyOn(handler as any, 'checkTrackDependencies').mockResolvedValue(true);

    await expect(handler.handle(command))
      .rejects
      .toThrow(new TrackOperationError('Cannot delete track: other tracks depend on it'));

    expect(mockRepository.delete).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
}); 