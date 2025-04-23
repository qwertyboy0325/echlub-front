import { Container } from 'inversify';
import { TrackService } from '../services/TrackService';
import { TrackMediator } from '../mediators/TrackMediator';
import { TrackValidator, ValidationResult } from '../validators/TrackValidator';
import { TrackTypes } from '../../di/TrackTypes';
import { TrackId } from '../../domain/value-objects/track/TrackId';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';
import { PluginReference } from '../../domain/value-objects/plugin/PluginReference';
import { TrackValidationError, TrackOperationError } from '../../domain/errors/TrackError';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackRouting } from '../../domain/value-objects/track/TrackRouting';
import { TrackType } from '../../domain/value-objects/track/TrackType';
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { PluginReferenceAdapter } from '../../infrastructure/adapters/PluginReferenceAdapter';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';

describe('TrackService', () => {
  let container: Container;
  let trackService: TrackService;
  let mockMediator: jest.Mocked<TrackMediator>;
  let mockValidator: jest.Mocked<TrackValidator>;
  let mockPluginReferenceAdapter: jest.Mocked<PluginReferenceAdapter>;

  beforeEach(() => {
    container = new Container();
    
    mockMediator = {
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

    mockValidator = {
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

    mockPluginReferenceAdapter = {
      toPluginReference: jest.fn(),
      toPluginInstanceId: jest.fn()
    } as any;

    container.bind(TrackTypes.TrackMediator).toConstantValue(mockMediator);
    container.bind(TrackTypes.TrackValidator).toConstantValue(mockValidator);
    container.bind(TrackTypes.PluginReferenceAdapter).toConstantValue(mockPluginReferenceAdapter);
    container.bind(TrackService).toSelf();

    trackService = container.get(TrackService);
  });

  describe('createTrack', () => {
    it('應該成功創建音頻音軌', async () => {
      const trackId = TrackId.create();
      const name = 'Test Track';
      const type = 'audio';

      mockValidator.validateCreateTrack.mockReturnValue(new ValidationResult([]));
      mockMediator.createTrack.mockResolvedValue(trackId);

      const result = await trackService.createTrack(name, type);

      expect(result).toBe(trackId);
      expect(mockValidator.validateCreateTrack).toHaveBeenCalledWith(name, TrackType.AUDIO);
      expect(mockMediator.createTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
          type: TrackType.AUDIO
        })
      );
    });

    it('應該成功創建總線音軌', async () => {
      const trackId = TrackId.create();
      const name = 'Bus Track';
      const type = 'bus';

      mockValidator.validateCreateTrack.mockReturnValue(new ValidationResult([]));
      mockMediator.createTrack.mockResolvedValue(trackId);

      const result = await trackService.createTrack(name, type);

      expect(result).toBe(trackId);
      expect(mockValidator.validateCreateTrack).toHaveBeenCalledWith(name, TrackType.BUS);
      expect(mockMediator.createTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
          type: TrackType.BUS
        })
      );
    });

    it('當驗證失敗時應該拋出錯誤', async () => {
      const name = '';
      const type = 'audio';
      const errors = [{ field: 'name', message: 'Name is required' }];

      mockValidator.validateCreateTrack.mockReturnValue(new ValidationResult(errors));

      await expect(trackService.createTrack(name, type))
        .rejects
        .toThrow(TrackValidationError);
      expect(mockMediator.createTrack).not.toHaveBeenCalled();
    });
  });

  describe('操作錯誤處理', () => {
    it('應該正確處理操作錯誤', async () => {
      const name = 'Test Track';
      const operationError = new Error('Operation failed');

      mockValidator.validateCreateTrack.mockReturnValue(new ValidationResult([]));
      mockMediator.createTrack.mockRejectedValue(operationError);

      await expect(trackService.createTrack(name, 'audio'))
        .rejects
        .toThrow(TrackOperationError);
      expect(mockMediator.createTrack).toHaveBeenCalled();
    });
  });

  describe('renameTrack', () => {
    it('應該成功重命名音軌', async () => {
      const trackId = TrackId.create();
      const newName = 'New Track Name';

      mockValidator.validateRenameTrack.mockReturnValue(new ValidationResult([]));
      mockMediator.renameTrack.mockResolvedValue();

      await trackService.renameTrack(trackId, newName);

      expect(mockValidator.validateRenameTrack).toHaveBeenCalledWith(trackId, newName);
      expect(mockMediator.renameTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId,
          newName
        })
      );
    });
  });

  describe('addPluginToTrack', () => {
    it('應該成功添加插件到音軌', async () => {
      const trackId = TrackId.create();
      const pluginRef = PluginReference.create('test-plugin-id');

      mockValidator.validateAddPluginToTrack.mockReturnValue(new ValidationResult([]));
      mockMediator.addPluginToTrack.mockResolvedValue();

      await trackService.addPluginToTrack(trackId, pluginRef);

      expect(mockValidator.validateAddPluginToTrack).toHaveBeenCalledWith(trackId, pluginRef.toString());
      expect(mockMediator.addPluginToTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId,
          pluginRef
        })
      );
    });
  });

  describe('addClipToTrack', () => {
    it('應該成功添加片段到音軌', async () => {
      const trackId = TrackId.create();
      const clipId = ClipId.create();

      mockValidator.validateAddClipToTrack.mockReturnValue(new ValidationResult([]));
      mockMediator.addClipToTrack.mockResolvedValue();

      await trackService.addClipToTrack(trackId, clipId);

      expect(mockValidator.validateAddClipToTrack).toHaveBeenCalledWith(trackId, clipId);
      expect(mockMediator.addClipToTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId,
          clipId
        })
      );
    });
  });

  describe('setTrackRouting', () => {
    it('應該成功設置音軌路由', async () => {
      const trackId = TrackId.create();
      const routing = new TrackRouting(null, null);

      mockValidator.validateChangeTrackRouting.mockReturnValue(new ValidationResult([]));
      mockMediator.changeTrackRouting.mockResolvedValue();

      await trackService.setTrackRouting(trackId, routing);

      expect(mockValidator.validateChangeTrackRouting).toHaveBeenCalledWith(trackId, routing);
      expect(mockMediator.changeTrackRouting).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId,
          routing
        })
      );
    });
  });

  describe('總線音軌操作', () => {
    it('應該成功添加輸入音軌到總線', async () => {
      const busTrackId = TrackId.create();
      const inputTrackId = TrackId.create();

      mockValidator.validateAddInputTrackToBus.mockReturnValue(new ValidationResult([]));
      mockMediator.addInputTrackToBus.mockResolvedValue();

      await trackService.addInputTrackToBus(busTrackId, inputTrackId);

      expect(mockValidator.validateAddInputTrackToBus).toHaveBeenCalledWith(busTrackId, inputTrackId);
      expect(mockMediator.addInputTrackToBus).toHaveBeenCalledWith(
        expect.objectContaining({
          busTrackId,
          inputTrackId
        })
      );
    });

    it('應該成功從總線移除輸入音軌', async () => {
      const busTrackId = TrackId.create();
      const inputTrackId = TrackId.create();

      mockValidator.validateRemoveInputTrackFromBus.mockReturnValue(new ValidationResult([]));
      mockMediator.removeInputTrackFromBus.mockResolvedValue();

      await trackService.removeInputTrackFromBus(busTrackId, inputTrackId);

      expect(mockValidator.validateRemoveInputTrackFromBus).toHaveBeenCalledWith(busTrackId, inputTrackId);
      expect(mockMediator.removeInputTrackFromBus).toHaveBeenCalledWith(
        expect.objectContaining({
          busTrackId,
          inputTrackId
        })
      );
    });
  });
}); 