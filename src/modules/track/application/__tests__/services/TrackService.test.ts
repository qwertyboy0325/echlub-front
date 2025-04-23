import { TrackService } from '../../services/TrackService';
import { TrackMediator } from '../../mediators/TrackMediator';
import { TrackValidator } from '../../validators/TrackValidator';
import { TrackId } from '../../../domain/value-objects/track/TrackId';
import { TrackRouting } from '../../../domain/value-objects/track/TrackRouting';
import { ClipId } from '../../../domain/value-objects/clips/ClipId';
import { PluginReference } from '../../../domain/value-objects/plugin/PluginReference';
import { TrackType } from '../../../domain/value-objects/track/TrackType';
import { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { TrackValidationError, TrackOperationError } from '../../../domain/errors/TrackError';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { MidiTrack } from '../../../domain/entities/MidiTrack';
import { BusTrack } from '../../../domain/entities/BusTrack';

// Mock implementations
class MockTrackMediator implements Partial<TrackMediator> {
  createTrack = jest.fn();
  renameTrack = jest.fn();
  addClipToTrack = jest.fn();
  removeClipFromTrack = jest.fn();
  addPluginToTrack = jest.fn();
  removePluginFromTrack = jest.fn();
  addInputTrackToBus = jest.fn();
  removeInputTrackFromBus = jest.fn();
  getTrackById = jest.fn();
  getTrackPlugins = jest.fn();
  getTrackRouting = jest.fn();
  getTrackGain = jest.fn();
  getTrackName = jest.fn();
}

class MockTrackValidator implements Partial<TrackValidator> {
  validateCreateTrack = jest.fn();
  validateRenameTrack = jest.fn();
  validateAddClipToTrack = jest.fn();
  validateRemoveClipFromTrack = jest.fn();
  validateAddPluginToTrack = jest.fn();
  validateRemovePluginFromTrack = jest.fn();
  validateAddInputTrackToBus = jest.fn();
  validateRemoveInputTrackFromBus = jest.fn();
}

class MockTrackRepository implements Partial<ITrackRepository> {
  findById = jest.fn();
  save = jest.fn();
}

class MockEventBus implements Partial<IEventBus> {
  publish = jest.fn();
}

describe('TrackService', () => {
  let service: TrackService;
  let mediator: MockTrackMediator;
  let validator: MockTrackValidator;
  let repository: MockTrackRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    mediator = new MockTrackMediator();
    validator = new MockTrackValidator();
    repository = new MockTrackRepository();
    eventBus = new MockEventBus();
    service = new TrackService(
      mediator as any,
      validator as any,
      repository as any,
      eventBus as any
    );
  });

  describe('創建軌道', () => {
    it('應該成功創建音頻軌道', async () => {
      const trackId = TrackId.create();
      validator.validateCreateTrack.mockReturnValue({ isValid: true });
      mediator.createTrack.mockResolvedValue(trackId);

      const result = await service.createTrack('Audio Track', 'audio');
      
      expect(result).toBe(trackId);
      expect(validator.validateCreateTrack).toHaveBeenCalledWith('Audio Track', TrackType.AUDIO);
      expect(mediator.createTrack).toHaveBeenCalled();
    });

    it('應該在驗證失敗時拋出錯誤', async () => {
      validator.validateCreateTrack.mockReturnValue({
        isValid: false,
        errors: ['Invalid track name']
      });

      await expect(service.createTrack('', 'audio'))
        .rejects
        .toThrow(TrackValidationError);
    });
  });

  describe('重命名軌道', () => {
    const trackId = TrackId.create();
    const track = new AudioTrack(trackId, 'Old Name', new TrackRouting(null, null));

    it('應該成功重命名軌道', async () => {
      validator.validateRenameTrack.mockReturnValue({ isValid: true });
      repository.findById.mockResolvedValue(track);

      await service.renameTrack(trackId, 'New Name');

      expect(validator.validateRenameTrack).toHaveBeenCalledWith(trackId, 'New Name');
      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('應該在軌道不存在時拋出錯誤', async () => {
      validator.validateRenameTrack.mockReturnValue({ isValid: true });
      repository.findById.mockResolvedValue(null);

      await expect(service.renameTrack(trackId, 'New Name'))
        .rejects
        .toThrow(TrackOperationError);
    });
  });

  describe('音頻控制', () => {
    const trackId = TrackId.create();
    const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));

    beforeEach(() => {
      repository.findById.mockResolvedValue(track);
    });

    it('應該成功更新音量', async () => {
      await service.updateTrackVolume(trackId, 0.8);

      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
      expect(track.getVolume()).toBe(0.8);
    });

    it('應該在音量值無效時拋出錯誤', async () => {
      await expect(service.updateTrackVolume(trackId, 1.5))
        .rejects
        .toThrow(TrackValidationError);
    });

    it('應該成功切換靜音狀態', async () => {
      await service.toggleMute(trackId);

      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
      expect(track.isMuted()).toBe(true);
    });
  });

  describe('片段管理', () => {
    const trackId = TrackId.create();
    const clipId = ClipId.create();

    it('應該成功添加片段', async () => {
      validator.validateAddClipToTrack.mockReturnValue({ isValid: true });
      mediator.addClipToTrack.mockResolvedValue(undefined);

      await service.addClipToTrack(trackId, clipId);

      expect(validator.validateAddClipToTrack).toHaveBeenCalledWith(trackId, clipId.toString());
      expect(mediator.addClipToTrack).toHaveBeenCalledWith(expect.objectContaining({
        trackId,
        clipId
      }));
    });

    it('應該成功移除片段', async () => {
      validator.validateRemoveClipFromTrack.mockReturnValue({ isValid: true });
      mediator.removeClipFromTrack.mockResolvedValue(undefined);

      await service.removeClipFromTrack(trackId, clipId);

      expect(validator.validateRemoveClipFromTrack).toHaveBeenCalledWith(trackId, clipId.toString());
      expect(mediator.removeClipFromTrack).toHaveBeenCalledWith(expect.objectContaining({
        trackId,
        clipId
      }));
    });
  });

  describe('插件管理', () => {
    const trackId = TrackId.create();
    const pluginRef = new PluginReference('plugin-1');

    it('應該成功添加插件', async () => {
      validator.validateAddPluginToTrack.mockReturnValue({ isValid: true });
      mediator.addPluginToTrack.mockResolvedValue(undefined);

      await service.addPluginToTrack(trackId, pluginRef);

      expect(validator.validateAddPluginToTrack).toHaveBeenCalledWith(trackId, pluginRef.toString());
      expect(mediator.addPluginToTrack).toHaveBeenCalledWith(expect.objectContaining({
        trackId,
        pluginRef
      }));
    });

    it('應該成功移除插件', async () => {
      validator.validateRemovePluginFromTrack.mockReturnValue({ isValid: true });
      mediator.removePluginFromTrack.mockResolvedValue(undefined);

      await service.removePluginFromTrack(trackId, pluginRef);

      expect(validator.validateRemovePluginFromTrack).toHaveBeenCalledWith(trackId, pluginRef.toString());
      expect(mediator.removePluginFromTrack).toHaveBeenCalledWith(expect.objectContaining({
        trackId,
        pluginRef
      }));
    });
  });

  describe('匯流排管理', () => {
    const busTrackId = TrackId.create();
    const inputTrackId = TrackId.create();

    it('應該成功添加輸入軌道到匯流排', async () => {
      validator.validateAddInputTrackToBus.mockReturnValue({ isValid: true });
      mediator.addInputTrackToBus.mockResolvedValue(undefined);

      await service.addInputTrackToBus(busTrackId, inputTrackId);

      expect(validator.validateAddInputTrackToBus).toHaveBeenCalledWith(busTrackId, inputTrackId);
      expect(mediator.addInputTrackToBus).toHaveBeenCalledWith(expect.objectContaining({
        busTrackId,
        inputTrackId
      }));
    });

    it('應該成功從匯流排移除輸入軌道', async () => {
      validator.validateRemoveInputTrackFromBus.mockReturnValue({ isValid: true });
      mediator.removeInputTrackFromBus.mockResolvedValue(undefined);

      await service.removeInputTrackFromBus(busTrackId, inputTrackId);

      expect(validator.validateRemoveInputTrackFromBus).toHaveBeenCalledWith(busTrackId, inputTrackId);
      expect(mediator.removeInputTrackFromBus).toHaveBeenCalledWith(expect.objectContaining({
        busTrackId,
        inputTrackId
      }));
    });
  });

  describe('查詢操作', () => {
    const trackId = TrackId.create();
    const track = new AudioTrack(trackId, 'Test Track', new TrackRouting(null, null));

    beforeEach(() => {
      mediator.getTrackById.mockResolvedValue(track);
      mediator.getTrackPlugins.mockResolvedValue([]);
      mediator.getTrackRouting.mockResolvedValue(track.getRouting());
      mediator.getTrackGain.mockResolvedValue(track.getVolume());
      mediator.getTrackName.mockResolvedValue(track.getName());
    });

    it('應該成功獲取軌道實體', async () => {
      const result = await service.getTrackById(trackId);
      expect(result).toBe(track);
      expect(mediator.getTrackById).toHaveBeenCalledWith(expect.objectContaining({
        trackId
      }));
    });

    it('應該成功獲取軌道插件列表', async () => {
      const result = await service.getTrackPlugins(trackId);
      expect(result).toEqual([]);
      expect(mediator.getTrackPlugins).toHaveBeenCalledWith(expect.objectContaining({
        trackId
      }));
    });

    it('應該成功獲取軌道路由設置', async () => {
      const result = await service.getTrackRouting(trackId);
      expect(result).toEqual(track.getRouting());
      expect(mediator.getTrackRouting).toHaveBeenCalledWith(expect.objectContaining({
        trackId
      }));
    });

    it('應該成功獲取軌道音量', async () => {
      const result = await service.getTrackGain(trackId);
      expect(result).toBe(track.getVolume());
      expect(mediator.getTrackGain).toHaveBeenCalledWith(expect.objectContaining({
        trackId
      }));
    });

    it('應該成功獲取軌道名稱', async () => {
      const result = await service.getTrackName(trackId);
      expect(result).toBe(track.getName());
      expect(mediator.getTrackName).toHaveBeenCalledWith(expect.objectContaining({
        trackId
      }));
    });
  });
}); 