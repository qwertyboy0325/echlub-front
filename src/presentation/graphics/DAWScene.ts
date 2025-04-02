import * as PIXI from 'pixi.js';
import { injectable, inject, optional } from 'inversify';
import { TYPES } from '../../core/types';
import { RenderEngine } from './RenderEngine';
import { ClipViewModel } from '../models/ClipViewModel';
import { TrackViewModel } from '../models/TrackViewModel';

export interface DAWSceneConfig {
  width: number;
  height: number;
  trackHeight: number;
  pixelsPerSecond: number;
}

@injectable()
export class DAWScene extends PIXI.Container {
  private tracks: Map<string, PIXI.Container> = new Map();
  private clips: Map<string, PIXI.Container> = new Map();
  private config: DAWSceneConfig;
  private gridGraphics: PIXI.Graphics;
  private timelineGraphics: PIXI.Graphics;
  private trackHeadersContainer: PIXI.Container;
  private tracksContainer: PIXI.Container;

  constructor(
    config: DAWSceneConfig,
    @inject(TYPES.RenderEngine) @optional() private renderEngine?: RenderEngine
  ) {
    super();
    
    this.config = config;

    // 創建軌道標題容器
    this.trackHeadersContainer = new PIXI.Container();
    this.addChild(this.trackHeadersContainer);
    this.trackHeadersContainer.position.set(0, 30); // 留出時間軸的空間

    // 創建軌道內容容器
    this.tracksContainer = new PIXI.Container();
    this.addChild(this.tracksContainer);
    this.tracksContainer.position.set(150, 30); // 留出軌道標題的空間

    // 創建網格
    this.gridGraphics = new PIXI.Graphics();
    this.tracksContainer.addChild(this.gridGraphics);

    // 創建時間軸
    this.timelineGraphics = new PIXI.Graphics();
    this.addChild(this.timelineGraphics);
    
    // 繪製初始網格和時間軸
    this.drawGrid();
    this.drawTimeline();

    // 如果有 RenderEngine，則添加到舞台
    if (this.renderEngine) {
      const stage = this.renderEngine.getStage();
      if (stage) {
        stage.addChild(this);
      }
    }
  }

  private drawGrid(): void {
    const { width, height, pixelsPerSecond } = this.config;
    
    this.gridGraphics.clear();
    
    // 繪製背景
    this.gridGraphics.beginFill(0x1a1a1a);  // 更深的背景色
    this.gridGraphics.drawRect(0, 0, width, height);
    this.gridGraphics.endFill();

    // 繪製網格線
    // 垂直網格線（每秒一條）
    for (let x = 0; x <= width; x += pixelsPerSecond) {
      // 每4拍一條粗線
      if ((x / pixelsPerSecond) % 4 === 0) {
        this.gridGraphics.lineStyle(2, 0x666666, 1);  // 更粗更亮的主線
      } else {
        this.gridGraphics.lineStyle(1, 0x444444, 0.8);  // 更亮的次線
      }
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
      this.gridGraphics.stroke();
    }

    // 水平網格線（每個軌道一條）
    const trackCount = Math.floor(height / this.config.trackHeight);
    for (let i = 0; i <= trackCount; i++) {
      const y = i * this.config.trackHeight;
      this.gridGraphics.lineStyle(1, 0x555555, 1);  // 更亮的水平線
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
      this.gridGraphics.stroke();
    }

    // 繪製細分網格（每拍一條）
    this.gridGraphics.lineStyle(1, 0x333333, 0.5);  // 更明顯的細分線
    for (let x = 0; x <= width; x += pixelsPerSecond / 4) {
      if ((x / pixelsPerSecond * 4) % 4 !== 0) {  // 避免與主網格線重疊
        this.gridGraphics.moveTo(x, 0);
        this.gridGraphics.lineTo(x, height);
        this.gridGraphics.stroke();
      }
    }
  }

  private drawTimeline(): void {
    const { width, pixelsPerSecond } = this.config;
    
    this.timelineGraphics.clear();
    
    // 繪製時間軸背景
    this.timelineGraphics.beginFill(0x1a1a1a);  // 與網格背景一致
    this.timelineGraphics.drawRect(150, 0, width, 30);
    this.timelineGraphics.endFill();

    // 繪製時間標記
    this.timelineGraphics.lineStyle(1, 0x666666);  // 更亮的時間標記
    for (let x = 0; x <= width; x += pixelsPerSecond) {
      const seconds = x / pixelsPerSecond;
      const text = new PIXI.Text(seconds.toString(), {
        fontSize: 10,
        fill: 0xcccccc,  // 更亮的文字
        fontFamily: 'Arial'
      });
      text.position.set(x + 150, 8);
      this.timelineGraphics.addChild(text);

      // 刻度線
      this.timelineGraphics.moveTo(x + 150, 20);
      this.timelineGraphics.lineTo(x + 150, 30);
      this.timelineGraphics.stroke();
    }
  }

