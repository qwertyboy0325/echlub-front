import { ClipService } from '../../../application/services/ClipService';
import { ClipMediator } from '../../../application/mediators/ClipMediator';
import { ClipValidator, ValidationResult, ValidationError } from '../../../application/validators/ClipValidator';
import { IClipRepository } from '../../../domain/repositories/IClipRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { BaseClip } from '../../../domain/entities/BaseClip';
import { ClipValidationError } from '../../../domain/errors/ClipError';

describe('ClipService', () => {
  let service: ClipService;
  let mockMediator: jest.Mocked<ClipMediator>;
  let mockValidator: jest.Mocked<ClipValidator>;
  let mockRepository: jest.Mocked<IClipRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockMediator = {
      createAudioClip: jest.fn(),
      createMidiClip: jest.fn(),
      updateClip: jest.fn(),
      deleteClip: jest.fn(),
    } as jest.Mocked<ClipMediator>;

    mockValidator = {
      validateCreateAudioClip: jest.fn(),
      validateCreateMidiClip: jest.fn(),
      validateUpdateClip: jest.fn(),
      validateDeleteClip: jest.fn(),
    } as jest.Mocked<ClipValidator>;

    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IClipRepository>;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    } as jest.Mocked<IEventBus>;

    service = new ClipService(mockMediator, mockValidator, mockRepository, mockEventBus);
  });

  describe('createAudioClip', () => {
    it('should create an audio clip when validation passes', async () => {
      const validationResult = new ValidationResult();
      mockValidator.validateCreateAudioClip.mockReturnValue(validationResult);

      const clipId = new ClipId('test-clip');
      mockMediator.createAudioClip.mockResolvedValue(clipId);

      const result = await service.createAudioClip('sample1', 0, 1000);
      expect(result).toBe(clipId);
    });

    it('should throw validation error when validation fails', async () => {
      const errors = [new ValidationError('duration', 'Duration must be positive')];
      const validationResult = new ValidationResult(errors);
      mockValidator.validateCreateAudioClip.mockReturnValue(validationResult);

      await expect(service.createAudioClip('sample1', 0, -1)).rejects.toThrow(ClipValidationError);
    });
  });

  describe('deleteClip', () => {
    it('should delete a clip when validation passes', async () => {
      const validationResult = new ValidationResult();
      mockValidator.validateDeleteClip.mockReturnValue(validationResult);

      const clipId = new ClipId('test-clip');
      await service.deleteClip(clipId);

      expect(mockMediator.deleteClip).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw validation error when validation fails', async () => {
      const errors = [new ValidationError('clipId', 'Clip ID is required')];
      const validationResult = new ValidationResult(errors);
      mockValidator.validateDeleteClip.mockReturnValue(validationResult);

      const clipId = new ClipId('test-clip');
      await expect(service.deleteClip(clipId)).rejects.toThrow(ClipValidationError);
    });
  });
}); 