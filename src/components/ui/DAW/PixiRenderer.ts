import * as PIXI from 'pixi.js';
import { 
  DAWSceneState, 
  DAWInteractionEvent, 
  PixiRendererConfig, 
  PixiRendererOptions,
  PerformanceMetrics,
  SceneDiff
} from './types';
import { DAWSceneGraph } from './DAWSceneGraph';
import { DAWInteractionManager } from './DAWInteractionManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SceneDiffer } from './SceneDiffer';

export class PixiRenderer {
  private app!: PIXI.Application;
  private currentScene: DAWSceneState | null = null;
  private sceneGraph: DAWSceneGraph;
  private interactionManager: DAWInteractionManager;
  private performanceMonitor: PerformanceMonitor;
  private sceneDiffer: SceneDiffer;
  private options: PixiRendererOptions;
  private isDestroyed = false;

  constructor(config: PixiRendererConfig, options: PixiRendererOptions) {
    this.options = options;
    this.initializePixiApp(config);
    this.sceneGraph = new DAWSceneGraph(this.app);
    this.interactionManager = new DAWInteractionManager(this.app);
    this.performanceMonitor = new PerformanceMonitor(this.app);
    this.sceneDiffer = new SceneDiffer();
    
    this.setupEventListeners();
    this.startRenderLoop();
  }

  private initializePixiApp(config: PixiRendererConfig): void {
    this.app = new PIXI.Application();
    
    // Initialize with the provided canvas
    this.app.init({
      canvas: config.canvas,
      backgroundColor: config.backgroundColor,
      antialias: config.antialias,
      preserveDrawingBuffer: config.preserveDrawingBuffer,
      powerPreference: config.powerPreference === 'default' ? undefined : config.powerPreference as 'high-performance' | 'low-power',
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Configure performance settings
    this.app.ticker.maxFPS = this.options.maxFPS;
    
    if (this.options.enableDebugMode) {
      this.enableDebugMode();
    }
  }

  private setupEventListeners(): void {
    // Handle canvas resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Performance monitoring
    this.app.ticker.add(() => {
      this.performanceMonitor.update();
    });
  }

  private startRenderLoop(): void {
    this.app.ticker.add(() => {
      if (this.isDestroyed) return;
      
      // Update scene graph animations and interactions
      this.sceneGraph.update();
      this.interactionManager.update();
    });
  }

  private enableDebugMode(): void {
    // Add debug information overlay
    const debugText = new PIXI.Text('Debug Mode', {
      fontSize: 12,
      fill: 0x00ff00,
    });
    debugText.position.set(10, 10);
    this.app.stage.addChild(debugText);
  }

  /**
   * Main rendering method called by React when scene state changes
   */
  public renderScene(newState: DAWSceneState): void {
    if (this.isDestroyed) return;

    try {
      const diff = this.sceneDiffer.calculateDiff(this.currentScene, newState);
      this.applySceneUpdates(diff, newState);
      this.currentScene = { ...newState };
      
      // Update performance metrics
      this.performanceMonitor.recordSceneUpdate();
    } catch (error) {
      console.error('Error rendering scene:', error);
      this.handleRenderError(error);
    }
  }

  private applySceneUpdates(diff: SceneDiff, newState: DAWSceneState): void {
    // Apply viewport changes
    if (diff.viewport) {
      this.sceneGraph.updateViewport(diff.viewport, newState.viewport);
    }

    // Apply timeline changes
    if (diff.timeline) {
      this.sceneGraph.updateTimeline(diff.timeline, newState.timeline);
    }

    // Apply track changes
    if (diff.tracks) {
      this.sceneGraph.updateTracks(diff.tracks, newState.tracks);
    }

    // Apply clip changes
    if (diff.clips) {
      this.sceneGraph.updateClips(diff.clips, newState.clips);
    }

    // Apply playhead changes
    if (diff.playhead) {
      this.sceneGraph.updatePlayhead(diff.playhead, newState.playhead);
    }

    // Apply selection changes
    if (diff.selection) {
      this.sceneGraph.updateSelection(diff.selection, newState.selection);
    }

    // Apply collaborator changes
    if (diff.collaborators && this.options.enableCollaboratorCursors) {
      this.sceneGraph.updateCollaborators(diff.collaborators, newState.collaborators);
    }

    // Handle redraw flags
    if (diff.shouldRedrawWaveforms) {
      this.sceneGraph.redrawWaveforms();
    }

    if (diff.shouldRedrawGrid) {
      this.sceneGraph.redrawGrid();
    }
  }

  private handleRenderError(error: any): void {
    console.error('Render error:', error);
    
    // Attempt to recover by clearing the scene and re-rendering
    if (this.currentScene) {
      this.sceneGraph.clear();
      this.renderScene(this.currentScene);
    }
  }

  /**
   * Handle canvas resize events
   */
  public resize(width: number, height: number): void {
    if (this.isDestroyed) return;
    
    this.app.renderer.resize(width, height);
    this.sceneGraph.handleResize(width, height);
  }

  private handleResize(): void {
    if (this.isDestroyed) return;
    
    const canvas = this.app.canvas;
    const parent = canvas.parentElement;
    
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.resize(rect.width, rect.height);
    }
  }

  /**
   * Set interaction event callback
   */
  public onInteraction(callback: (event: DAWInteractionEvent) => void): void {
    this.interactionManager.setCallback(callback);
  }

  /**
   * Performance optimization methods
   */
  public enablePerformanceMode(enabled: boolean): void {
    this.app.ticker.maxFPS = enabled ? 30 : 60;
    this.sceneGraph.setPerformanceMode(enabled);
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Debug methods
   */
  public exportScene(): any {
    return this.currentScene;
  }

  public getSceneGraph(): DAWSceneGraph {
    return this.sceneGraph;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Destroy components
    this.sceneGraph?.destroy();
    this.interactionManager?.destroy();
    this.performanceMonitor?.destroy();
    
    // Destroy PIXI app
    this.app?.destroy(true, true);
  }
} 