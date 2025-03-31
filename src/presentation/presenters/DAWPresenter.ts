import { injectable, inject } from 'inversify';
import { TYPES } from '../../core/di/types';
import { DAWManager } from '../../core/DAWManager';
import { ClipViewModel } from '../models/ClipViewModel';
import { EventEmitter } from '../../core/events/EventEmitter';

export interface DAWPresenterEvents {
  onClipAdded: (clip: ClipViewModel) => void;
  onClipRemoved: (clipId: string) => void;
  onClipUpdated: (clip: ClipViewModel) => void;
  onPlayheadMoved: (position: number) => void;
  onPlaybackStateChanged: (isPlaying: boolean) => void;
}

@injectable()
export class DAWPresenter extends EventEmitter {
  constructor(
    @inject(TYPES.DAWManager) private dawManager: DAWManager
  ) {
    super();
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // 監聽來自 Domain Layer 的事件
    this.dawManager.on('onAddClip', (clip: any) => {
      const viewModel = ClipViewModel.fromDomain(clip);
      this.emit('onClipAdded', viewModel);
    });

    this.dawManager.on('onRemoveClip', (clipId: string) => {
      this.emit('onClipRemoved', clipId);
    });

    this.dawManager.on('onUpdateClip', (clip: any) => {
      const viewModel = ClipViewModel.fromDomain(clip);
      this.emit('onClipUpdated', viewModel);
    });

    this.dawManager.on('onPlayheadMove', (position: number) => {
      this.emit('onPlayheadMoved', position);
    });

    this.dawManager.on('onPlaybackStateChange', (isPlaying: boolean) => {
      this.emit('onPlaybackStateChanged', isPlaying);
    });
  }

  // Presentation Layer 的操作方法
  public addClip(clip: ClipViewModel): void {
    this.dawManager.addClip(clip.toDomain());
  }

  public removeClip(clipId: string): void {
    this.dawManager.removeClip(clipId);
  }

  public updateClip(clip: ClipViewModel): void {
    this.dawManager.updateClip(clip.toDomain());
  }

  public movePlayhead(position: number): void {
    this.dawManager.movePlayhead(position);
  }

  public togglePlayback(): void {
    this.dawManager.togglePlayback();
  }

  public dispose(): void {
    this.removeAllListeners();
    // 清理其他資源...
  }
} 