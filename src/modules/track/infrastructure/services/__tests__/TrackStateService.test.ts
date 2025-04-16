import { Container } from 'inversify';
import { TYPES } from '../../../../../core/di/types'; 
import { TrackStateService } from '../TrackStateService';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import type { IStateManager } from '../../../../../core/state/IStateManager';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackCreatedEvent } from '../../../domain/events/TrackCreatedEvent';
import { TrackUpdatedEvent } from '../../../domain/events/TrackUpdatedEvent';
import { TrackDeletedEvent } from '../../../domain/events/TrackDeletedEvent';
import { BaseTrack } from '../../../domain/entities/BaseTrack';

describe('TrackStateService', () => {
  let container: Container;
  let trackStateService: TrackStateService;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockStateManager: jest.Mocked<IStateManager>;

  beforeEach(() => {
    container = new Container();
    
    // 創建模擬對象
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
    container.bind<IEventBus>(TYPES.EventBus).toConstantValue(mockEventBus);
    container.bind<IStateManager>(TYPES.StateManager).toConstantValue(mockStateManager);
    container.bind<TrackStateService>(TYPES.TrackStateService).to(TrackStateService);

    trackStateService = container.get<TrackStateService>(TYPES.TrackStateService);
  });

  describe('handleTrackCreated', () => {
    it('應該處理音軌創建事件並更新狀態', async () => {
      const trackId = new TrackId('test-uuid');
      const event = new TrackCreatedEvent(trackId, 'Test Track', 'audio');

      await trackStateService.handleTrackCreated(event);

      expect(mockStateManager.updateState).toHaveBeenCalledWith(
        'tracks',
        expect.objectContaining({
          [trackId.toString()]: {
            trackId,
            name: 'Test Track',
            type: 'audio',
            volume: 1,
            mute: false,
            solo: false,
            pluginInstanceIds: []
          }
        })
      );
    });
  });

  describe('handleTrackUpdated', () => {
    it('應該處理音軌更新事件並更新狀態', async () => {
      const trackId = new TrackId('test-uuid');
      const event = new TrackUpdatedEvent(trackId, { volume: 0.8 });
      const currentTrack: BaseTrack = {
        trackId,
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      mockStateManager.getState.mockReturnValue({
        [trackId.toString()]: currentTrack
      });

      await trackStateService.handleTrackUpdated(event);

      expect(mockStateManager.updateState).toHaveBeenCalledWith(
        'tracks',
        expect.objectContaining({
          [trackId.toString()]: expect.objectContaining({
            volume: 0.8
          })
        })
      );
    });
  });

  describe('handleTrackDeleted', () => {
    it('應該處理音軌刪除事件並更新狀態', async () => {
      const trackId = new TrackId('test-uuid');
      const event = new TrackDeletedEvent(trackId);
      const currentTrack: BaseTrack = {
        trackId,
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      mockStateManager.getState.mockReturnValue({
        [trackId.toString()]: currentTrack
      });

      await trackStateService.handleTrackDeleted(event);

      expect(mockStateManager.updateState).toHaveBeenCalledWith(
        'tracks',
        expect.not.objectContaining({
          [trackId.toString()]: expect.anything()
        })
      );
    });
  });

  describe('getTrackById', () => {
    it('應該返回指定 ID 的音軌', () => {
      const trackId = new TrackId('test-uuid');
      const mockTrack: BaseTrack = {
        trackId,
        name: 'Test Track',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      mockStateManager.getState.mockReturnValue({
        [trackId.toString()]: mockTrack
      });

      const result = trackStateService.getTrackById(trackId);

      expect(result).toEqual(mockTrack);
    });

    it('當音軌不存在時應該返回 undefined', () => {
      const trackId = new TrackId('non-existent');
      mockStateManager.getState.mockReturnValue({});

      const result = trackStateService.getTrackById(trackId);

      expect(result).toBeUndefined();
    });
  });

  describe('getAllTracks', () => {
    it('應該返回所有音軌', () => {
      const trackId1 = new TrackId('test-uuid-1');
      const trackId2 = new TrackId('test-uuid-2');
      const mockTrack1: BaseTrack = {
        trackId: trackId1,
        name: 'Test Track 1',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };
      const mockTrack2: BaseTrack = {
        trackId: trackId2,
        name: 'Test Track 2',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      mockStateManager.getState.mockReturnValue({
        [trackId1.toString()]: mockTrack1,
        [trackId2.toString()]: mockTrack2
      });

      const result = trackStateService.getAllTracks();

      expect(result).toEqual([mockTrack1, mockTrack2]);
    });
  });

  describe('getMutedTracks', () => {
    it('應該返回所有靜音的音軌', () => {
      const trackId1 = new TrackId('test-uuid-1');
      const trackId2 = new TrackId('test-uuid-2');
      const mockTrack1: BaseTrack = {
        trackId: trackId1,
        name: 'Test Track 1',
        type: 'audio',
        volume: 1,
        mute: true,
        solo: false,
        pluginInstanceIds: []
      };
      const mockTrack2: BaseTrack = {
        trackId: trackId2,
        name: 'Test Track 2',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      mockStateManager.getState.mockReturnValue({
        [trackId1.toString()]: mockTrack1,
        [trackId2.toString()]: mockTrack2
      });

      const result = trackStateService.getMutedTracks();

      expect(result).toEqual([mockTrack1]);
    });
  });

  describe('getSoloTracks', () => {
    it('應該返回所有獨奏的音軌', () => {
      const trackId1 = new TrackId('test-uuid-1');
      const trackId2 = new TrackId('test-uuid-2');
      const mockTrack1: BaseTrack = {
        trackId: trackId1,
        name: 'Test Track 1',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: true,
        pluginInstanceIds: []
      };
      const mockTrack2: BaseTrack = {
        trackId: trackId2,
        name: 'Test Track 2',
        type: 'audio',
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      mockStateManager.getState.mockReturnValue({
        [trackId1.toString()]: mockTrack1,
        [trackId2.toString()]: mockTrack2
      });

      const result = trackStateService.getSoloTracks();

      expect(result).toEqual([mockTrack1]);
    });
  });
}); 