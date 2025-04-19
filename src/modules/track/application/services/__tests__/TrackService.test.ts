import { Container } from 'inversify';
import { TrackService } from '../TrackService';
import { TrackTypes } from '../../../di/TrackTypes';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { AudioClipId } from '../../../domain/value-objects/AudioClipId';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { BusTrack } from '../../../domain/entities/BusTrack';
import { TrackMediator } from '../../mediators/TrackMediator';
import { TrackValidator } from '../../validators/TrackValidator';
import { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { TrackValidationError } from '../../../domain/errors/TrackError';
import { ValidationResult } from '../../validators/TrackValidator';

describe('TrackService', () => {
  let container: Container;
  let service: TrackService;
  let mediator: jest.Mocked<TrackMediator>;
  let validator: jest.Mocked<TrackValidator>;
  let repository: jest.Mocked<ITrackRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let trackId: TrackId;
  let audioTrack: AudioTrack;
  let busTrack: BusTrack;

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

    // 創建 service 實例
    container.bind(TrackService).toSelf();
    service = container.get(TrackService);

    // 設置測試數據
    trackId = TrackId.create();
    const routing = new TrackRouting('input-1', 'output-1');
    audioTrack = new AudioTrack(trackId, 'Test Audio Track', routing);
    busTrack = new BusTrack(trackId, 'Test Bus Track', routing);
  });

  describe('createTrack', () => {
    it('應該在驗證通過後創建音軌', async () => {
      validator.validateCreateTrack.mockReturnValue(new ValidationResult());
      mediator.createTrack.mockResolvedValue(trackId);

      const result = await service.createTrack('Test Track', 'audio');

      expect(validator.validateCreateTrack).toHaveBeenCalledWith(
        'Test Track',
        TrackType.AUDIO
      );
      expect(result).toBe(trackId);
    });

    it('當驗證失敗時應該拋出錯誤', async () => {
      validator.validateCreateTrack.mockReturnValue(
        new ValidationResult([{ field: 'name', message: 'Invalid name' }])
      );

      await expect(service.createTrack('', 'audio'))
        .rejects.toThrow(TrackValidationError);
    });
  });

  describe('renameTrack', () => {
    it('應該在驗證通過後重命名音軌', async () => {
      validator.validateRenameTrack.mockReturnValue(new ValidationResult());

      await service.renameTrack(trackId, 'New Name');

      expect(validator.validateRenameTrack).toHaveBeenCalledWith(
        trackId,
        'New Name'
      );
      expect(mediator.renameTrack).toHaveBeenCalled();
    });
  });

  describe('addClipToTrack', () => {
    it('應該在驗證通過後添加片段', async () => {
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
    it('應該在驗證通過後移除片段', async () => {
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
    it('應該在驗證通過後更新路由', async () => {
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
      repository.findById.mockResolvedValue(audioTrack);

      await service.updateTrackVolume(trackId, 0.8);

      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(audioTrack);
      expect(eventBus.publish).toHaveBeenCalled();
      expect(audioTrack.getVolume()).toBe(0.8);
    });

    it('當音軌不存在時應該拋出錯誤', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.updateTrackVolume(trackId, 0.8))
        .rejects.toThrow('Track not found');
    });
  });

  describe('toggleMute', () => {
    it('應該切換音軌靜音狀態並發布事件', async () => {
      repository.findById.mockResolvedValue(audioTrack);

      await service.toggleMute(trackId);

      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(audioTrack);
      expect(eventBus.publish).toHaveBeenCalled();
      expect(audioTrack.isMuted()).toBe(true);
    });

    it('當音軌不存在時應該拋出錯誤', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.toggleMute(trackId))
        .rejects.toThrow('Track not found');
    });
  });
}); 