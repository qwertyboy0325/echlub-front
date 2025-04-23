import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { MoveClipToTrackCommand } from '../MoveClipToTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { ClipRemovedFromTrackEvent } from '../../../domain/events/ClipRemovedFromTrackEvent';
import { ClipAddedToTrackEvent } from '../../../domain/events/ClipAddedToTrackEvent';
import { ClipDomainService } from '../../../domain/services/ClipDomainService';
import { BaseClip } from '../../../domain/entities/clips/BaseClip';
import { BaseTrack } from '../../../domain/entities/BaseTrack';

@injectable()
export class MoveClipToTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private trackRepository: ITrackRepository,
    @inject(TrackTypes.ClipRepository) private clipRepository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus,
    @inject('ClipOperationService') private clipOperationService: ClipDomainService
  ) {}

  async handle(command: MoveClipToTrackCommand): Promise<void> {
    // 獲取所需實體
    const [clip, sourceTrack, targetTrack] = await this.getEntities(command);

    // 驗證類型相容性
    this.clipOperationService.validateClipTrackCompatibility(clip, targetTrack);

    // 更新片段時間
    this.clipOperationService.updateClipStartTime(clip, command.startTime);

    // 執行移動操作
    await this.moveClip(clip, sourceTrack, targetTrack, command);

    // 保存片段更新
    await this.clipRepository.save(clip);
  }

  private async getEntities(command: MoveClipToTrackCommand): Promise<[BaseClip, BaseTrack, BaseTrack]> {
    const clip = await this.clipRepository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Clip with id ${command.clipId} not found`);
    }

    const sourceTrack = await this.trackRepository.findById(command.sourceTrackId);
    if (!sourceTrack) {
      throw new Error(`Source track with id ${command.sourceTrackId} not found`);
    }

    const targetTrack = await this.trackRepository.findById(command.targetTrackId);
    if (!targetTrack) {
      throw new Error(`Target track with id ${command.targetTrackId} not found`);
    }

    return [clip, sourceTrack, targetTrack];
  }

  private async moveClip(
    clip: BaseClip,
    sourceTrack: BaseTrack,
    targetTrack: BaseTrack,
    command: MoveClipToTrackCommand
  ): Promise<void> {
    // 從源軌道移除
    this.clipOperationService.removeClipFromTrack(sourceTrack, command.clipId);
    await this.trackRepository.save(sourceTrack);
    await this.eventBus.publish(new ClipRemovedFromTrackEvent(
      command.sourceTrackId,
      command.clipId,
      this.clipOperationService.getClipType(clip)
    ));

    // 添加到目標軌道
    this.clipOperationService.addClipToTrack(targetTrack, command.clipId);
    await this.trackRepository.save(targetTrack);
    await this.eventBus.publish(new ClipAddedToTrackEvent(command.targetTrackId, command.clipId));
  }
} 