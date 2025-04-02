import { injectable, inject } from 'inversify';
import * as PIXI from 'pixi.js';
import { TYPES } from '../../../core/di/types';
import { StateManager } from '../../../core/state/StateManager';
import { UIEventBus } from '../../../core/events/UIEventBus';
import { PerformanceMonitor } from '../../../core/monitoring/PerformanceMonitor';
import { Track } from '../../../domain/entities/Track';
import { Clip } from '../../../domain/entities/Clip';

interface TrackAreaConfig {
  width: number;
  height: number;
}

@injectable()
export class TrackArea extends PIXI.Container {
  private config: TrackAreaConfig;
  private background: PIXI.Graphics;
  private tracksContainer: PIXI.Container;
  private readonly TRACK_HEIGHT = 100;
  private readonly TRACK_GAP = 2;
  private tracks: Track[] = [];

  constructor(
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.PerformanceMonitor) private performanceMonitor: PerformanceMonitor,
    config: TrackAreaConfig
  ) {
    super();
    this.config = config;

    // 創建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    // 創建軌道容器
    this.tracksContainer = new PIXI.Container();
    this.addChild(this.tracksContainer);

    this.setupEventListeners();
    this.setupStateSubscription();
    this.draw();
  }

  private setupEventListeners(): void {
    // 監聽 UI 事件
    this.uiEventBus.on('ui:track:create', () => {
      this.performanceMonitor.recordEventLatency('track:create', performance.now());
    });

    this.uiEventBus.on('ui:track:delete', (payload) => {
      this.performanceMonitor.recordEventLatency('track:delete', performance.now());
    });

    this.uiEventBus.on('ui:clip:add', (payload) => {
      this.performanceMonitor.recordEventLatency('clip:add', performance.now());
    });

    this.uiEventBus.on('ui:clip:delete', (payload) => {
      this.performanceMonitor.recordEventLatency('clip:delete', performance.now());
    });
  }

  private setupStateSubscription(): void {
    this.stateManager.subscribe(state => {
      this.tracks = state.tracks;
      this.draw();
    });
  }

  private draw(): void {
    const startTime = performance.now();
    
    this.drawBackground();
    this.drawTracks();
    
    this.performanceMonitor.recordEventLatency('trackArea:draw', performance.now() - startTime);
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.beginFill(0x1a1a1a);
    this.background.drawRect(0, 0, this.config.width, this.config.height);
    this.background.endFill();
  }

  private drawTracks(): void {
    this.tracksContainer.removeChildren();

    this.tracks.forEach((track, index) => {
      const trackContainer = new PIXI.Container();
      
      // 繪製軌道背景
      const background = new PIXI.Graphics();
      background.beginFill(0x2a2a2a);
      background.drawRect(0, 0, this.config.width, this.TRACK_HEIGHT);
      background.endFill();
      trackContainer.addChild(background);

      // 添加軌道名稱
      const trackName = new PIXI.Text(track.name, {
        fontSize: 12,
        fill: 0xcccccc,
        fontFamily: 'Arial'
      });
      trackName.position.set(10, 10);
      trackContainer.addChild(trackName);

      // 繪製片段
      track.clips.forEach(clip => {
        const clipGraphics = new PIXI.Graphics();
        clipGraphics.beginFill(clip.color || 0x4a4a4a);
        clipGraphics.drawRect(
          clip.startTime * 100, // 假設 100 像素/秒
          20, // 從軌道頂部留出一些空間
          clip.duration * 100,
          this.TRACK_HEIGHT - 40
        );
        clipGraphics.endFill();

        // 添加互動性
        clipGraphics.interactive = true;
        (clipGraphics as any).buttonMode = true; // 使用類型斷言
        clipGraphics.on('pointerdown', () => this.handleClipClick(track.id, clip.id));
        clipGraphics.on('pointermove', (event) => this.handleClipDrag(track.id, clip.id, event));

        trackContainer.addChild(clipGraphics);
      });

      // 設置軌道位置
      trackContainer.position.set(0, index * (this.TRACK_HEIGHT + this.TRACK_GAP));
      this.tracksContainer.addChild(trackContainer);
    });
  }

  private handleClipClick(trackId: string, clipId: string): void {
    this.uiEventBus.emit('ui:clip:select', { trackId, clipId });
  }

  private handleClipDrag(trackId: string, clipId: string, event: PIXI.FederatedPointerEvent): void {
    const newPosition = event.global.x / 100; // 轉換為時間
    this.uiEventBus.emit('ui:clip:position:change', { trackId, clipId, position: newPosition });
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.draw();
  }

  public getTrackHeight(): number {
    return this.TRACK_HEIGHT;
  }

  public getTrackGap(): number {
    return this.TRACK_GAP;
  }

  public destroy(): void {
    // 清理事件監聽器
    this.uiEventBus.off('ui:track:create', () => {});
    this.uiEventBus.off('ui:track:delete', () => {});
    this.uiEventBus.off('ui:clip:add', () => {});
    this.uiEventBus.off('ui:clip:delete', () => {});
    
    super.destroy();
  }
} 