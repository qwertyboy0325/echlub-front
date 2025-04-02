import { injectable, inject } from 'inversify';
import { TYPES } from '../../core/di/types';
import { UIEventBus } from '../../core/events/UIEventBus';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { TrackRepository } from '../../domain/repositories/TrackRepository';
import { BasePresenter } from './BasePresenter';
import { TrackViewModel, TrackViewModelFactory } from '../models/TrackViewModel';

@injectable()
export class TrackPresenter extends BasePresenter {
  private tracks: Map<string, TrackViewModel> = new Map();

  constructor(
    @inject(TYPES.UIEventBus) protected uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) protected domainEventBus: DomainEventBus,
    @inject(TYPES.TrackRepository) private trackRepository: TrackRepository
  ) {
    super(uiEventBus, domainEventBus);
  }

  // 公共初始化方法
  public async initializePresenter(): Promise<void> {
    console.log('[TrackPresenter] Starting initialization');
    await this.initialize();
    console.log('[TrackPresenter] Initialization completed');
  }

  // 公共銷毀方法
  public disposePresenter(): void {
    console.log('[TrackPresenter] Starting disposal');
    this.dispose();
    console.log('[TrackPresenter] Disposal completed');
  }

  protected initialize(): void {
    console.log('[TrackPresenter] Initializing and registering event handlers');
    
    // 監聽 UI 事件
    this.uiEventBus.on('ui:track:create', () => {
      console.log('[TrackPresenter] Handling ui:track:create event');
      this.handleCreateTrack();
    });

    // 監聽 Domain 事件
    this.domainEventBus.on('domain:track:created', (payload) => {
      console.log('[TrackPresenter] Handling domain:track:created event', payload);
      this.handleTrackCreated(payload);
    });
  }

  private handleCreateTrack(): void {
    console.log('[TrackPresenter] Creating new track');
    this.trackRepository.create();
  }

  private handleTrackCreated(payload: any): void {
    console.log('[TrackPresenter] Track created, updating UI', payload);
    this.uiEventBus.emit('ui:track:added', payload);
  }

  protected dispose(): void {
    // 清理事件監聽器
    this.uiEventBus.removeAllListeners('ui:track:create');
    this.domainEventBus.removeAllListeners('domain:track:created');
  }

  private handleDeleteTrack = (trackId: string) => {
    this.trackRepository.delete(trackId);
    this.domainEventBus.emit('domain:track:deleted', { trackId });
  };

  private handleVolumeChange = (payload: { trackId: string; volume: number }) => {
    const track = this.trackRepository.findById(payload.trackId);
    if (track) {
      track.setVolume(payload.volume);
      this.domainEventBus.emit('domain:track:updated', { track });
    }
  };

  private handlePanChange = (payload: { trackId: string; pan: number }) => {
    const track = this.trackRepository.findById(payload.trackId);
    if (track) {
      track.setPan(payload.pan);
      this.domainEventBus.emit('domain:track:updated', { track });
    }
  };

  private handleMuteToggle = (trackId: string) => {
    const track = this.trackRepository.findById(trackId);
    if (track) {
      track.toggleMute();
      this.domainEventBus.emit('domain:track:updated', { track });
    }
  };

  private handleSoloToggle = (trackId: string) => {
    const track = this.trackRepository.findById(trackId);
    if (track) {
      track.toggleSolo();
      this.domainEventBus.emit('domain:track:updated', { track });
    }
  };

  private handleTrackDeleted = (payload: { trackId: string }) => {
    this.tracks.delete(payload.trackId);
    this.notifyTrackListeners();
  };

  private handleTrackUpdated = (payload: { track: any }) => {
    const viewModel = TrackViewModelFactory.fromDomain(payload.track);
    this.tracks.set(viewModel.id, viewModel);
    this.notifyTrackListeners();
  };

  // 公共方法
  public getTracks(): TrackViewModel[] {
    return Array.from(this.tracks.values());
  }

  public getTrackById(id: string): TrackViewModel | undefined {
    return this.tracks.get(id);
  }

  // 監聽器管理
  private trackListeners: Set<(tracks: TrackViewModel[]) => void> = new Set();

  public addTrackListener(listener: (tracks: TrackViewModel[]) => void): () => void {
    this.trackListeners.add(listener);
    listener(this.getTracks());
    return () => this.trackListeners.delete(listener);
  }

  private notifyTrackListeners(): void {
    const tracks = this.getTracks();
    this.trackListeners.forEach(listener => listener(tracks));
  }
} 