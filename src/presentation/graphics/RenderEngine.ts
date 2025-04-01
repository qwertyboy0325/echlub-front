import * as PIXI from 'pixi.js';

export interface RenderEngineConfig {
  view: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: number;
  antialias?: boolean;
}

export class RenderEngine {
  private app: PIXI.Application | null = null;
  private config: RenderEngineConfig;

  constructor(config: RenderEngineConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    if (!this.config.view) {
      throw new Error('Canvas element is required for RenderEngine initialization');
    }

    // 設置 canvas 樣式
    this.config.view.style.width = '100%';
    this.config.view.style.height = '100%';

    // 創建 PixiJS 應用
    this.app = new PIXI.Application({
      view: this.config.view,
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor ?? 0x1e1e1e,
      antialias: this.config.antialias ?? true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      resizeTo: this.config.view
    });

    // 設置舞台屬性
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.config.width, this.config.height);

    console.debug('[RenderEngine] Initialized with config:', {
      width: this.config.width,
      height: this.config.height,
      resolution: this.app.renderer.resolution
    });
  }

  public getApplication(): PIXI.Application {
    if (!this.app) {
      throw new Error('RenderEngine not initialized');
    }
    return this.app;
  }

  public getStage(): PIXI.Container {
    if (!this.app) {
      throw new Error('RenderEngine not initialized');
    }
    return this.app.stage;
  }

  public resize(width: number, height: number): void {
    if (!this.app) return;

    this.config.width = width;
    this.config.height = height;
    
    this.app.renderer.resize(width, height);
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);
  }

  public dispose(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
} 