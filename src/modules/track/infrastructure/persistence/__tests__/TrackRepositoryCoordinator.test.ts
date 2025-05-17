import { Container } from 'inversify';
import { TrackRepositoryCoordinator } from '../TrackRepositoryCoordinator';
import { ILocalTrackRepository } from '../../../domain/repositories/ITrackRepository';
import { ITrackEventPublisher } from '../../../domain/ports/ITrackEventPublisher';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { TrackTypes } from '../../../di/TrackTypes';

describe('TrackRepositoryCoordinator', () => {
  let container: Container;
  let coordinator: TrackRepositoryCoordinator;
  let localRepo: jest.Mocked<ILocalTrackRepository>;
  let eventPublisher: jest.Mocked<ITrackEventPublisher>;

  beforeEach(() => {
    container = new Container();
    
    // 模擬本地倉庫
    localRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ILocalTrackRepository>;

    // 模擬事件發布器
    eventPublisher = {
      publishTrackCreated: jest.fn(),
      publishTrackUpdated: jest.fn(),
      publishTrackDeleted: jest.fn(),
      publishTrackRenamed: jest.fn(),
      publishTrackRoutingChanged: jest.fn(),
      publishPluginAdded: jest.fn(),
      publishPluginRemoved: jest.fn()
    } as jest.Mocked<ITrackEventPublisher>;

    // 設置依賴注入
    container.bind(TrackTypes.LocalTrackRepository).toConstantValue(localRepo);
    container.bind(TrackTypes.TrackEventPublisher).toConstantValue(eventPublisher);
    container.bind(TrackRepositoryCoordinator).toSelf();

    coordinator = container.get(TrackRepositoryCoordinator);
  });

  describe('create', () => {
    it('應該創建音軌並發布事件', async () => {
      // 準備
      const trackId = TrackId.create();
      const track = new AudioTrack(
        trackId,
        'Test Track',
        new TrackRouting()
      );

      // 執行
      await coordinator.create(track);

      // 驗證
      expect(localRepo.create).toHaveBeenCalledWith(track);
      expect(eventPublisher.publishTrackCreated).toHaveBeenCalledWith(
        trackId,
        'Test Track',
        'audio'
      );
    });

    it('當創建失敗時應該拋出錯誤', async () => {
      // 準備
      const track = new AudioTrack(
        TrackId.create(),
        'Test Track',
        new TrackRouting()
      );
      localRepo.create.mockRejectedValue(new Error('Creation failed'));

      // 執行與驗證
      await expect(coordinator.create(track))
        .rejects
        .toThrow('Failed to create track: Error: Creation failed');
    });
  });

  describe('findById', () => {
    it('應該返回找到的音軌', async () => {
      // 準備
      const trackId = TrackId.create();
      const track = new AudioTrack(
        trackId,
        'Test Track',
        new TrackRouting()
      );
      localRepo.findById.mockResolvedValue(track);

      // 執行
      const result = await coordinator.findById(trackId);

      // 驗證
      expect(result).toBe(track);
      expect(localRepo.findById).toHaveBeenCalledWith(trackId);
    });

    it('當音軌不存在時應該返回 undefined', async () => {
      // 準備
      const trackId = TrackId.create();
      localRepo.findById.mockResolvedValue(undefined);

      // 執行
      const result = await coordinator.findById(trackId);

      // 驗證
      expect(result).toBeUndefined();
    });
  });

  describe('save', () => {
    it('應該保存音軌並發布更新事件', async () => {
      // 準備
      const track = new AudioTrack(
        TrackId.create(),
        'Test Track',
        new TrackRouting()
      );

      // 執行
      await coordinator.save(track);

      // 驗證
      expect(localRepo.save).toHaveBeenCalledWith(track);
      expect(eventPublisher.publishTrackUpdated).toHaveBeenCalledWith(
        track.getTrackId(),
        track
      );
    });

    it('當保存失敗時應該拋出錯誤', async () => {
      // 準備
      const track = new AudioTrack(
        TrackId.create(),
        'Test Track',
        new TrackRouting()
      );
      localRepo.save.mockRejectedValue(new Error('Save failed'));

      // 執行與驗證
      await expect(coordinator.save(track))
        .rejects
        .toThrow('Failed to save track: Error: Save failed');
    });
  });

  describe('delete', () => {
    it('應該刪除音軌並發布刪除事件', async () => {
      // 準備
      const trackId = TrackId.create();

      // 執行
      await coordinator.delete(trackId);

      // 驗證
      expect(localRepo.delete).toHaveBeenCalledWith(trackId);
      expect(eventPublisher.publishTrackDeleted).toHaveBeenCalledWith(trackId);
    });

    it('當刪除失敗時應該拋出錯誤', async () => {
      // 準備
      const trackId = TrackId.create();
      localRepo.delete.mockRejectedValue(new Error('Delete failed'));

      // 執行與驗證
      await expect(coordinator.delete(trackId))
        .rejects
        .toThrow('Failed to delete track: Error: Delete failed');
    });
  });
}); 
