import * as PIXI from 'pixi.js';

export interface PixiStageConfig {
  backgroundColor?: number;
}

export class PixiStageManager {
  private app: PIXI.Application;
  private canvas: HTMLCanvasElement;
  private mainContainer: PIXI.Container;
  private components: Map<string, PIXI.Container>;
  private resizeObserver!: ResizeObserver;  // 使用 ! 運算符，因為它在 setupResizeHandler 中被初始化
  private containerElement: HTMLElement;
  private isInitialized: boolean = false;
  private initPromise: Promise<void>;

  constructor(containerElement: HTMLElement, config: PixiStageConfig = {}) {
    this.containerElement = containerElement;
    this.components = new Map();
    
    // 創建 canvas 元素
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    containerElement.appendChild(this.canvas);
    
    // 初始化 PIXI 應用
    this.app = new PIXI.Application();
    
    // 主容器
    this.mainContainer = new PIXI.Container();
    
    // 初始化 Promise
    this.initPromise = this.app.init({
      canvas: this.canvas,
      width: containerElement.clientWidth,
      height: containerElement.clientHeight,
      backgroundColor: config.backgroundColor || 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    }).then(() => {
      // 添加主容器
      this.app.stage.addChild(this.mainContainer);
      
      // 設置自動調整大小
      this.setupResizeHandler();
      
      // 標記為已初始化
      this.isInitialized = true;
    }).catch((error) => {
      console.error('Failed to initialize PIXI application:', error);
      throw error;
    });
  }

  // 等待初始化完成
  public async waitForInit(): Promise<void> {
    return this.initPromise;
  }

  // 檢查是否已初始化
  public isReady(): boolean {
    return this.isInitialized;
  }

  private setupResizeHandler(): void {
    // 創建 ResizeObserver 來監聽容器大小變化
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });

    // 開始監聽容器大小變化
    this.resizeObserver.observe(this.containerElement);
  }

  public resize(width: number, height: number): void {
    if (this.app?.renderer) {
      this.app.renderer.resize(width, height);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      
      // 觸發所有組件的 resize 事件
      this.components.forEach((component) => {
        if ('resize' in component && typeof (component as any).resize === 'function') {
          (component as any).resize(width, height);
        }
      });
    }
  }

  public addComponent(id: string, component: PIXI.Container): void {
    if (this.components.has(id)) {
      console.warn(`Component with id ${id} already exists. It will be replaced.`);
      this.removeComponent(id);
    }
    
    this.components.set(id, component);
    this.mainContainer.addChild(component);
  }

  public removeComponent(id: string): void {
    const component = this.components.get(id);
    if (component) {
      this.mainContainer.removeChild(component);
      this.components.delete(id);
    }
  }

  public getComponent(id: string): PIXI.Container | undefined {
    return this.components.get(id);
  }

  public destroy(): void {
    // 停止監聽大小變化
    this.resizeObserver.disconnect();
    
    // 清理所有組件
    this.components.clear();
    
    // 銷毀 PIXI 應用
    if (this.app) {
      this.app.destroy();
    }
    
    // 移除 canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  // 獲取 PIXI 應用實例
  public getApp(): PIXI.Application {
    return this.app;
  }

  // 獲取主容器
  public getMainContainer(): PIXI.Container {
    return this.mainContainer;
  }
} 