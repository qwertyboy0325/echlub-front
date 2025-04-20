import { ClipService } from '../../../application/services/ClipService';
import { ClipMediator } from '../../../application/mediators/ClipMediator';
import { ClipValidator, ValidationError } from '../../../application/validators/ClipValidator';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { ClipValidationError, ClipOperationError } from '../../../domain/errors/ClipError';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { BaseClip } from '../../../domain/entities/BaseClip';

// Mock 依賴
jest.mock('../../../application/mediators/ClipMediator');
jest.mock('../../../application/validators/ClipValidator');
jest.mock('../../../domain/repositories/IClipRepository');
jest.mock('../../../../../core/event-bus/IEventBus');

describe('ClipService', () => {
  let service: ClipService;
  let mediator: jest.Mocked<ClipMediator>;
  let validator: jest.Mocked<ClipValidator>;
  let repository: jest.Mocked<IClipRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mediator = {
      createAudioClip: jest.fn(),
      createMidiClip: jest.fn(),
      updateClip: jest.fn(),
      deleteClip: jest.fn()
    } as any;

    validator = {
      validateCreateAudioClip: jest.fn(),
      validateCreateMidiClip: jest.fn(),
      validateUpdateClip: jest.fn(),
      validateDeleteClip: jest.fn()
    } as any;

    repository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any;

    eventBus = {
      publish: jest.fn()
    } as any;

    service = new ClipService(mediator, validator, repository, eventBus);
  });

  describe('創建音頻片段', () => {
    const sampleId = 'test-sample';
    const startTime = 0;
    const duration = 10;
    const offset = 2;

    it('應該成功創建音頻片段', async () => {
      const clipId = ClipId.create();
      validator.validateCreateAudioClip.mockReturnValue({ isValid: true, errors: [] });
      mediator.createAudioClip.mockResolvedValue(clipId);

      const result = await service.createAudioClip(sampleId, startTime, duration, offset);

      expect(result).toBe(clipId);
      expect(validator.validateCreateAudioClip).toHaveBeenCalledWith(sampleId, startTime, duration, offset);
      expect(mediator.createAudioClip).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleId,
          startTime,
          duration,
          offset
        })
      );
    });

    it('當驗證失敗時應拋出錯誤', async () => {
      const errors = [new ValidationError('sampleId', 'Invalid sample ID')];
      validator.validateCreateAudioClip.mockReturnValue({ isValid: false, errors });

      await expect(service.createAudioClip(sampleId, startTime, duration, offset))
        .rejects.toThrow(ClipValidationError);
      expect(mediator.createAudioClip).not.toHaveBeenCalled();
    });

    it('當創建失敗時應拋出操作錯誤', async () => {
      validator.validateCreateAudioClip.mockReturnValue({ isValid: true, errors: [] });
      mediator.createAudioClip.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createAudioClip(sampleId, startTime, duration, offset))
        .rejects.toThrow(ClipOperationError);
    });
  });

  describe('創建MIDI片段', () => {
    const startTime = 0;
    const duration = 10;
    const timeSignature = { numerator: 4, denominator: 4 };

    it('應該成功創建MIDI片段', async () => {
      const clipId = ClipId.create();
      validator.validateCreateMidiClip.mockReturnValue({ isValid: true, errors: [] });
      mediator.createMidiClip.mockResolvedValue(clipId);

      const result = await service.createMidiClip(startTime, duration, timeSignature);

      expect(result).toBe(clipId);
      expect(validator.validateCreateMidiClip).toHaveBeenCalledWith(startTime, duration, timeSignature);
      expect(mediator.createMidiClip).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime,
          duration,
          timeSignature
        })
      );
    });

    it('當驗證失敗時應拋出錯誤', async () => {
      const errors = [new ValidationError('timeSignature', 'Invalid time signature')];
      validator.validateCreateMidiClip.mockReturnValue({ isValid: false, errors });

      await expect(service.createMidiClip(startTime, duration, timeSignature))
        .rejects.toThrow(ClipValidationError);
      expect(mediator.createMidiClip).not.toHaveBeenCalled();
    });

    it('當創建失敗時應拋出操作錯誤', async () => {
      validator.validateCreateMidiClip.mockReturnValue({ isValid: true, errors: [] });
      mediator.createMidiClip.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createMidiClip(startTime, duration, timeSignature))
        .rejects.toThrow(ClipOperationError);
    });
  });

  describe('更新片段', () => {
    const clipId = ClipId.create();
    const updates = {
      startTime: 1,
      duration: 5,
      gain: 0.8
    };

    it('應該成功更新片段', async () => {
      validator.validateUpdateClip.mockReturnValue({ isValid: true, errors: [] });

      await service.updateClip(clipId, updates);

      expect(validator.validateUpdateClip).toHaveBeenCalledWith(clipId, updates);
      expect(mediator.updateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          clipId,
          updates
        })
      );
    });

    it('當驗證失敗時應拋出錯誤', async () => {
      const errors = [new ValidationError('updates', 'Invalid update parameters')];
      validator.validateUpdateClip.mockReturnValue({ isValid: false, errors });

      await expect(service.updateClip(clipId, updates))
        .rejects.toThrow(ClipValidationError);
      expect(mediator.updateClip).not.toHaveBeenCalled();
    });

    it('當更新失敗時應拋出操作錯誤', async () => {
      validator.validateUpdateClip.mockReturnValue({ isValid: true, errors: [] });
      mediator.updateClip.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateClip(clipId, updates))
        .rejects.toThrow(ClipOperationError);
    });
  });

  describe('刪除片段', () => {
    const clipId = ClipId.create();

    it('應該成功刪除片段', async () => {
      validator.validateDeleteClip.mockReturnValue({ isValid: true, errors: [] });

      await service.deleteClip(clipId);

      expect(validator.validateDeleteClip).toHaveBeenCalledWith(clipId);
      expect(mediator.deleteClip).toHaveBeenCalledWith(
        expect.objectContaining({
          clipId
        })
      );
    });

    it('當驗證失敗時應拋出錯誤', async () => {
      const errors = [new ValidationError('clipId', 'Invalid clip ID')];
      validator.validateDeleteClip.mockReturnValue({ isValid: false, errors });

      await expect(service.deleteClip(clipId))
        .rejects.toThrow(ClipValidationError);
      expect(mediator.deleteClip).not.toHaveBeenCalled();
    });

    it('當刪除失敗時應拋出操作錯誤', async () => {
      validator.validateDeleteClip.mockReturnValue({ isValid: true, errors: [] });
      mediator.deleteClip.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.deleteClip(clipId))
        .rejects.toThrow(ClipOperationError);
    });
  });

  describe('更新片段增益', () => {
    const clipId = ClipId.create();
    const gain = 0.8;

    it('應該成功更新片段增益', async () => {
      const mockClip = {
        getId: jest.fn().mockReturnValue(clipId.toString()),
        setGain: jest.fn(),
        getStartTime: jest.fn().mockReturnValue(0),
        getDuration: jest.fn().mockReturnValue(10),
        getGain: jest.fn().mockReturnValue(1),
        incrementVersion: jest.fn(),
        getVersion: jest.fn().mockReturnValue(1),
        getState: jest.fn(),
        toJSON: jest.fn(),
        clone: jest.fn()
      } as unknown as BaseClip;

      repository.findById.mockResolvedValue(mockClip);

      await service.updateClipGain(clipId, gain);

      expect(repository.findById).toHaveBeenCalledWith(clipId);
      expect(mockClip.setGain).toHaveBeenCalledWith(gain);
      expect(repository.save).toHaveBeenCalledWith(mockClip);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當片段不存在時應拋出錯誤', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.updateClipGain(clipId, gain))
        .rejects.toThrow(ClipOperationError);
      expect(repository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});