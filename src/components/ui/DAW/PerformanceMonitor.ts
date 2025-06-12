import * as PIXI from 'pixi.js';
import { PerformanceMetrics } from './types';

export class PerformanceMonitor {
  private app: PIXI.Application;
  private metrics: PerformanceMetrics;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private updateCount: number = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      totalObjects: 0,
      memoryUsage: 0,
      lastUpdateTime: Date.now()
    };
    
    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.lastTime = performance.now();
    
    // Monitor FPS
    this.app.ticker.add(() => {
      this.updateFPS();
    });
  }

  private updateFPS(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameCount++;
    
    // Calculate FPS every second
    if (deltaTime >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.metrics.frameTime = deltaTime / this.frameCount;
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  public update(): void {
    this.updateCount++;
    
    // Update other metrics
    this.metrics.totalObjects = this.countDisplayObjects(this.app.stage);
    this.metrics.drawCalls = this.estimateDrawCalls();
    this.metrics.memoryUsage = this.estimateMemoryUsage();
    this.metrics.lastUpdateTime = Date.now();
  }

  private countDisplayObjects(container: PIXI.Container): number {
    let count = 1; // Count the container itself
    
    for (const child of container.children) {
      if (child instanceof PIXI.Container) {
        count += this.countDisplayObjects(child);
      } else {
        count++;
      }
    }
    
    return count;
  }

  private estimateDrawCalls(): number {
    // Simplified estimation - in a real implementation, this would
    // integrate with PIXI's renderer to get actual draw call counts
    return Math.ceil(this.metrics.totalObjects / 10);
  }

  private estimateMemoryUsage(): number {
    // Simplified estimation - in a real implementation, this would
    // track texture memory and other GPU resources
    const perfWithMemory = performance as any;
    if (perfWithMemory.memory) {
      return perfWithMemory.memory.usedJSHeapSize;
    }
    return 0;
  }

  public recordSceneUpdate(): void {
    this.updateCount++;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getUpdateCount(): number {
    return this.updateCount;
  }

  public reset(): void {
    this.frameCount = 0;
    this.updateCount = 0;
    this.lastTime = performance.now();
    this.metrics.lastUpdateTime = Date.now();
  }

  public destroy(): void {
    // Clean up any resources
    this.reset();
  }
} 