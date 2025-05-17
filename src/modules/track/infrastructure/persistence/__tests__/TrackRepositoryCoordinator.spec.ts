import { Container } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { TrackRepositoryCoordinator } from '../TrackRepositoryCoordinator';
import { ILocalTrackRepository } from '../../../domain/repositories/ITrackRepository';
import { ITrackEventPublisher } from '../../../domain/ports/ITrackEventPublisher';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { TrackType } from '../../../domain/value-objects/TrackType';

describe('TrackRepositoryCoordinator', () => {
  let container: Container;
  let coordinator: TrackRepositoryCoordinator;
  let mockLocalRepo: jest.Mocked<ILocalTrackRepository>;
  let mockEventPublisher: jest.Mocked<ITrackEventPublisher>;

  beforeEach(() => {
    container = new Container();

    mockLocalRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEventPublisher = {
      publishTrackCreated: jest.fn(),
      publishTrackUpdated: jest.fn(),
      publishTrackDeleted: jest.fn()
    } as any;

    container.bind(TrackTypes.LocalTrackRepository).toConstantValue(mockLocalRepo);
    container.bind(TrackTypes.TrackEventPublisher).toConstantValue(mockEventPublisher);
    container.bind(TrackRepositoryCoordinator).toSelf();

    coordinator = container.get(TrackRepositoryCoordinator);
  });

  describe('create', () => {
    it('應該創建音軌並發布事件', async () => {
      const trackId = TrackId.create();
      const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));

      await coordinator.create(track);

      expect(mockLocalRepo.create).toHaveBeenCalledWith(track);
      expect(mockEventPublisher.publishTrackCreated).toHaveBeenCalledWith(
        trackId,
        'Test Track',
        TrackType.AUDIO
      );
    });

    it('當創建失敗時應該拋出錯誤', async () => {
      const trackId = TrackId.create();
      const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));
      const error = new Error('Creation failed');

      mockLocalRepo.create.mockRejectedValue(error);

      await expect(coordinator.create(track)).rejects.toThrow('Failed to create track');
    });
  });

  describe('findById', () => {
    it('應該從本地倉庫查找音軌', async () => {
      const trackId = TrackId.create();
      const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));

      mockLocalRepo.findById.mockResolvedValue(track);

      const result = await coordinator.findById(trackId);

      expect(result).toBe(track);
      expect(mockLocalRepo.findById).toHaveBeenCalledWith(trackId);
    });
  });

  describe('save', () => {
    it('應該保存音軌並發布更新事件', async () => {
      const trackId = TrackId.create();
      const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));

      await coordinator.save(track);

      expect(mockLocalRepo.save).toHaveBeenCalledWith(track);
      expect(mockEventPublisher.publishTrackUpdated).toHaveBeenCalledWith(trackId, track);
    });

    it('當保存失敗時應該拋出錯誤', async () => {
      const trackId = TrackId.create();
      const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));
      const error = new Error('Save failed');

      mockLocalRepo.save.mockRejectedValue(error);

      await expect(coordinator.save(track)).rejects.toThrow('Failed to save track');
    });
  });

  describe('delete', () => {
    it('應該刪除音軌並發布刪除事件', async () => {
      const trackId = TrackId.create();

      await coordinator.delete(trackId);

      expect(mockLocalRepo.delete).toHaveBeenCalledWith(trackId);
      expect(mockEventPublisher.publishTrackDeleted).toHaveBeenCalledWith(trackId);
    });

    it('當刪除失敗時應該拋出錯誤', async () => {
      const trackId = TrackId.create();
      const error = new Error('Delete failed');

      mockLocalRepo.delete.mockRejectedValue(error);

      await expect(coordinator.delete(trackId)).rejects.toThrow('Failed to delete track');
    });
  });
}); 
