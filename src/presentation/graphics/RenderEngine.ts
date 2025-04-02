import * as PIXI from 'pixi.js';
import { injectable } from 'inversify';

export interface RenderEngineConfig {
  width: number;
  height: number;
  backgroundColor: number;
  resolution?: number;
  antialias?: boolean;
  view: HTMLCanvasElement;
}

@injectable()
export class RenderEngine {
  private app: PIXI.Application | null = null;
  private stage: PIXI.Container | null = null;

  initialize(config: RenderEngineConfig): void {
    if (this.app) {
      this.destroy();
    }

    this.app = new PIXI.Application({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      resolution: config.resolution || window.devicePixelRatio,
      antialias: config.antialias || true,
      view: config.view
    });

    this.stage = new PIXI.Container();
    this.app.stage.addChild(this.stage);
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
      this.stage = null;
    }
  }

  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }

  getStage(): PIXI.Container | null {
    return this.stage;
  }

  getApp(): PIXI.Application | null {
    return this.app;
  }

  update(): void {
    if (this.app) {
      this.app.ticker.update();
    }
  }
} 