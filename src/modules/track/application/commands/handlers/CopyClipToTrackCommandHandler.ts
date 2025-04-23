import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { CopyClipToTrackCommand } from '../CopyClipToTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { ClipCreatedEvent } from '../../../domain/events/ClipCreatedEvent';
import { ClipAddedToTrackEvent } from '../../../domain/events/ClipAddedToTrackEvent';
import { ClipDomainService } from '../../../domain/services/ClipDomainService';
import { BaseClip } from '../../../domain/entities/clips/BaseClip';
import { BaseTrack } from '../../../domain/entities/BaseTrack';
import { ClipId } from '../../../domain/value-objects/clips/ClipId';
import { AudioClip } from '../../../domain/entities/clips/AudioClip';
import { MidiClip } from '../../../domain/entities/clips/MidiClip';

@injectable()
export class CopyClipToTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private trackRepository: ITrackRepository,
    @inject(TrackTypes.ClipRepository) private clipRepository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus,
    @inject('ClipOperationService') private clipOperationService: ClipDomainService
  ) {}

  async handle(command: CopyClipToTrackCommand): Promise<void> {
    // 獲取所需實體
    const [sourceClip, targetTrack] = await this.getEntities(command);

    // 驗證類型相容性
    this.clipOperationService.validateClipTrackCompatibility(sourceClip, targetTrack);

    // 創建新片段
    const newClipId = ClipId.create();
    const clonedClip = this.clipOperationService.createClipClone(sourceClip);

    // 設置新的開始時間
    this.clipOperationService.updateClipStartTime(clonedClip, command.startTime);

    // 執行複製操作
    await this.copyClip(clonedClip, targetTrack, newClipId, command);
  }

  private async getEntities(command: CopyClipToTrackCommand): Promise<[BaseClip, BaseTrack]> {
    const sourceClip = await this.clipRepository.findById(command.sourceClipId);
    if (!sourceClip) {
      throw new Error(`Source clip with id ${command.sourceClipId} not found`);
    }

    const targetTrack = await this.trackRepository.findById(command.targetTrackId);
    if (!targetTrack) {
      throw new Error(`Target track with id ${command.targetTrackId} not found`);
    }

    return [sourceClip, targetTrack];
  }

  private async copyClip(
    clonedClip: BaseClip,
    targetTrack: BaseTrack,
    newClipId: ClipId,
    command: CopyClipToTrackCommand
  ): Promise<void> {
    // 保存新片段
    await this.clipRepository.save(clonedClip);

    // 添加到目標軌道
    this.clipOperationService.addClipToTrack(targetTrack, newClipId);
    await this.trackRepository.save(targetTrack);

    // 發布事件
    const clipType = this.clipOperationService.getClipType(clonedClip);
    if (clipType === 'audio') {
      await this.eventBus.publish(new ClipCreatedEvent(newClipId, clonedClip as AudioClip, clipType));
    } else {
      await this.eventBus.publish(new ClipCreatedEvent(newClipId, clonedClip as MidiClip, clipType));
    }
    await this.eventBus.publish(new ClipAddedToTrackEvent(command.targetTrackId, newClipId));
  }
} 