import { Container } from 'inversify';
import { TrackService } from '../TrackService';
import { TrackTypes } from '../../../di/TrackTypes';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { AudioClipId } from '../../../domain/value-objects/AudioClipId';
import { TrackMediator } from '../../mediators/TrackMediator';
import { TrackValidator } from '../../validators/TrackValidator';
import { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { TrackValidationError, TrackOperationError } from '../../../domain/errors/TrackError';
import { ValidationResult } from '../../validators/TrackValidator';

describe('TrackService', () => {
  let container: Container;
  let service: TrackService;
  let mediator: jest.Mocked<TrackMediator>;
  let validator: jest.Mocked<TrackValidator>;
  let repository: jest.Mocked<ITrackRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let trackId: TrackId;
  let track: AudioTrack;

  beforeEach(() => {
    container = new Container();

    // 創建所有依賴的模擬對象
    mediator = {
      createTrack: jest.fn(),
      renameTrack: jest.fn(),
      addClipToTrack: jest.fn(),
      removeClipFromTrack: jest.fn(),
      changeTrackRouting: jest.fn(),
      addPluginToTrack: jest.fn(),
      removePluginFromTrack: jest.fn(),
      addInputTrackToBus: jest.fn(),
      removeInputTrackFromBus: jest.fn()
    } as any;

    validator = {
      validateCreateTrack: jest.fn(),
      validateRenameTrack: jest.fn(),
      validateAddClipToTrack: jest.fn(),
      validateRemoveClipFromTrack: jest.fn(),
      validateChangeTrackRouting: jest.fn(),
      validateAddPluginToTrack: jest.fn(),
      validateRemovePluginFromTrack: jest.fn(),
      validateAddInputTrackToBus: jest.fn(),
      validateRemoveInputTrackFromBus: jest.fn()
    } as any;

    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any;

    eventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      publish: jest.fn()
    } as any;

    // 註冊所有模擬對象
    container.bind(TrackTypes.TrackMediator).toConstantValue(mediator);
    container.bind(TrackTypes.TrackValidator).toConstantValue(validator);
    container.bind(TrackTypes.TrackRepository).toConstantValue(repository);
    container.bind(TrackTypes.EventBus).toConstantValue(eventBus);

    // 創建 TrackService 實例
    container.bind(TrackService).toSelf();
    service = container.get(TrackService);

    // 設置通用測試數據
    trackId = TrackId.create();
    track = new AudioTrack(
      trackId,
      'Test Track',
      new TrackRouting('input-1', 'output-1')
    );
  });

  describe('createTrack', () => {
    it('應該在驗證通過時創建音軌', async () => {
      validator.validateCreateTrack.mockReturnValue(new ValidationResult());
      mediator.createTrack.mockResolvedValue(trackId);

      const result = await service.createTrack('Test Track', 'audio');

      expect(validator.validateCreateTrack).toHaveBeenCalledWith(
        'Test Track',
        TrackType.AUDIO
      );
      expect(mediator.createTrack).toHaveBeenCalled();
      expect(result).toBe(trackId);
    });

    it('應該在驗證失敗時拋出 TrackValidationError', async () => {
      validator.validateCreateTrack.mockReturnValue(
        new ValidationResult([{ field: 'name', message: 'Name is required' }])
      );

      await expect(service.createTrack('', 'audio'))
        .rejects.toThrow(TrackValidationError);
    });
  });

  describe('renameTrack', () => {
    it('應該在驗證通過時重命名音軌', async () => {
      validator.validateRenameTrack.mockReturnValue(new ValidationResult());

      await service.renameTrack(trackId, 'New Name');

      expect(validator.validateRenameTrack).toHaveBeenCalledWith(
        trackId,
        'New Name'
      );
      expect(mediator.renameTrack).toHaveBeenCalled();
    });

    it('應該在驗證失敗時拋出 TrackValidationError', async () => {
      validator.validateRenameTrack.mockReturnValue(
        new ValidationResult([{ field: 'newName', message: 'New name is required' }])
      );

      await expect(service.renameTrack(trackId, ''))
        .rejects.toThrow(TrackValidationError);
    });
  });

  describe('addClipToTrack', () => {
    it('應該在驗證通過時添加片段', async () => {
      const clipId = AudioClipId.fromString('clip-1');
      validator.validateAddClipToTrack.mockReturnValue(new ValidationResult());

      await service.addClipToTrack(trackId, clipId);

      expect(validator.validateAddClipToTrack).toHaveBeenCalledWith(
        trackId,
        clipId.toString()
      );
      expect(mediator.addClipToTrack).toHaveBeenCalled();
    });
  });

  describe('removeClipFromTrack', () => {
    it('應該在驗證通過時移除片段', async () => {
      const clipId = AudioClipId.fromString('clip-1');
      validator.validateRemoveClipFromTrack.mockReturnValue(new ValidationResult());

      await service.removeClipFromTrack(trackId, clipId);

      expect(validator.validateRemoveClipFromTrack).toHaveBeenCalledWith(
        trackId,
        clipId.toString()
      );
      expect(mediator.removeClipFromTrack).toHaveBeenCalled();
    });
  });

  describe('setTrackRouting', () => {
    it('應該在驗證通過時更新路由', async () => {
      const routing = new TrackRouting('new-input', 'new-output');
      validator.validateChangeTrackRouting.mockReturnValue(new ValidationResult());

      await service.setTrackRouting(trackId, routing);

      expect(validator.validateChangeTrackRouting).toHaveBeenCalledWith(
        trackId,
        routing
      );
      expect(mediator.changeTrackRouting).toHaveBeenCalled();
    });
  });

  describe('updateTrackVolume', () => {
    it('應該更新音軌音量並發布事件', async () => {
      repository.findById.mockResolvedValue(track);

      await service.updateTrackVolume(trackId, 0.8);

      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(track.getVolume()).toBe(0.8);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當音軌不存在時應該拋出錯誤', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.updateTrackVolume(trackId, 0.8))
        .rejects.toThrow(TrackOperationError);
    });

    it('當音量為負數時應該拋出錯誤', async () => {
      repository.findById.mockResolvedValue(track);

      await expect(service.updateTrackVolume(trackId, -0.5))
        .rejects.toThrow('Volume cannot be negative');
    });
  });

  describe('toggleMute', () => {
    it('應該切換音軌靜音狀態並發布事件', async () => {
      repository.findById.mockResolvedValue(track);

      await service.toggleMute(trackId);

      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(track.isMuted()).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();

      // 再次切換
      await service.toggleMute(trackId);
      expect(track.isMuted()).toBe(false);
    });

    it('當音軌不存在時應該拋出錯誤', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.toggleMute(trackId))
        .rejects.toThrow(TrackOperationError);
    });
  });

  describe('addPluginToTrack', () => {
    it('應該在驗證通過時添加插件', async () => {
      const pluginRef = {
        id: 'plugin-1',
        equals: jest.fn(),
        toString: () => 'plugin-1'
      };
      validator.validateAddPluginToTrack.mockReturnValue(new ValidationResult());

      await service.addPluginToTrack(trackId, pluginRef);

      expect(validator.validateAddPluginToTrack).toHaveBeenCalledWith(
        trackId,
        pluginRef.toString()
      );
      expect(mediator.addPluginToTrack).toHaveBeenCalled();
    });
  });

  describe('removePluginFromTrack', () => {
    it('應該在驗證通過時移除插件', async () => {
      const pluginRef = {
        id: 'plugin-1',
        equals: jest.fn(),
        toString: () => 'plugin-1'
      };
      validator.validateRemovePluginFromTrack.mockReturnValue(new ValidationResult());

      await service.removePluginFromTrack(trackId, pluginRef);

      expect(validator.validateRemovePluginFromTrack).toHaveBeenCalledWith(
        trackId,
        pluginRef.toString()
      );
      expect(mediator.removePluginFromTrack).toHaveBeenCalled();
    });
  });

  describe('addInputTrackToBus', () => {
    it('應該在驗證通過時添加輸入音軌', async () => {
      const inputTrackId = TrackId.create();
      validator.validateAddInputTrackToBus.mockReturnValue(new ValidationResult());

      await service.addInputTrackToBus(trackId, inputTrackId);

      expect(validator.validateAddInputTrackToBus).toHaveBeenCalledWith(
        trackId,
        inputTrackId
      );
      expect(mediator.addInputTrackToBus).toHaveBeenCalled();
    });
  });

  describe('removeInputTrackFromBus', () => {
    it('應該在驗證通過時移除輸入音軌', async () => {
      const inputTrackId = TrackId.create();
      validator.validateRemoveInputTrackFromBus.mockReturnValue(new ValidationResult());

      await service.removeInputTrackFromBus(trackId, inputTrackId);

      expect(validator.validateRemoveInputTrackFromBus).toHaveBeenCalledWith(
        trackId,
        inputTrackId
      );
      expect(mediator.removeInputTrackFromBus).toHaveBeenCalled();
    });
  });
}); 
