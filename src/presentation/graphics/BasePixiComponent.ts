import * as PIXI from 'pixi.js';

export interface BaseComponentConfig {
  x?: number;
  y?: number;
  width: number;
  height: number;
  backgroundColor?: number;
  borderColor?: number;
  borderWidth?: number;
}

export class BasePixiComponent extends PIXI.Container {
  protected config: BaseComponentConfig;
  protected background: PIXI.Graphics;

  constructor(config: BaseComponentConfig) {
    super();
    this.config = {
      x: 0,
      y: 0,
      borderWidth: 0,
      ...config
    };

    // 設置位置
    this.position.set(this.config.x!, this.config.y!);

    // 創建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);
    this.drawBackground();
  }

  protected drawBackground(): void {
    this.background.clear();

    // 繪製背景
    if (this.config.backgroundColor !== undefined) {
      this.background.beginFill(this.config.backgroundColor);
      this.background.drawRect(0, 0, this.config.width, this.config.height);
      this.background.endFill();
    }

    // 繪製邊框
    if (this.config.borderColor !== undefined && this.config.borderWidth! > 0) {
      this.background.lineStyle(this.config.borderWidth!, this.config.borderColor);
      this.background.drawRect(0, 0, this.config.width, this.config.height);
    }
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.drawBackground();
    this.onResize(width, height);
  }

  protected onResize(width: number, height: number): void {
    // 子類可以覆蓋此方法以實現自定義的調整大小邏輯
  }

  public setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }

  public destroy(): void {
    this.background.destroy();
    super.destroy();
  }
} 