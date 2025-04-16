import { Container } from 'inversify';
import { TYPES } from '../../../../../core/di/types';
import { TrackService } from '../TrackService';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import type { IStateManager } from '../../../../../core/state/IStateManager';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { CreateTrackCommand } from '../../../application/commands/CreateTrackCommand';

describe('TrackService', () => {
  let container: Container;
  let trackService: TrackService;
  let mockRepository: jest.Mocked<ITrackRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockStateManager: jest.Mocked<IStateManager>;

  beforeEach(() => {
    container = new Container();
    
    // 創建模擬對象
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ITrackRepository>;

    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<IEventBus>;

    mockStateManager = {
      getState: jest.fn(),
      updateState: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    } as jest.Mocked<IStateManager>;

    // 綁定模擬對象
    container.bind<ITrackRepository>(TYPES.TrackRepository).toConstantValue(mockRepository);
    container.bind<IEventBus>(TYPES.EventBus).toConstantValue(mockEventBus);
    container.bind<IStateManager>(TYPES.StateManager).toConstantValue(mockStateManager);
    container.bind<TrackService>(TYPES.TrackService).to(TrackService);

    trackService = container.get<TrackService>(TYPES.TrackService);
  });

  describe('createTrack', () => {
    it('應該創建新的音軌並發布事件', async () => {
      const command = new CreateTrackCommand('Test Track', 'audio');
      const mockTrackId = new TrackId('test-uuid');
      
      mockRepository.create.mockResolvedValue({
        trackId: mockTrackId,
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      });

      const result = await trackService.createTrack(command);

      expect(result).toBe(mockTrackId);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      });
      expect(mockEventBus.emit).toHaveBeenCalled();
      expect(mockStateManager.updateState).toHaveBeenCalled();
    });
  });

  describe('updateTrackVolume', () => {
    it('應該更新音軌音量並發布事件', async () => {
      const trackId = new TrackId('test-uuid');
      const volume = 0.8;

      mockRepository.findById.mockResolvedValue({
        trackId,
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      });

      await trackService.updateTrackVolume(trackId, volume);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        trackId,
        volume
      }));
      expect(mockEventBus.emit).toHaveBeenCalled();
      expect(mockStateManager.updateState).toHaveBeenCalled();
    });

    it('當音軌不存在時應該拋出錯誤', async () => {
      const trackId = new TrackId('non-existent');
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(trackService.updateTrackVolume(trackId, 0.8))
        .rejects
        .toThrow('Track not found');
    });
  });

  describe('toggleMute', () => {
    it('應該切換靜音狀態並發布事件', async () => {
      const trackId = new TrackId('test-uuid');

      mockRepository.findById.mockResolvedValue({
        trackId,
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      });

      await trackService.toggleMute(trackId);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        trackId,
        mute: true
      }));
      expect(mockEventBus.emit).toHaveBeenCalled();
      expect(mockStateManager.updateState).toHaveBeenCalled();
    });
  });
}); 