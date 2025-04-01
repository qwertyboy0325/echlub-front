import * as PIXI from 'pixi.js';
import { ClipViewModel } from '../models/ClipViewModel';
import { RenderEngine } from './RenderEngine';

export interface DAWSceneConfig {
  width: number;
  height: number;
  trackCount: number;
  pixelsPerSecond: number;
}

export class DAWScene {
  private container: PIXI.Container;
  private clipContainers: Map<string, PIXI.Container> = new Map();
  private config: DAWSceneConfig;

  constructor(engine: RenderEngine, config: DAWSceneConfig) {
    this.container = new PIXI.Container();
    this.config = config;
    engine.getStage().addChild(this.container);
    this.initializeScene();
  }

  private initializeScene(): void {
    // 初始化背景和網格
    this.drawBackground();
    this.drawGrid();
  }

  private drawBackground(): void {
    // 繪製背景
    const background = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x1e1e1e);
    graphics.drawRect(0, 0, this.config.width, this.config.height);
    graphics.endFill();
    background.addChild(graphics);
    this.container.addChild(background);
  }

  private drawGrid(): void {
    // 繪製網格
    const grid = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, 0x333333);

    // 垂直線（時間標記）
    for (let x = 0; x <= this.config.width; x += this.config.pixelsPerSecond) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.config.height);
    }

    // 水平線（軌道分隔線）
    const trackHeight = this.config.height / this.config.trackCount;
    for (let y = 0; y <= this.config.height; y += trackHeight) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.config.width, y);
    }

    grid.addChild(graphics);
    this.container.addChild(grid);
  }

  public updateClips(clips: ClipViewModel[]): void {
    // 清理不存在的片段
    const currentClipIds = new Set(clips.map(clip => clip.id));
    for (const [id, container] of this.clipContainers) {
      if (!currentClipIds.has(id)) {
        container.destroy();
        this.clipContainers.delete(id);
      }
    }

    // 更新或創建片段
    for (const clip of clips) {
      this.updateClip(clip);
    }
  }

  public updateClip(clip: ClipViewModel): void {
    let clipContainer = this.clipContainers.get(clip.id);
    if (!clipContainer) {
      clipContainer = this.createClipContainer(clip);
      this.clipContainers.set(clip.id, clipContainer);
      this.container.addChild(clipContainer);
    }

    // 更新位置和大小
    clipContainer.x = clip.position * this.config.pixelsPerSecond;
    clipContainer.y = parseInt(clip.trackId) * (this.config.height / this.config.trackCount);
    
    // 更新視覺狀態
    const background = clipContainer.getChildByName('background') as PIXI.Graphics;
    if (background) {
      background.clear();
      background.beginFill(clip.muted ? 0x666666 : parseInt(clip.color.replace('#', '0x')));
      background.drawRoundedRect(
        0, 0,
        clip.duration * this.config.pixelsPerSecond,
        this.config.height / this.config.trackCount - 10,
        4
      );
      background.endFill();
    }

    const label = clipContainer.getChildByName('label') as PIXI.Text;
    if (label) {
      label.text = clip.name;
    }
  }

  private createClipContainer(clip: ClipViewModel): PIXI.Container {
    const container = new PIXI.Container();
    container.name = clip.id;

    // 創建背景
    const background = new PIXI.Graphics();
    background.name = 'background';
    container.addChild(background);

    // 創建標籤
    const label = new PIXI.Text(clip.name, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      align: 'center'
    });
    label.name = 'label';
    label.x = 5;
    label.y = 5;
    container.addChild(label);

    return container;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    // 重新繪製場景
    this.container.removeChildren();
    this.initializeScene();
    
    // 重新添加所有片段
    for (const container of this.clipContainers.values()) {
      this.container.addChild(container);
    }
  }

  public dispose(): void {
    this.container.destroy({ children: true });
    this.clipContainers.clear();
  }
} 