  updateTracks(tracks: TrackViewModel[]): void {
    // 清理不存在的軌道
    const currentTrackIds = new Set(tracks.map(t => t.id));
    for (const [trackId, trackContainer] of this.tracks) {
      if (!currentTrackIds.has(trackId)) {
        trackContainer.destroy();
        this.tracks.delete(trackId);
      }
    }

    // 更新或創建軌道
    tracks.forEach((track, index) => {
      // 更新軌道標題
      this.updateTrackHeader(track, index);

      // 更新軌道內容
      let trackContainer = this.tracks.get(track.id);
      if (!trackContainer) {
        trackContainer = new PIXI.Container();
        this.tracks.set(track.id, trackContainer);
        this.tracksContainer.addChild(trackContainer);
      }

      // 設置軌道位置
      trackContainer.y = index * this.config.trackHeight;
    });
  }

  private updateTrackHeader(track: TrackViewModel, index: number): void {
    const headerHeight = this.config.trackHeight;
    const y = index * headerHeight;

    // 創建或更新軌道標題背景
    const header = new PIXI.Graphics();
    header.beginFill(0x1a1a1a);  // 與網格背景一致
    header.drawRect(0, y, 150, headerHeight);
    header.endFill();

    // 添加軌道名稱
    const text = new PIXI.Text(track.name, {
      fontSize: 12,
      fill: 0xcccccc,  // 更亮的文字
      padding: 4,
      fontFamily: 'Arial'
    });
    text.position.set(8, y + (headerHeight - text.height) / 2);

    this.trackHeadersContainer.addChild(header);
    this.trackHeadersContainer.addChild(text);
  }

  addClip(clip: ClipViewModel): void {
    const trackContainer = this.tracks.get(clip.trackId);
    if (!trackContainer) return;

    // 創建片段容器
    const clipContainer = new PIXI.Container();
    
    // 創建背景
    const background = new PIXI.Graphics();
    background.beginFill(0x4a90e2, 0.8);
    background.drawRoundedRect(
      0, 2,
      clip.duration * this.config.pixelsPerSecond,
      this.config.trackHeight - 4,
      4
    );
    background.endFill();

    // 添加漸變效果
    background.beginFill(0xffffff, 0.1);
    background.drawRoundedRect(
      0, 2,
      clip.duration * this.config.pixelsPerSecond,
      this.config.trackHeight / 2 - 2,
      4
    );
    background.endFill();

    clipContainer.addChild(background);

    // 創建標題文本
    const text = new PIXI.Text(clip.name, {
      fontSize: 12,
      fill: 0xffffff,
      padding: 4
    });
    text.x = 8;
    text.y = (this.config.trackHeight - text.height) / 2;
    clipContainer.addChild(text);

    // 設置位置
    clipContainer.x = clip.startTime * this.config.pixelsPerSecond;
    
    // 添加到軌道
    trackContainer.addChild(clipContainer);
    this.clips.set(clip.id, clipContainer);

    // 設置交互
    clipContainer.eventMode = 'static';
    clipContainer.cursor = 'pointer';
  }

  updateClip(clip: ClipViewModel): void {
    const clipContainer = this.clips.get(clip.id);
    if (!clipContainer) return;

    clipContainer.x = clip.startTime * this.config.pixelsPerSecond;
    
    // 更新背景
    const background = clipContainer.getChildAt(0) as PIXI.Graphics;
    background.clear();
    background.beginFill(0x4a90e2, 0.8);
    background.drawRoundedRect(
      0, 2,
      clip.duration * this.config.pixelsPerSecond,
      this.config.trackHeight - 4,
      4
    );
    background.endFill();

    // 添加漸變效果
    background.beginFill(0xffffff, 0.1);
    background.drawRoundedRect(
      0, 2,
      clip.duration * this.config.pixelsPerSecond,
      this.config.trackHeight / 2 - 2,
      4
    );
    background.endFill();

    // 更新文本
    const text = clipContainer.getChildAt(1) as PIXI.Text;
    text.text = clip.name;
  }

  removeClip(clipId: string): void {
    const clipContainer = this.clips.get(clipId);
    if (clipContainer) {
      clipContainer.destroy();
      this.clips.delete(clipId);
    }
  }

  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.drawGrid();
    this.drawTimeline();
  }
} 