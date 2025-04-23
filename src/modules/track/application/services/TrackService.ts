import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { TrackId } from '../../domain/value-objects/track/TrackId';
import { TrackRouting } from '../../domain/value-objects/track/TrackRouting';
import { ClipId } from '../../domain/value-objects/clips/ClipId';
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
import { AddNoteToClipCommand } from '../commands/AddNoteToClipCommand';
import { UpdateNoteInClipCommand } from '../commands/UpdateNoteInClipCommand';
import { RemoveNoteFromClipCommand } from '../commands/RemoveNoteFromClipCommand';
import { TrackType } from '../../domain/value-objects/track/TrackType';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackUpdatedEvent } from '../../domain/events/TrackUpdatedEvent';
import { MidiNote } from '../../domain/value-objects/note/MidiNote';
import { GetTrackByIdQuery } from '../queries/GetTrackByIdQuery';
import { GetTrackPluginsQuery } from '../queries/GetTrackPluginsQuery';
import { GetTrackRoutingQuery } from '../queries/GetTrackRoutingQuery';
import { GetTrackGainQuery } from '../queries/GetTrackGainQuery';
import { GetTrackNameQuery } from '../queries/GetTrackNameQuery';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackEventDecorator } from '../../domain/decorators/TrackEventDecorator';

@injectable()
export class TrackService {
  private static readonly MAX_VOLUME = 1;
  private static readonly MIN_VOLUME = 0;

