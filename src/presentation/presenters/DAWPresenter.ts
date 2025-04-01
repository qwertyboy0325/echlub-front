import { injectable, inject } from 'inversify';
import { TYPES } from '../../core/di/types';
import { UIEventBus } from '../../core/events/UIEventBus';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { ClipViewModel } from '../models/ClipViewModel';
import { UIEventPayload, DomainEventPayload } from '../../core/events/types';

@injectable()
export class DAWPresenter {
  private clips: Map<string, ClipViewModel> = new Map();

  constructor(
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    // 監聽領域事件
    this.domainEventBus.on('domain:clip:added', this.handleClipAdded.bind(this));
    this.domainEventBus.on('domain:clip:moved', this.handleClipMoved.bind(this));
    this.domainEventBus.on('domain:clip:deleted', this.handleClipDeleted.bind(this));
  }

  // 公共方法 - UI 操作
  public addClip(audioUrl: string, position: number, duration: number, trackId: string): void {
    this.uiEventBus.emit('ui:clip:add', {
      audioUrl,
      position,
      duration,
      trackId
    });
  }

  public moveClip(clipId: string, newPosition: number, trackId: string): void {
    this.uiEventBus.emit('ui:clip:move', {
      clipId,
      newPosition,
      trackId
    });
  }

  public deleteClip(clipId: string): void {
    this.uiEventBus.emit('ui:clip:delete', {
      clipId
    });
  }

  // 領域事件處理器
  private handleClipAdded(payload: DomainEventPayload['domain:clip:added']): void {
    const { clip } = payload;
    this.clips.set(clip.id, clip);
    this.updateView();
  }

  private handleClipMoved(payload: DomainEventPayload['domain:clip:moved']): void {
    const { clipId, newStartTime, trackId } = payload;
    const clip = this.clips.get(clipId);
    if (clip) {
      clip.startTime = newStartTime;
      clip.position = newStartTime;
      clip.trackId = trackId;
      this.updateView();
    }
  }

  private handleClipDeleted(payload: DomainEventPayload['domain:clip:deleted']): void {
    const { clipId } = payload;
    this.clips.delete(clipId);
    this.updateView();
  }

  // 視圖更新
  private updateView(): void {
    // 這裡將添加視圖更新邏輯
    console.debug('[DAWPresenter] Clips updated:', Array.from(this.clips.values()));
  }

  // 獲取當前狀態
  public getClips(): ClipViewModel[] {
    return Array.from(this.clips.values());
  }

  public getClipById(id: string): ClipViewModel | undefined {
    return this.clips.get(id);
  }

  public dispose(): void {
    // 清理事件監聽器
    this.domainEventBus.removeAllListeners();
  }
} 