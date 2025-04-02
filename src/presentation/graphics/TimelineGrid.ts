import * as PIXI from 'pixi.js';

interface TimelineGridConfig {
  width: number;
  height: number;
  pixelsPerSecond: number;
}

export class TimelineGrid extends PIXI.Container {
  private config: TimelineGridConfig;
  private background: PIXI.Graphics;
  private gridLines: PIXI.Graphics;
  private trackAreaGrid: PIXI.Graphics;
  private timeMarkers: PIXI.Container;
  private trackAreaHeight: number = 0;

  constructor(config: TimelineGridConfig) {
    super();
    this.config = config;

    // 創建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    // 創建軌道區域網格
    this.trackAreaGrid = new PIXI.Graphics();
    this.addChild(this.trackAreaGrid);

    // 創建時間軸網格
    this.gridLines = new PIXI.Graphics();
    this.addChild(this.gridLines);

    // 創建時間標記
    this.timeMarkers = new PIXI.Container();
    this.addChild(this.timeMarkers);

    this.draw();
  }

  private draw(): void {
    this.drawBackground();
    this.drawGridLines();
    this.drawTrackAreaGrid();
    this.drawTimeMarkers();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.beginFill(0x2a2a2a);
    this.background.drawRect(0, 0, this.config.width, this.config.height);
    this.background.endFill();
  }

  private drawGridLines(): void {
    this.gridLines.clear();
    this.gridLines.lineStyle(1, 0x444444);

    // 繪製垂直線（每秒）
    for (let x = 0; x <= this.config.width; x += this.config.pixelsPerSecond) {
      this.gridLines.moveTo(x, 0);
      this.gridLines.lineTo(x, this.config.height);
    }

    // 繪製次要垂直線（每拍）
    this.gridLines.lineStyle(1, 0x333333, 0.5);
    for (let x = 0; x <= this.config.width; x += this.config.pixelsPerSecond / 4) {
      if (x % this.config.pixelsPerSecond !== 0) {
        this.gridLines.moveTo(x, 0);
        this.gridLines.lineTo(x, this.config.height);
      }
    }
  }

  private drawTrackAreaGrid(): void {
    this.trackAreaGrid.clear();
    if (this.trackAreaHeight <= 0) return;

    // 繪製主要垂直線（每秒）
    this.trackAreaGrid.lineStyle(1, 0x444444, 0.5);
    for (let x = 0; x <= this.config.width; x += this.config.pixelsPerSecond) {
      this.trackAreaGrid.moveTo(x, this.config.height);
      this.trackAreaGrid.lineTo(x, this.config.height + this.trackAreaHeight);
    }

    // 繪製次要垂直線（每拍）
    this.trackAreaGrid.lineStyle(1, 0x333333, 0.3);
    for (let x = 0; x <= this.config.width; x += this.config.pixelsPerSecond / 4) {
      if (x % this.config.pixelsPerSecond !== 0) {
        this.trackAreaGrid.moveTo(x, this.config.height);
        this.trackAreaGrid.lineTo(x, this.config.height + this.trackAreaHeight);
      }
    }
  }

  private drawTimeMarkers(): void {
    this.timeMarkers.removeChildren();

    for (let x = 0; x <= this.config.width; x += this.config.pixelsPerSecond) {
      const seconds = x / this.config.pixelsPerSecond;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      const text = new PIXI.Text(
        `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`,
        {
          fontSize: 10,
          fill: 0xcccccc,
          fontFamily: 'Arial'
        }
      );
      text.position.set(x + 4, 4);
      this.timeMarkers.addChild(text);
    }
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.draw();
  }

  public setTrackAreaHeight(height: number): void {
    this.trackAreaHeight = height;
    this.draw();
  }

  public setPixelsPerSecond(pixelsPerSecond: number): void {
    this.config.pixelsPerSecond = pixelsPerSecond;
    this.draw();
  }
} 