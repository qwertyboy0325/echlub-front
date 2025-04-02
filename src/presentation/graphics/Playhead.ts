import * as PIXI from 'pixi.js';

interface PlayheadConfig {
  height: number;
  pixelsPerSecond: number;
}

export class Playhead extends PIXI.Container {
  private config: PlayheadConfig;
  private line: PIXI.Graphics;
  private handle: PIXI.Graphics;
  private currentTime: number = 0;

  constructor(config: PlayheadConfig) {
    super();
    this.config = config;

    // 創建播放頭線條
    this.line = new PIXI.Graphics();
    this.addChild(this.line);

    // 創建播放頭手柄
    this.handle = new PIXI.Graphics();
    this.addChild(this.handle);

    this.draw();
  }

  private draw(): void {
    // 繪製播放頭線條
    this.line.clear();
    this.line.lineStyle(1, 0xff0000);
    this.line.moveTo(0, 0);
    this.line.lineTo(0, this.config.height);

    // 繪製播放頭手柄
    this.handle.clear();
    this.handle.beginFill(0xff0000);
    this.handle.drawPolygon([
      0, 0,      // 頂點
      8, 0,      // 右上
      4, 8       // 底部
    ]);
    this.handle.endFill();
  }

  public setTime(time: number): void {
    this.currentTime = time;
    this.position.x = time * this.config.pixelsPerSecond;
  }

  public getTime(): number {
    return this.currentTime;
  }

  public setHeight(height: number): void {
    this.config.height = height;
    this.draw();
  }

  public setPixelsPerSecond(pixelsPerSecond: number): void {
    this.config.pixelsPerSecond = pixelsPerSecond;
    this.setTime(this.currentTime); // 更新位置
  }
} 