import * as PIXI from 'pixi.js';

interface RenderConfig {
  width: number;
  height: number;
  backgroundColor: number;
  gridColor: number;
  gridSize: number;
}

export class RenderManager {
  private app: PIXI.Application;
  private gridContainer: PIXI.Container;
  private config: RenderConfig;
  private canvas: HTMLCanvasElement;

  constructor(config: RenderConfig) {
    this.config = config;
    this.gridContainer = new PIXI.Container();
    
    // 創建 canvas 元素
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    
    // 初始化 PIXI 應用
    this.app = new PIXI.Application();
    
    // 設置渲染器
    this.app.init({
      canvas: this.canvas,
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    }).then(() => {
      // 添加網格容器
      this.app.stage.addChild(this.gridContainer);

      // 繪製內容
      this.drawGrid();
      this.addTimeMarkers();
      this.addBorder();
    }).catch((error) => {
      console.error('Failed to initialize PIXI application:', error);
    });
  }

  public get view(): HTMLCanvasElement {
    return this.canvas;
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.app?.renderer) {
      this.app.renderer.resize(width, height);
      this.redraw();
    }
  }

  private drawGrid(): void {
    const grid = new PIXI.Graphics();
    this.gridContainer.addChild(grid);

    // 繪製細網格線
    grid.lineStyle(1, this.config.gridColor, 0.5);

    // 垂直線
    for (let x = 0; x <= this.config.width; x += this.config.gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.config.height);
    }

    // 水平線
    for (let y = 0; y <= this.config.height; y += this.config.gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(this.config.width, y);
    }

    // 繪製粗網格線
    grid.lineStyle(2, this.config.gridColor, 0.8);

    // 垂直主線
    for (let x = 0; x <= this.config.width; x += this.config.gridSize * 4) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.config.height);
    }

    // 水平主線
    for (let y = 0; y <= this.config.height; y += this.config.gridSize * 4) {
      grid.moveTo(0, y);
      grid.lineTo(this.config.width, y);
    }
  }

  private addTimeMarkers(): void {
    const timeMarkers = new PIXI.Container();
    this.gridContainer.addChild(timeMarkers);

    for (let x = 0; x <= this.config.width; x += this.config.gridSize * 4) {
      const seconds = x / this.config.gridSize;
      const text = new PIXI.Text(`${seconds}s`, {
        fontSize: 12,
        fill: 0xcccccc,
        fontFamily: 'Arial'
      });
      text.x = x + 4;
      text.y = 4;
      timeMarkers.addChild(text);
    }
  }

  private addBorder(): void {
    const border = new PIXI.Graphics();
    border.lineStyle(2, 0xff0000, 1);
    border.drawRect(0, 0, this.config.width, this.config.height);
    this.gridContainer.addChild(border);
  }

  private redraw(): void {
    this.gridContainer.removeChildren();
    this.drawGrid();
    this.addTimeMarkers();
    this.addBorder();
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy();
    }
  }
} 