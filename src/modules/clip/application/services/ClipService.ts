import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { ClipId } from '../../domain/value-objects/ClipId';
import { ClipMediator } from '../mediators/ClipMediator';
import { ClipValidator } from '../validators/ClipValidator';
import { ClipValidationError, ClipOperationError } from '../../domain/errors/ClipError';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { CreateAudioClipCommand, CreateMidiClipCommand, UpdateClipCommand, DeleteClipCommand } from '../commands';
import { ClipUpdatedEvent } from '../../domain/events/ClipUpdatedEvent';

@injectable()
export class ClipService {
  constructor(
    @inject(ClipTypes.ClipMediator) private mediator: ClipMediator,
    @inject(ClipTypes.ClipValidator) private validator: ClipValidator,
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async createAudioClip(
    sampleId: string,
    startTime: number,
    duration: number,
    offset: number = 0
  ): Promise<ClipId> {
    const validationResult = this.validator.validateCreateAudioClip(sampleId, startTime, duration, offset);
    if (!validationResult.isValid) {
      throw new ClipValidationError(validationResult.errors);
    }

    try {
      const command = new CreateAudioClipCommand(sampleId, startTime, duration, offset);
      return await this.mediator.createAudioClip(command);
    } catch (error) {
      if (error instanceof ClipValidationError) {
        throw error;
      }
      throw new ClipOperationError('Failed to create audio clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async createMidiClip(
    startTime: number,
    duration: number,
    timeSignature?: { numerator: number; denominator: number }
  ): Promise<ClipId> {
    const validationResult = this.validator.validateCreateMidiClip(startTime, duration, timeSignature);
    if (!validationResult.isValid) {
      throw new ClipValidationError(validationResult.errors);
    }

    try {
      const command = new CreateMidiClipCommand(startTime, duration, timeSignature);
      return await this.mediator.createMidiClip(command);
    } catch (error) {
      if (error instanceof ClipValidationError) {
        throw error;
      }
      throw new ClipOperationError('Failed to create MIDI clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateClip(
    clipId: ClipId,
    updates: {
      startTime?: number;
      duration?: number;
      gain?: number;
      offset?: number;
      notes?: { id: string; pitch: number; velocity: number; startTime: number; duration: number }[];
    }
  ): Promise<void> {
    const validationResult = this.validator.validateUpdateClip(clipId, updates);
    if (!validationResult.isValid) {
      throw new ClipValidationError(validationResult.errors);
    }

    try {
      const command = new UpdateClipCommand(clipId, updates);
      await this.mediator.updateClip(command);
    } catch (error) {
      if (error instanceof ClipValidationError) {
        throw error;
      }
      throw new ClipOperationError('Failed to update clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deleteClip(clipId: ClipId): Promise<void> {
    const validationResult = this.validator.validateDeleteClip(clipId);
    if (!validationResult.isValid) {
      throw new ClipValidationError(validationResult.errors);
    }

    try {
      const command = new DeleteClipCommand(clipId);
      await this.mediator.deleteClip(command);
    } catch (error) {
      if (error instanceof ClipValidationError) {
        throw error;
      }
      throw new ClipOperationError('Failed to delete clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateClipGain(clipId: ClipId, gain: number): Promise<void> {
    const clip = await this.repository.findById(clipId);
    if (!clip) {
      throw new ClipOperationError('Clip not found');
    }

    clip.setGain(gain);
    await this.repository.save(clip);
    await this.eventBus.publish(new ClipUpdatedEvent(clipId, clip));
  }
} 