  constructor(
    @inject(TrackTypes.TrackMediator) private mediator: TrackMediator,
    @inject(TrackTypes.TrackValidator) private validator: TrackValidator,
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  /**
   * 創建新的軌道
   * @param name 軌道名稱
   * @param type 軌道類型（'audio' | 'instrument' | 'bus'）
   * @returns 新創建的軌道 ID
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當創建操作失敗時
   */
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

  /**
   * 重命名軌道
   * @param trackId 軌道 ID
   * @param newName 新的軌道名稱
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當重命名操作失敗時
   */
  async renameTrack(trackId: TrackId, newName: string): Promise<void> {
    const validationResult = this.validator.validateRenameTrack(trackId, newName);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const track = await this.repository.findById(trackId);
      if (!track) {
        throw new TrackOperationError('Track not found');
      }

      const trackWithEvents = new TrackEventDecorator(track, this.eventBus);
      await trackWithEvents.rename(newName);
      await this.repository.save(track);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to rename track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 添加片段到軌道
   * @param trackId 軌道 ID
   * @param clipId 片段 ID
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當添加操作失敗時
   */
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

  /**
   * 從軌道移除片段
   * @param trackId 軌道 ID
   * @param clipId 片段 ID
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當移除操作失敗時
   */
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

  /**
   * 設置軌道路由
   * @param trackId 軌道 ID
   * @param routing 路由設置
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當設置操作失敗時
   */
  async setTrackRouting(trackId: TrackId, routing: TrackRouting): Promise<void> {
    const validationResult = this.validator.validateChangeTrackRouting(trackId, routing);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const track = await this.repository.findById(trackId);
      if (!track) {
        throw new TrackOperationError('Track not found');
      }

      const trackWithEvents = new TrackEventDecorator(track, this.eventBus);
      await trackWithEvents.setRouting(routing);
      await this.repository.save(track);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to set track routing', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 添加插件到軌道
   * @param trackId 軌道 ID
   * @param pluginRef 插件引用
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當添加操作失敗時
   */
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

  /**
   * 從軌道移除插件
   * @param trackId 軌道 ID
   * @param pluginRef 插件引用
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當移除操作失敗時
   */
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

  /**
   * 添加輸入軌道到匯流排
   * @param busTrackId 匯流排軌道 ID
   * @param inputTrackId 輸入軌道 ID
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當添加操作失敗時
   */
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

  /**
   * 從匯流排移除輸入軌道
   * @param busTrackId 匯流排軌道 ID
   * @param inputTrackId 輸入軌道 ID
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當移除操作失敗時
   */
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

  /**
   * 更新軌道音量
   * @param trackId 軌道 ID
   * @param volume 音量值（0-1）
   * @throws {TrackOperationError} 當軌道不存在或操作失敗時
   */
  async updateTrackVolume(trackId: TrackId, volume: number): Promise<void> {
    if (volume < TrackService.MIN_VOLUME || volume > TrackService.MAX_VOLUME) {
      throw new TrackValidationError([`Volume must be between ${TrackService.MIN_VOLUME} and ${TrackService.MAX_VOLUME}`]);
    }

    try {
      const track = await this.repository.findById(trackId);
      if (!track) {
        throw new TrackOperationError('Track not found');
      }

      const trackWithEvents = new TrackEventDecorator(track, this.eventBus);
      await trackWithEvents.setVolume(volume);
      await this.repository.save(track);
    } catch (error) {
      if (error instanceof TrackOperationError || error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError(
        'Failed to update track volume',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 切換軌道靜音狀態
   * @param trackId 軌道 ID
   * @throws {TrackOperationError} 當軌道不存在或操作失敗時
   */
  async toggleMute(trackId: TrackId): Promise<void> {
    try {
      const track = await this.repository.findById(trackId);
      if (!track) {
        throw new TrackOperationError('Track not found');
      }

      const trackWithEvents = new TrackEventDecorator(track, this.eventBus);
      await trackWithEvents.setMuted(!track.isMuted());
      await this.repository.save(track);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError(
        'Failed to toggle track mute state',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 添加音符到 MIDI 片段
   * @param clipId MIDI 片段 ID
   * @param note 音符數據
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當添加操作失敗時
   */
  async addNoteToClip(clipId: ClipId, note: MidiNote): Promise<void> {
    const validationResult = this.validator.validateAddNoteToClip(clipId, note);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new AddNoteToClipCommand(clipId, note);
      await this.mediator.addNoteToClip(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to add note to clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 更新 MIDI 片段中的音符
   * @param clipId MIDI 片段 ID
   * @param noteIndex 音符索引
   * @param note 更新後的音符數據
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當更新操作失敗時
   */
  async updateNoteInClip(clipId: ClipId, noteIndex: number, note: MidiNote): Promise<void> {
    const validationResult = this.validator.validateUpdateNoteInClip(clipId, noteIndex, note);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new UpdateNoteInClipCommand(clipId, noteIndex, note);
      await this.mediator.updateNoteInClip(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to update note in clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 從 MIDI 片段移除音符
   * @param clipId MIDI 片段 ID
   * @param noteIndex 音符索引
   * @throws {TrackValidationError} 當驗證失敗時
   * @throws {TrackOperationError} 當移除操作失敗時
   */
  async removeNoteFromClip(clipId: ClipId, noteIndex: number): Promise<void> {
    const validationResult = this.validator.validateRemoveNoteFromClip(clipId, noteIndex);
    if (!validationResult.isValid) {
      throw new TrackValidationError(validationResult.errors);
    }

    try {
      const command = new RemoveNoteFromClipCommand(clipId, noteIndex);
      await this.mediator.removeNoteFromClip(command);
    } catch (error) {
      if (error instanceof TrackValidationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to remove note from clip', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 獲取軌道實體
   * @param trackId 軌道 ID
   * @returns 軌道實體
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async getTrackById(trackId: TrackId): Promise<BaseTrack> {
    try {
      const query = new GetTrackByIdQuery(trackId);
      return await this.mediator.getTrackById(query);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to get track', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 獲取軌道插件列表
   * @param trackId 軌道 ID
   * @returns 插件引用列表
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async getTrackPlugins(trackId: TrackId): Promise<IPluginReference[]> {
    try {
      const query = new GetTrackPluginsQuery(trackId);
      return await this.mediator.getTrackPlugins(query);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to get track plugins', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 獲取軌道路由設置
   * @param trackId 軌道 ID
   * @returns 軌道路由設置
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async getTrackRouting(trackId: TrackId): Promise<TrackRouting> {
    try {
      const query = new GetTrackRoutingQuery(trackId);
      return await this.mediator.getTrackRouting(query);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to get track routing', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 獲取軌道音量
   * @param trackId 軌道 ID
   * @returns 軌道音量值
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async getTrackGain(trackId: TrackId): Promise<number> {
    try {
      const query = new GetTrackGainQuery(trackId);
      return await this.mediator.getTrackGain(query);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to get track gain', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 獲取軌道名稱
   * @param trackId 軌道 ID
   * @returns 軌道名稱
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async getTrackName(trackId: TrackId): Promise<string> {
    try {
      const query = new GetTrackNameQuery(trackId);
      return await this.mediator.getTrackName(query);
    } catch (error) {
      if (error instanceof TrackOperationError) {
        throw error;
      }
      throw new TrackOperationError('Failed to get track name', error instanceof Error ? error : new Error(String(error)));
    }
  }
} 