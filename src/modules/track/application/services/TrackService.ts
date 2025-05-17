import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackRouting } from '../../domain/value-objects/TrackRouting';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackMediator } from '../mediators/TrackMediator';
import { TrackValidator } from '../validators/TrackValidator';
import { TrackValidationError, TrackOperationError } from '../../domain/errors/TrackError';
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { RenameTrackCommand } from '../commands/RenameTrackCommand';
import { AddClipToTrackCommand } from '../commands/AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../commands/RemoveClipFromTrackCommand';
import { ChangeTrackRoutingCommand } from '../commands/ChangeTrackRoutingCommand';
import { AddPluginToTrackCommand } from '../commands/AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../commands/RemovePluginFromTrackCommand';
import { AddInputTrackToBusCommand } from '../commands/AddInputTrackToBusCommand';
import { RemoveInputTrackFromBusCommand } from '../commands/RemoveInputTrackFromBusCommand';
import { TrackType } from '../../domain/value-objects/TrackType';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackUpdatedEvent } from '../../domain/events/TrackUpdatedEvent';

@injectable()
export class TrackService {
  constructor(
    @inject(TrackTypes.TrackMediator) private mediator: TrackMediator,
    @inject(TrackTypes.TrackValidator) private validator: TrackValidator,
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async createTrack(name: string, type: 'audio' | 'instrument' | 'bus'): Promise<TrackId> {
    const trackType = TrackType.fromString(type);
    const validationResult = this.validator.validateCreateTrack(name, trackType);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new CreateTrackCommand(name, trackType);
      return await this.mediator.createTrack(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to create track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async renameTrack(trackId: TrackId, newName: string): Promise<void> {
    const validationResult = this.validator.validateRenameTrack(trackId, newName);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new RenameTrackCommand(trackId, newName);
      await this.mediator.renameTrack(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to rename track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async addClipToTrack(trackId: TrackId, clipId: ClipId): Promise<void> {
    const validationResult = this.validator.validateAddClipToTrack(trackId, clipId.toString());
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new AddClipToTrackCommand(trackId, clipId);
      await this.mediator.addClipToTrack(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to add clip to track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async removeClipFromTrack(trackId: TrackId, clipId: ClipId): Promise<void> {
    const validationResult = this.validator.validateRemoveClipFromTrack(trackId, clipId.toString());
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new RemoveClipFromTrackCommand(trackId, clipId);
      await this.mediator.removeClipFromTrack(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to remove clip from track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async setTrackRouting(trackId: TrackId, routing: TrackRouting): Promise<void> {
    const validationResult = this.validator.validateChangeTrackRouting(trackId, routing);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new ChangeTrackRoutingCommand(trackId, routing);
      await this.mediator.changeTrackRouting(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to set track routing', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async addPluginToTrack(trackId: TrackId, pluginRef: IPluginReference): Promise<void> {
    const validationResult = this.validator.validateAddPluginToTrack(trackId, pluginRef.toString());
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new AddPluginToTrackCommand(trackId, pluginRef);
      await this.mediator.addPluginToTrack(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to add plugin to track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async removePluginFromTrack(trackId: TrackId, pluginRef: IPluginReference): Promise<void> {
    const validationResult = this.validator.validateRemovePluginFromTrack(trackId, pluginRef.toString());
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new RemovePluginFromTrackCommand(trackId, pluginRef);
      await this.mediator.removePluginFromTrack(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to remove plugin from track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async addInputTrackToBus(busTrackId: TrackId, inputTrackId: TrackId): Promise<void> {
    const validationResult = this.validator.validateAddInputTrackToBus(busTrackId, inputTrackId);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new AddInputTrackToBusCommand(busTrackId, inputTrackId);
      await this.mediator.addInputTrackToBus(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to add input track to bus', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async removeInputTrackFromBus(busTrackId: TrackId, inputTrackId: TrackId): Promise<void> {
    const validationResult = this.validator.validateRemoveInputTrackFromBus(busTrackId, inputTrackId);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new RemoveInputTrackFromBusCommand(busTrackId, inputTrackId);
      await this.mediator.removeInputTrackFromBus(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to remove input track from bus', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateTrackVolume(trackId: TrackId, volume: number): Promise<void> {
    const track = await this.repository.findById(trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }

    track.setVolume(volume);
    await this.repository.save(track);
    await this.eventBus.publish(new TrackUpdatedEvent(trackId, track));
  }

  async toggleMute(trackId: TrackId): Promise<void> {
    const track = await this.repository.findById(trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }

    track.setMute(!track.isMuted());
    await this.repository.save(track);
    await this.eventBus.publish(new TrackUpdatedEvent(trackId, track));
  }
} 
