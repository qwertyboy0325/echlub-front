import { Container } from 'inversify';
import { TrackService } from '../TrackService';
import { TrackTypes } from '../../../di/TrackTypes';
import { TrackId } from '../../../domain/value-objects/track/TrackId';
import { TrackType } from '../../../domain/value-objects/track/TrackType';
import { TrackRouting } from '../../../domain/value-objects/track/TrackRouting';
import { ClipId } from '../../../domain/value-objects/clips/ClipId';
import { TrackMediator } from '../../mediators/TrackMediator';
import { TrackValidator } from '../../validators/TrackValidator';
import { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { PluginReference } from '../../../domain/value-objects/plugin/PluginReference';
import { TrackValidationError, TrackOperationError } from '../../../domain/errors/TrackError';
import { ValidationResult, ValidationError } from '../../../../shared/validation/ValidationResult';

describe('TrackService', () => {
  let container: Container;
  let service: TrackService;
  let mediator: jest.Mocked<TrackMediator>;
  let validator: jest.Mocked<TrackValidator>;
  let repository: jest.Mocked<ITrackRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let trackId: TrackId;
  let routing: TrackRouting;
  let track: AudioTrack;
  let clipId: ClipId;

  beforeEach(() => {
    container = new Container();
    
    // 創建模擬對象
    mediator = {
      createTrack: jest.fn(),
      renameTrack: jest.fn(),
      addClipToTrack: jest.fn(),
      removeClipFromTrack: jest.fn(),
      changeTrackRouting: jest.fn(),
      addPluginToTrack: jest.fn(),
      removePluginFromTrack: jest.fn(),
      addInputTrackToBus: jest.fn(),
      removeInputTrackFromBus: jest.fn(),
      addNoteToClip: jest.fn(),
      updateNoteInClip: jest.fn(),
      removeNoteFromClip: jest.fn(),
      deleteTrack: jest.fn(),
      getTrackById: jest.fn(),
      getTrackPlugins: jest.fn(),
      getTrackRouting: jest.fn(),
      getTrackGain: jest.fn(),
      getTrackName: jest.fn()
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
      validateRemoveInputTrackFromBus: jest.fn(),
      validateAddNoteToClip: jest.fn(),
      validateUpdateNoteInClip: jest.fn(),
      validateRemoveNoteFromClip: jest.fn()
    } as any;

    repository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any;

    eventBus = {
      publish: jest.fn()
    } as any;

    // 註冊依賴
    container.bind(TrackTypes.TrackMediator).toConstantValue(mediator);
    container.bind(TrackTypes.TrackValidator).toConstantValue(validator);
    container.bind(TrackTypes.TrackRepository).toConstantValue(repository);
    container.bind(TrackTypes.EventBus).toConstantValue(eventBus);
    container.bind(TrackService).toSelf();

    // 初始化測試數據
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    track = new AudioTrack(trackId, 'Test Track', routing);
    clipId = ClipId.create();

    // 獲取服務實例
    service = container.get(TrackService);
  });

  describe('createTrack', () => {
    it('當驗證通過時應該創建新軌道', async () => {
      validator.validateCreateTrack.mockReturnValue(ValidationResult.valid());
      mediator.createTrack.mockResolvedValue(trackId);

      const result = await service.createTrack('Test Track', 'audio');

      expect(result).toBe(trackId);
      expect(validator.validateCreateTrack).toHaveBeenCalled();
      expect(mediator.createTrack).toHaveBeenCalled();
    });

    it('當驗證失敗時應該拋出錯誤', async () => {
      validator.validateCreateTrack.mockReturnValue(
        new ValidationResult([new ValidationError('name', 'Invalid track name')])
      );

      await expect(service.createTrack('', 'audio')).rejects.toThrow(TrackValidationError);
    });
  });

  describe('renameTrack', () => {
    it('當驗證通過時應該重命名軌道', async () => {
      validator.validateRenameTrack.mockReturnValue(ValidationResult.valid());
      repository.findById.mockResolvedValue(track);

      await service.renameTrack(trackId, 'New Name');

      expect(validator.validateRenameTrack).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當軌道不存在時應該拋出錯誤', async () => {
      validator.validateRenameTrack.mockReturnValue(ValidationResult.valid());
      repository.findById.mockResolvedValue(null);

      await expect(service.renameTrack(trackId, 'New Name')).rejects.toThrow(TrackOperationError);
    });
  });

  describe('addClipToTrack', () => {
    it('當驗證通過時應該添加片段', async () => {
      validator.validateAddClipToTrack.mockReturnValue(ValidationResult.valid());

      await service.addClipToTrack(trackId, clipId);

      expect(validator.validateAddClipToTrack).toHaveBeenCalled();
      expect(mediator.addClipToTrack).toHaveBeenCalled();
    });

    it('當驗證失敗時應該拋出錯誤', async () => {
      validator.validateAddClipToTrack.mockReturnValue(
        new ValidationResult([new ValidationError('clipId', 'Invalid clip ID')])
      );

      await expect(service.addClipToTrack(trackId, clipId)).rejects.toThrow(TrackValidationError);
    });
  });

  describe('removeClipFromTrack', () => {
    it('當驗證通過時應該移除片段', async () => {
      validator.validateRemoveClipFromTrack.mockReturnValue(ValidationResult.valid());

      await service.removeClipFromTrack(trackId, clipId);

      expect(validator.validateRemoveClipFromTrack).toHaveBeenCalled();
      expect(mediator.removeClipFromTrack).toHaveBeenCalled();
    });
  });

  describe('setTrackRouting', () => {
    it('當驗證通過時應該設置路由', async () => {
      validator.validateChangeTrackRouting.mockReturnValue(ValidationResult.valid());
      repository.findById.mockResolvedValue(track);

      await service.setTrackRouting(trackId, routing);

      expect(validator.validateChangeTrackRouting).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('addPluginToTrack', () => {
    it('當驗證通過時應該添加插件', async () => {
      const pluginRef = new PluginReference('plugin-1');
      validator.validateAddPluginToTrack.mockReturnValue(ValidationResult.valid());

      await service.addPluginToTrack(trackId, pluginRef);

      expect(validator.validateAddPluginToTrack).toHaveBeenCalled();
      expect(mediator.addPluginToTrack).toHaveBeenCalled();
    });
  });

  describe('removePluginFromTrack', () => {
    it('當驗證通過時應該移除插件', async () => {
      const pluginRef = new PluginReference('plugin-1');
      validator.validateRemovePluginFromTrack.mockReturnValue(ValidationResult.valid());

      await service.removePluginFromTrack(trackId, pluginRef);

      expect(validator.validateRemovePluginFromTrack).toHaveBeenCalled();
      expect(mediator.removePluginFromTrack).toHaveBeenCalled();
    });
  });

  describe('updateTrackVolume', () => {
    it('當音量值有效時應該更新音量', async () => {
      repository.findById.mockResolvedValue(track);

      await service.updateTrackVolume(trackId, 0.8);

      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當音量值無效時應該拋出錯誤', async () => {
      await expect(service.updateTrackVolume(trackId, 1.5)).rejects.toThrow(TrackValidationError);
    });
  });

  describe('toggleMute', () => {
    it('應該切換靜音狀態', async () => {
      repository.findById.mockResolvedValue(track);

      await service.toggleMute(trackId);

      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當軌道不存在時應該拋出錯誤', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.toggleMute(trackId)).rejects.toThrow(TrackOperationError);
    });
  });
}); 