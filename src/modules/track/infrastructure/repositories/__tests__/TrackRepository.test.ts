import { Container } from 'inversify';
import { TYPES } from '../../../../../core/di/types';
import { TrackRepository } from '../../repositories/TrackRepository';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { BaseTrack } from '../../../domain/entities/BaseTrack';

describe('TrackRepository', () => {
  let container: Container;
  let trackRepository: TrackRepository;

  beforeEach(() => {
    container = new Container();
    container.bind<TrackRepository>(TYPES.TrackRepository).to(TrackRepository);
    trackRepository = container.get<TrackRepository>(TYPES.TrackRepository);
  });

  describe('create', () => {
    it('應該創建新的音軌', async () => {
      const trackData = {
        name: 'Test Track',
        type: 'audio' as const,
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      const track = await trackRepository.create(trackData);

      expect(track).toBeDefined();
      expect(track.name).toBe('Test Track');
      expect(track.type).toBe('audio');
      expect(track.trackId).toBeInstanceOf(TrackId);
    });
  });

  describe('findById', () => {
    it('應該返回存在的音軌', async () => {
      const trackData = {
        name: 'Test Track',
        type: 'audio' as const,
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      const createdTrack = await trackRepository.create(trackData);
      const foundTrack = await trackRepository.findById(createdTrack.trackId);

      expect(foundTrack).toBeDefined();
      expect(foundTrack?.trackId).toEqual(createdTrack.trackId);
    });

    it('當音軌不存在時應該返回 undefined', async () => {
      const nonExistentId = new TrackId('non-existent');
      const track = await trackRepository.findById(nonExistentId);

      expect(track).toBeUndefined();
    });
  });

  describe('save', () => {
    it('應該更新音軌', async () => {
      const trackData = {
        name: 'Test Track',
        type: 'audio' as const,
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      const createdTrack = await trackRepository.create(trackData);
      const updatedTrack: BaseTrack = {
        ...createdTrack,
        volume: 0.8
      };

      await trackRepository.save(updatedTrack);
      const foundTrack = await trackRepository.findById(createdTrack.trackId);

      expect(foundTrack?.volume).toBe(0.8);
    });
  });

  describe('delete', () => {
    it('應該刪除音軌', async () => {
      const trackData = {
        name: 'Test Track',
        type: 'audio' as const,
        volume: 1,
        mute: false,
        solo: false,
        pluginInstanceIds: []
      };

      const createdTrack = await trackRepository.create(trackData);
      await trackRepository.delete(createdTrack.trackId);
      const foundTrack = await trackRepository.findById(createdTrack.trackId);

      expect(foundTrack).toBeUndefined();
    });
  });
}); 