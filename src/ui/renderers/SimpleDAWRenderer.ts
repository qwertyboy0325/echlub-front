import * as PIXI from 'pixi.js';
import { DAWSceneState, DAWInteractionEvent } from '../types/DAWSceneState';

interface RendererCache {
  tracks: Map<string, PIXI.Container>;
  clips: Map<string, PIXI.Container>;
  grid: PIXI.Container | null;
  playhead: PIXI.Graphics | null;
  background: PIXI.Graphics | null;
}

interface RenderLayers {
  background: PIXI.Container;
  grid: PIXI.Container;
  tracks: PIXI.Container;
  clips: PIXI.Container;
  playhead: PIXI.Container;
  ui: PIXI.Container;
}

/**
 * Enhanced DAW Renderer with intelligent differential updates
 * Optimized for performance and memory management
 */
export class SimpleDAWRenderer {
  private app: PIXI.Application | null = null;
  private isInitialized = false;
  private isDestroyed = false;
  private onInteractionCallback: ((event: DAWInteractionEvent) => void) | null = null;
  private lastSceneState: DAWSceneState | null = null;
  
  // Drag state tracking for timeline scrubbing
  private isDragging = false;
  private dragStartX = 0;
  private lastDragTime = 0;

  // Performance optimization
  private cache: RendererCache = {
    tracks: new Map(),
    clips: new Map(),
    grid: null,
    playhead: null,
    background: null
  };
  
  private layers: RenderLayers | null = null;
  private lastUpdateTimestamp = 0;
  private renderFrameId: number | null = null;
  private pendingRender = false;

  // Performance optimizations
  private objectPool = {
    graphics: [] as PIXI.Graphics[],
    containers: [] as PIXI.Container[],
    texts: [] as PIXI.Text[]
  };
  private viewportCulling = true;
  private lastRenderTime = 0;
  private targetFPS = 60;
  private minFrameTime = 1000 / this.targetFPS;

  constructor(private canvas: HTMLCanvasElement) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      // Get the actual display size from the canvas element
      const canvasRect = this.canvas.getBoundingClientRect();
      const displayWidth = canvasRect.width || this.canvas.clientWidth || 800;
      const displayHeight = canvasRect.height || this.canvas.clientHeight || 600;
      
      console.log('SimpleDAWRenderer: Initializing with display size:', displayWidth, 'x', displayHeight);
      
      this.app = new PIXI.Application();
      await this.app.init({
        canvas: this.canvas,
        width: displayWidth,
        height: displayHeight,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
      
      // Ensure canvas dimensions match the display size
      this.canvas.width = displayWidth * (window.devicePixelRatio || 1);
      this.canvas.height = displayHeight * (window.devicePixelRatio || 1);
      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;
      
      console.log('SimpleDAWRenderer: Canvas initialized:', this.app.canvas.width, 'x', this.app.canvas.height);
      
      // Initialize render layers for better organization
      this.initializeLayers();
      
      // Check again after async initialization
      if (!this.isDestroyed && this.app) {
        this.isInitialized = true;
        console.log('DAW Renderer initialized successfully');
      } else if (this.isDestroyed && this.app) {
        this.app.destroy(true);
        this.app = null;
      }
    } catch (error) {
      console.error('Failed to initialize DAW Renderer:', error);
      this.isInitialized = false;
      if (this.app) {
        try {
          this.app.destroy(true);
        } catch (destroyError) {
          console.warn('Error destroying app after init failure:', destroyError);
        }
        this.app = null;
      }
    }
  }

  private initializeLayers(): void {
    if (!this.app) return;

    this.layers = {
      background: new PIXI.Container(),
      grid: new PIXI.Container(),
      tracks: new PIXI.Container(),
      clips: new PIXI.Container(),
      playhead: new PIXI.Container(),
      ui: new PIXI.Container()
    };

    // Add layers to stage in correct order
    this.app.stage.addChild(this.layers.background);
    this.app.stage.addChild(this.layers.grid);
    this.app.stage.addChild(this.layers.tracks);
    this.app.stage.addChild(this.layers.clips);
    this.app.stage.addChild(this.layers.playhead);
    this.app.stage.addChild(this.layers.ui);

    console.log('SimpleDAWRenderer: Layers initialized');
  }

  /**
   * Intelligent scene update with differential rendering
   */
  public updateScene(sceneState: DAWSceneState): void {
    if (!this.isInitialized || !this.app || this.isDestroyed) {
      if (!this.isDestroyed) {
        setTimeout(() => this.updateScene(sceneState), 100);
      }
      return;
    }

    // Avoid duplicate renders within the same frame
    if (this.pendingRender) return;
    
    // Store the scene state
    const previousState = this.lastSceneState;
    this.lastSceneState = sceneState;
    
    // Schedule optimized render
    this.scheduleRender(previousState, sceneState);
  }

  private scheduleRender(previousState: DAWSceneState | null, newState: DAWSceneState): void {
    // Performance: Skip redundant renders
    if (this.pendingRender) {
      console.log('SimpleDAWRenderer: Skipping render - already pending');
      return;
    }

    // Performance: Frame rate limiting
    const now = performance.now();
    if (now - this.lastRenderTime < this.minFrameTime) {
      // Defer render to next available frame
      this.renderFrameId = requestAnimationFrame(() => {
        this.performDifferentialRender(previousState, newState);
        this.lastRenderTime = performance.now();
        this.pendingRender = false;
      });
      this.pendingRender = true;
      return;
    }

    // Immediate render for time-critical updates
    this.performDifferentialRender(previousState, newState);
    this.lastRenderTime = now;
  }

  private performDifferentialRender(previousState: DAWSceneState | null, newState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

    const perfStart = performance.now();
    
    try {
      // Update viewport if changed
      if (!previousState || this.hasViewportChanged(previousState, newState)) {
        this.updateViewport(newState);
      }

      // Update background if needed
      if (!previousState || this.shouldUpdateBackground(previousState, newState)) {
        this.updateBackground(newState);
      }

      // Update grid if needed
      if (!previousState || newState.shouldRedrawGrid || this.hasTimelineChanged(previousState, newState)) {
        this.updateGrid(newState);
      }

      // Update tracks (differential)
      this.updateTracks(previousState, newState);

      // Update clips (differential)
      this.updateClips(previousState, newState);

      // Update playhead if changed
      const shouldUpdatePlayhead = !previousState || this.hasPlayheadChanged(previousState, newState);
      console.log('🎯 SimpleDAWRenderer: Checking playhead update:', {
        hasPreviousState: !!previousState,
        shouldUpdate: shouldUpdatePlayhead,
        prevTime: previousState?.playhead?.currentTime,
        currTime: newState.playhead.currentTime
      });
      
      if (shouldUpdatePlayhead) {
        this.updatePlayhead(newState);
      }

      // Reset redraw flags
      if (newState.shouldRedrawGrid || newState.shouldRedrawWaveforms) {
        // These flags are consumed, they would be reset by the adapter
      }

      const perfEnd = performance.now();
      console.log(`SimpleDAWRenderer: Differential render completed in ${perfEnd - perfStart}ms`);
      
    } catch (error) {
      console.error('SimpleDAWRenderer: Error during differential render:', error);
    }
  }

  private hasViewportChanged(prev: DAWSceneState, curr: DAWSceneState): boolean {
    return prev.viewport.width !== curr.viewport.width ||
           prev.viewport.height !== curr.viewport.height ||
           prev.viewport.devicePixelRatio !== curr.viewport.devicePixelRatio;
  }

  private shouldUpdateBackground(prev: DAWSceneState, curr: DAWSceneState): boolean {
    return this.hasViewportChanged(prev, curr) || !this.cache.background;
  }

  private hasTimelineChanged(prev: DAWSceneState, curr: DAWSceneState): boolean {
    return prev.timeline.scrollX !== curr.timeline.scrollX ||
           prev.timeline.scrollY !== curr.timeline.scrollY ||
           prev.timeline.pixelsPerBeat !== curr.timeline.pixelsPerBeat;
  }

  private hasPlayheadChanged(prev: DAWSceneState, curr: DAWSceneState): boolean {
    const timeChanged = prev.playhead.currentTime !== curr.playhead.currentTime;
    const visibleChanged = prev.playhead.isVisible !== curr.playhead.isVisible;
    const playingChanged = prev.playhead.isPlaying !== curr.playhead.isPlaying;
    
    const hasChanged = timeChanged || visibleChanged || playingChanged;
    
    if (hasChanged) {
      console.log('🎯 SimpleDAWRenderer: Playhead change detected:', {
        timeChanged: timeChanged ? `${prev.playhead.currentTime} -> ${curr.playhead.currentTime}` : false,
        visibleChanged: visibleChanged ? `${prev.playhead.isVisible} -> ${curr.playhead.isVisible}` : false,
        playingChanged: playingChanged ? `${prev.playhead.isPlaying} -> ${curr.playhead.isPlaying}` : false
      });
    }
    
    return hasChanged;
  }

  private updateViewport(sceneState: DAWSceneState): void {
    if (!this.app) return;
    
    const { width, height } = sceneState.viewport;
    if (this.app.renderer.width !== width || this.app.renderer.height !== height) {
      this.resize(width, height);
    }
  }

  private updateBackground(sceneState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

    // Remove old background
    if (this.cache.background) {
      this.layers.background.removeChild(this.cache.background);
      this.cache.background.destroy();
    }

    // Create new background with extended timeline area
    const background = new PIXI.Graphics();
    const { width } = sceneState.viewport;
    const { pixelsPerBeat, visibleTimeRange } = sceneState.timeline;
    
    // Calculate the total timeline width based on visible time range
    const timelineWidth = Math.max(width, visibleTimeRange.end * pixelsPerBeat);
    
    // Calculate height based on actual content: header + all tracks
    const headerHeight = 50; // Time ruler height
    const trackHeight = 80;
    const totalHeight = Math.max(
      sceneState.viewport.height,
      headerHeight + (sceneState.tracks.length * trackHeight) + 100 // Add extra space
    );
    
    background.rect(0, 0, timelineWidth, totalHeight);
    background.fill(0x1a1a1a);
    
    // Add interaction with timeline scrubbing support
    background.eventMode = 'static';
    background.cursor = 'crosshair';
    background.interactiveChildren = false; // Prevent child blocking
    
    // Timeline scrubbing events
    background.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      console.log('🖱️ Background pointerdown at:', event.global.x, event.global.y);
      this.handleBackgroundPointerDown(event, sceneState);
    });
    
    background.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (this.isDragging) {
        this.handleBackgroundPointerMove(event, sceneState);
      }
    });
    
    background.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
      if (this.isDragging) {
        this.handleBackgroundPointerUp(event, sceneState);
      }
    });
    
    background.on('pointerupoutside', (event: PIXI.FederatedPointerEvent) => {
      if (this.isDragging) {
        this.handleBackgroundPointerUp(event, sceneState);
      }
    });
    
    console.log('🎯 Background interaction area set with scrubbing:', timelineWidth, 'x', totalHeight);

    this.layers.background.addChild(background);
    this.cache.background = background;
    
    console.log('SimpleDAWRenderer: Background updated with dynamic height:', totalHeight);
  }

  private updateGrid(sceneState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

    // Remove old grid
    if (this.cache.grid) {
      this.layers.grid.removeChild(this.cache.grid);
      this.cache.grid.destroy();
    }

    // Create new grid container
    const gridContainer = new PIXI.Container();
    const { width } = sceneState.viewport;
    const { pixelsPerBeat, scrollX, beatsPerMeasure, visibleTimeRange } = sceneState.timeline;
    
    // Calculate dynamic height based on content
    const headerHeight = 50; // Time ruler height
    const trackHeight = 80;
    const totalHeight = Math.max(
      sceneState.viewport.height,
      headerHeight + (sceneState.tracks.length * trackHeight) + 100 // Add extra space
    );
    
    // Account for left track panel offset (200px track headers)
    const trackPanelWidth = 200;
    const timelineStartX = 0; // Timeline starts at 0 in the canvas (which is already offset from track panel)
    const totalTimelineWidth = Math.max(width, visibleTimeRange.end * pixelsPerBeat);

    // Create grid graphics
    const grid = new PIXI.Graphics();
    
    // Calculate visible beat range with extended timeline support
    const startBeat = Math.floor(scrollX / pixelsPerBeat);
    const endBeat = Math.ceil((scrollX + width) / pixelsPerBeat) + 20; // Add extra beats for longer timeline

    // Draw vertical grid lines with enhanced measure markers
    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = beat * pixelsPerBeat - scrollX;
      if (x >= 0 && x <= width) {
        const isMeasureBoundary = beat % beatsPerMeasure === 0;
        
        // Different line styles for measures vs beats
        if (isMeasureBoundary) {
          // Measure lines - thicker and brighter
          grid.moveTo(x, 0);
          grid.lineTo(x, totalHeight);
          grid.stroke({ color: 0x555555, width: 2, alpha: 0.8 });
        } else {
          // Beat lines - thinner and dimmer
          grid.moveTo(x, 0);
          grid.lineTo(x, totalHeight);
          grid.stroke({ color: 0x333333, width: 1, alpha: 0.4 });
        }
      }
    }

    // Draw horizontal track dividers with extended width
    for (let y = trackHeight; y < totalHeight; y += trackHeight) {
      grid.moveTo(0, y);
      grid.lineTo(totalTimelineWidth, y);
      grid.stroke({ color: 0x333333, width: 1, alpha: 0.5 });
    }

    gridContainer.addChild(grid);

    // Add time ruler at the top with same height as track panel header (50px) for perfect alignment
    const timeRulerHeight = 50; // Same height as track panel header for perfect alignment
    const timeRulerBg = new PIXI.Graphics();
    timeRulerBg.rect(0, 0, totalTimelineWidth, timeRulerHeight);
    timeRulerBg.fill(0x334155, 0.95); // Same color as track panel header
    timeRulerBg.stroke({ color: 0x475569, width: 1 });
    gridContainer.addChild(timeRulerBg);

    // Add measure numbers and time markers
    const startMeasure = Math.floor(startBeat / beatsPerMeasure);
    const endMeasure = Math.ceil(endBeat / beatsPerMeasure);

    for (let measure = startMeasure; measure <= endMeasure; measure++) {
      const measureBeat = measure * beatsPerMeasure;
      const x = measureBeat * pixelsPerBeat - scrollX;
      
      if (x >= -50 && x <= width + 50) { // Render with some margin
        // Measure number - positioned in the 50px tall ruler
        const measureText = new PIXI.Text({
          text: `${measure + 1}`,
          style: {
            fontSize: 14,
            fill: 0xf1f5f9,
            fontFamily: 'Arial',
            fontWeight: 'bold'
          }
        });
        measureText.position.set(x + 6, 8);
        gridContainer.addChild(measureText);

        // Time marker (MM:SS.mmm format) - positioned in lower part of ruler
        const timeInSeconds = measureBeat / 2; // Assuming 120 BPM (2 beats per second)
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').substring(0, 2)}`;
        
        const timeText = new PIXI.Text({
          text: timeString,
          style: {
            fontSize: 10,
            fill: 0x94a3b8,
            fontFamily: 'monospace'
          }
        });
        timeText.position.set(x + 6, 28);
        gridContainer.addChild(timeText);

        // Measure separator line
        if (measure > startMeasure) {
          const separatorLine = new PIXI.Graphics();
          separatorLine.moveTo(x, 0);
          separatorLine.lineTo(x, timeRulerHeight);
          separatorLine.stroke({ color: 0x64748b, width: 1, alpha: 0.6 });
          gridContainer.addChild(separatorLine);
        }
      }
    }

    // Add beat subdivision markers within visible measures
    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = beat * pixelsPerBeat - scrollX;
      if (x >= 0 && x <= width && beat % beatsPerMeasure !== 0) {
        // Beat tick mark - positioned at bottom of ruler
        const beatTick = new PIXI.Graphics();
        beatTick.moveTo(x, timeRulerHeight - 8);
        beatTick.lineTo(x, timeRulerHeight);
        beatTick.stroke({ color: 0x64748b, width: 1, alpha: 0.4 });
        gridContainer.addChild(beatTick);

        // Beat number within measure - positioned in lower portion
        const beatInMeasure = (beat % beatsPerMeasure) + 1;
        const beatText = new PIXI.Text({
          text: beatInMeasure.toString(),
          style: {
            fontSize: 8,
            fill: 0x64748b,
            fontFamily: 'Arial'
          }
        });
        beatText.position.set(x + 2, timeRulerHeight - 15);
        gridContainer.addChild(beatText);
      }
    }

    this.layers.grid.addChild(gridContainer);
    this.cache.grid = gridContainer;
    
    console.log('SimpleDAWRenderer: Enhanced grid with time ruler updated');
  }

  private updateTracks(previousState: DAWSceneState | null, newState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

    const currentTrackIds = new Set(newState.tracks.map(t => t.id));
    const previousTrackIds = new Set(previousState?.tracks.map(t => t.id) || []);

    // Remove deleted tracks
    for (const [trackId, trackContainer] of this.cache.tracks) {
      if (!currentTrackIds.has(trackId)) {
        this.layers.tracks.removeChild(trackContainer);
        trackContainer.destroy({ children: true });
        this.cache.tracks.delete(trackId);
        console.log('SimpleDAWRenderer: Removed track', trackId);
      }
    }

    // Update or create tracks
    newState.tracks.forEach(track => {
      const existingContainer = this.cache.tracks.get(track.id);
      const previousTrack = previousState?.tracks.find(t => t.id === track.id);
      
      if (!existingContainer || this.hasTrackChanged(previousTrack, track)) {
        this.updateTrack(track);
      }
    });
  }

  private hasTrackChanged(prev: any, curr: any): boolean {
    if (!prev) return true;
    return prev.name !== curr.name ||
           prev.isSelected !== curr.isSelected ||
           prev.yPosition !== curr.yPosition ||
           prev.color !== curr.color;
  }

  private updateTrack(track: any): void {
    if (!this.app || !this.layers || !this.lastSceneState) return;

    // Remove existing track container
    const existingContainer = this.cache.tracks.get(track.id);
    if (existingContainer) {
      this.layers.tracks.removeChild(existingContainer);
      existingContainer.destroy({ children: true });
    }

    // Create new track container
    const trackContainer = new PIXI.Container();
    
    // Calculate dynamic width for track background
    const { pixelsPerBeat, visibleTimeRange } = this.lastSceneState.timeline;
    const trackWidth = Math.max(this.lastSceneState.viewport.width, visibleTimeRange.end * pixelsPerBeat);
    
    // Track background - only the timeline area, no labels (labels are in TrackHeaders component)
    const trackBg = new PIXI.Graphics();
    trackBg.rect(0, track.yPosition, trackWidth, 80);
    trackBg.fill(track.isSelected ? 0x334155 : 0x1e293b);
    trackBg.stroke({ color: 0x475569, width: 1 });
    trackContainer.addChild(trackBg);

    // Track interaction area for timeline clicks and track selection
    trackBg.eventMode = 'static';
    trackBg.cursor = 'crosshair';
    
    trackBg.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      console.log('🖱️ Track background clicked:', track.id, 'at:', event.global.x, event.global.y);
      
      if (this.onInteractionCallback && this.lastSceneState) {
        // Calculate timeline position for playhead
        const time = (event.global.x + this.lastSceneState.timeline.scrollX) / this.lastSceneState.timeline.pixelsPerBeat;
        
        // Send both track selection and timeline click
        this.onInteractionCallback({
          type: 'track-select',
          payload: { 
            trackId: track.id,
            position: { x: event.global.x, y: event.global.y }
          },
          timestamp: Date.now()
        });
        
        this.onInteractionCallback({
          type: 'timeline-click',
          payload: { time, x: event.global.x, y: event.global.y },
          timestamp: Date.now()
        });
      }
    });

    this.layers.tracks.addChild(trackContainer);
    this.cache.tracks.set(track.id, trackContainer);
    
    console.log('SimpleDAWRenderer: Updated track', track.id, 'timeline area only');
  }

  private updateClips(previousState: DAWSceneState | null, newState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

    const currentClipIds = new Set(newState.clips.map(c => c.id));

    // Remove deleted clips
    for (const [clipId, clipContainer] of this.cache.clips) {
      if (!currentClipIds.has(clipId)) {
        this.layers.clips.removeChild(clipContainer);
        clipContainer.destroy({ children: true });
        this.cache.clips.delete(clipId);
        console.log('SimpleDAWRenderer: Removed clip', clipId);
      }
    }

    // Update or create clips
    newState.clips.forEach(clip => {
      const existingContainer = this.cache.clips.get(clip.id);
      const previousClip = previousState?.clips.find(c => c.id === clip.id);
      
      if (!existingContainer || this.hasClipChanged(previousClip, clip, newState)) {
        this.updateClip(clip, newState);
      }
    });
  }

  private hasClipChanged(prev: any, curr: any, sceneState: DAWSceneState): boolean {
    if (!prev) return true;
    return prev.startTime !== curr.startTime ||
           prev.duration !== curr.duration ||
           prev.trackId !== curr.trackId ||
           prev.isSelected !== curr.isSelected ||
           prev.name !== curr.name ||
           sceneState.shouldRedrawWaveforms;
  }

  private updateClip(clip: any, sceneState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

      const track = sceneState.tracks.find(t => t.id === clip.trackId);
      if (!track) return;

    // Remove existing clip container
    const existingContainer = this.cache.clips.get(clip.id);
    if (existingContainer) {
      this.layers.clips.removeChild(existingContainer);
      existingContainer.destroy({ children: true });
    }

    // Create new clip container
    const clipContainer = new PIXI.Container();
    
    const x = (clip.startTime * sceneState.timeline.pixelsPerBeat) - sceneState.timeline.scrollX;
    const y = track.yPosition + 15;
      const width = clip.duration * sceneState.timeline.pixelsPerBeat;
      const height = 50;

    // Only render if visible
    if (x + width > 0 && x < sceneState.viewport.width) {
      // Clip background
      const color = parseInt(clip.color.replace('#', ''), 16);
      const clipBg = new PIXI.Graphics();
      clipBg.rect(x, y, width, height);
      clipBg.fill(color, clip.isSelected ? 0.9 : 0.7);
      clipBg.stroke({ color: clip.isSelected ? 0xffffff : color, width: 2 });
      
      // 🎯 Enable interaction for clip selection and dragging
      clipBg.interactive = true;
      clipBg.cursor = 'move';
      
      // Drag state for this clip
      let isDragging = false;
      let dragStartX = 0;
      let dragStartTime = 0;
      
      // Add pointer down event listener
      clipBg.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
        console.log('🖱️ Clip pointer down:', clip.id);
        event.stopPropagation(); // Prevent background click
        
        isDragging = true;
        dragStartX = event.global.x;
        dragStartTime = clip.startTime;
        
        // Select the clip
        if (this.onInteractionCallback) {
          this.onInteractionCallback({
            type: 'clip-select',
            payload: { 
              clipId: clip.id,
              isMultiSelect: event.shiftKey || event.ctrlKey || event.metaKey,
              position: { x: event.global.x, y: event.global.y }
            },
            timestamp: Date.now()
          });
        }
        
        // Change cursor during drag
        clipBg.cursor = 'grabbing';
      });
      
      // Add pointer move event listener for dragging
      clipBg.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
        if (!isDragging) return;
        
        const deltaX = event.global.x - dragStartX;
        const deltaTime = deltaX / sceneState.timeline.pixelsPerBeat;
        const newStartTime = Math.max(0, dragStartTime + deltaTime);
        
        // Snap to grid if enabled
        const snappedTime = sceneState.timeline.snapToGrid 
          ? Math.round(newStartTime / sceneState.timeline.gridResolution) * sceneState.timeline.gridResolution
          : newStartTime;
        
        // Update clip position visually (real-time feedback)
        if (this.onInteractionCallback) {
          this.onInteractionCallback({
            type: 'clip-drag',
            payload: { 
              clipId: clip.id,
              newStartTime: snappedTime,
              isPreview: true // This is just a preview, not final
            },
            timestamp: Date.now()
          });
        }
      });
      
      // Add pointer up event listener to complete the drag
      clipBg.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
        if (!isDragging) return;
        
        isDragging = false;
        clipBg.cursor = 'move';
        
        const deltaX = event.global.x - dragStartX;
        const deltaTime = deltaX / sceneState.timeline.pixelsPerBeat;
        const newStartTime = Math.max(0, dragStartTime + deltaTime);
        
        // Snap to grid if enabled
        const snappedTime = sceneState.timeline.snapToGrid 
          ? Math.round(newStartTime / sceneState.timeline.gridResolution) * sceneState.timeline.gridResolution
          : newStartTime;
        
        // Only update if position actually changed
        if (Math.abs(snappedTime - clip.startTime) > 0.001) {
          console.log(`🎵 Moving clip ${clip.id} from ${clip.startTime} to ${snappedTime}`);
          
          if (this.onInteractionCallback) {
            this.onInteractionCallback({
              type: 'clip-move',
              payload: { 
                clipId: clip.id,
                newStartTime: snappedTime,
                isPreview: false // This is the final position
              },
              timestamp: Date.now()
            });
          }
        }
      });
      
      // Handle mouse leave to cancel drag if needed
      clipBg.on('pointerupoutside', () => {
        if (isDragging) {
          isDragging = false;
          clipBg.cursor = 'move';
          console.log('🎵 Clip drag cancelled (pointer left clip)');
        }
      });
      
      clipContainer.addChild(clipBg);

      // 🎯 Add resize handles for selected clips
      if (clip.isSelected) {
        // Left resize handle (adjust start time and duration)
        const leftHandle = new PIXI.Graphics();
        leftHandle.rect(x - 4, y, 8, height);
        leftHandle.fill(0xffffff, 0.8);
        leftHandle.stroke({ color: 0x2563eb, width: 2 });
        leftHandle.interactive = true;
        leftHandle.cursor = 'ew-resize';
        
        // Right resize handle (adjust duration only)
        const rightHandle = new PIXI.Graphics();
        rightHandle.rect(x + width - 4, y, 8, height);
        rightHandle.fill(0xffffff, 0.8);
        rightHandle.stroke({ color: 0x2563eb, width: 2 });
        rightHandle.interactive = true;
        rightHandle.cursor = 'ew-resize';
        
        // Left handle resize logic
        let isResizingLeft = false;
        let resizeStartX = 0;
        let resizeStartTime = 0;
        let resizeStartDuration = 0;
        
        // Global pointer move handler for left resize
        const handleLeftResize = (event: PointerEvent) => {
          if (!isResizingLeft) return;
          
          // Convert clientX to global coordinate for consistency with PIXI
          const canvas = this.canvas;
          const rect = canvas.getBoundingClientRect();
          const globalX = event.clientX - rect.left;
          const deltaX = globalX - resizeStartX;
          const deltaTime = deltaX / sceneState.timeline.pixelsPerBeat;
          
          // Calculate new start time and duration
          const newStartTime = Math.max(0, resizeStartTime + deltaTime);
          const maxStartTime = resizeStartTime + resizeStartDuration - 0.25; // Minimum 0.25 beat duration
          const clampedStartTime = Math.min(newStartTime, maxStartTime);
          const newDuration = resizeStartDuration - (clampedStartTime - resizeStartTime);
          
          // Snap to grid if enabled
          const snappedStartTime = sceneState.timeline.snapToGrid 
            ? Math.round(clampedStartTime / sceneState.timeline.gridResolution) * sceneState.timeline.gridResolution
            : clampedStartTime;
          const snappedDuration = resizeStartTime + resizeStartDuration - snappedStartTime;
          
          if (this.onInteractionCallback) {
            this.onInteractionCallback({
              type: 'clip-resize',
              payload: { 
                clipId: clip.id,
                newStartTime: snappedStartTime,
                newDuration: snappedDuration,
                resizeHandle: 'start',
                isPreview: true
              },
              timestamp: Date.now()
            });
          }
        };
        
        // Global pointer up handler for left resize
        const handleLeftResizeEnd = (event: PointerEvent) => {
          if (!isResizingLeft) return;
          
          isResizingLeft = false;
          leftHandle.cursor = 'ew-resize';
          
          // Remove global listeners
          document.removeEventListener('pointermove', handleLeftResize);
          document.removeEventListener('pointerup', handleLeftResizeEnd);
          
          // Convert clientX to global coordinate for consistency with PIXI
          const canvas = this.canvas;
          const rect = canvas.getBoundingClientRect();
          const globalX = event.clientX - rect.left;
          const deltaX = globalX - resizeStartX;
          const deltaTime = deltaX / sceneState.timeline.pixelsPerBeat;
          
          const newStartTime = Math.max(0, resizeStartTime + deltaTime);
          const maxStartTime = resizeStartTime + resizeStartDuration - 0.25;
          const clampedStartTime = Math.min(newStartTime, maxStartTime);
          const newDuration = resizeStartDuration - (clampedStartTime - resizeStartTime);
          
          const snappedStartTime = sceneState.timeline.snapToGrid 
            ? Math.round(clampedStartTime / sceneState.timeline.gridResolution) * sceneState.timeline.gridResolution
            : clampedStartTime;
          const snappedDuration = resizeStartTime + resizeStartDuration - snappedStartTime;
          
          if (Math.abs(snappedStartTime - clip.startTime) > 0.001 || Math.abs(snappedDuration - clip.duration) > 0.001) {
            console.log(`🔧 Resizing clip ${clip.id} start: ${clip.startTime} -> ${snappedStartTime}, duration: ${clip.duration} -> ${snappedDuration}`);
            
            if (this.onInteractionCallback) {
              this.onInteractionCallback({
                type: 'clip-resize',
                payload: { 
                  clipId: clip.id,
                  newStartTime: snappedStartTime,
                  newDuration: snappedDuration,
                  resizeHandle: 'start',
                  isPreview: false
                },
                timestamp: Date.now()
              });
            }
          }
        };
        
        leftHandle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
          console.log('🔧 Left resize handle clicked:', clip.id);
          event.stopPropagation();
          
          isResizingLeft = true;
          resizeStartX = event.global.x; // Keep using global for consistency with PIXI coordinate system
          resizeStartTime = clip.startTime;
          resizeStartDuration = clip.duration;
          
          leftHandle.cursor = 'ew-resize';
          
          // Add global listeners for smooth dragging
          document.addEventListener('pointermove', handleLeftResize);
          document.addEventListener('pointerup', handleLeftResizeEnd);
        });
        
        // Right handle resize logic
        let isResizingRight = false;
        
        // Global pointer move handler for right resize
        const handleRightResize = (event: PointerEvent) => {
          if (!isResizingRight) return;
          
          // Convert clientX to global coordinate for consistency with PIXI
          const canvas = this.canvas;
          const rect = canvas.getBoundingClientRect();
          const globalX = event.clientX - rect.left;
          const deltaX = globalX - resizeStartX;
          const deltaTime = deltaX / sceneState.timeline.pixelsPerBeat;
          const newDuration = Math.max(0.25, resizeStartDuration + deltaTime); // Minimum 0.25 beat duration
          
          // Snap to grid if enabled
          const snappedDuration = sceneState.timeline.snapToGrid 
            ? Math.round(newDuration / sceneState.timeline.gridResolution) * sceneState.timeline.gridResolution
            : newDuration;
          
          if (this.onInteractionCallback) {
            this.onInteractionCallback({
              type: 'clip-resize',
              payload: { 
                clipId: clip.id,
                newStartTime: clip.startTime, // Start time doesn't change for right handle
                newDuration: snappedDuration,
                resizeHandle: 'end',
                isPreview: true
              },
              timestamp: Date.now()
            });
          }
        };
        
        // Global pointer up handler for right resize
        const handleRightResizeEnd = (event: PointerEvent) => {
          if (!isResizingRight) return;
          
          isResizingRight = false;
          rightHandle.cursor = 'ew-resize';
          
          // Remove global listeners
          document.removeEventListener('pointermove', handleRightResize);
          document.removeEventListener('pointerup', handleRightResizeEnd);
          
          // Convert clientX to global coordinate for consistency with PIXI
          const canvas = this.canvas;
          const rect = canvas.getBoundingClientRect();
          const globalX = event.clientX - rect.left;
          const deltaX = globalX - resizeStartX;
          const deltaTime = deltaX / sceneState.timeline.pixelsPerBeat;
          const newDuration = Math.max(0.25, resizeStartDuration + deltaTime);
          
          const snappedDuration = sceneState.timeline.snapToGrid 
            ? Math.round(newDuration / sceneState.timeline.gridResolution) * sceneState.timeline.gridResolution
            : newDuration;
          
          if (Math.abs(snappedDuration - clip.duration) > 0.001) {
            console.log(`🔧 Resizing clip ${clip.id} duration: ${clip.duration} -> ${snappedDuration}`);
            
            if (this.onInteractionCallback) {
              this.onInteractionCallback({
                type: 'clip-resize',
                payload: { 
                  clipId: clip.id,
                  newStartTime: clip.startTime,
                  newDuration: snappedDuration,
                  resizeHandle: 'end',
                  isPreview: false
                },
                timestamp: Date.now()
              });
            }
          }
        };
        
        rightHandle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
          console.log('🔧 Right resize handle clicked:', clip.id);
          event.stopPropagation();
          
          isResizingRight = true;
          resizeStartX = event.global.x; // Keep using global for consistency with PIXI coordinate system
          resizeStartDuration = clip.duration;
          
          rightHandle.cursor = 'ew-resize';
          
          // Add global listeners for smooth dragging
          document.addEventListener('pointermove', handleRightResize);
          document.addEventListener('pointerup', handleRightResizeEnd);
        });
        
        clipContainer.addChild(leftHandle);
        clipContainer.addChild(rightHandle);
      }

      // Clip label
      const clipLabel = new PIXI.Text({
        text: clip.name,
        style: {
          fontSize: 10,
          fill: 0xffffff,
          fontFamily: 'Arial'
        }
      });
      clipLabel.position.set(x + 5, y + 5);
      clipContainer.addChild(clipLabel);

      // Add waveform if available and should render
      if (clip.audioData && !sceneState.shouldRedrawWaveforms) {
        this.addWaveform(clipContainer, clip.audioData, x, y + 20, width, 20);
      }
    }

    this.layers.clips.addChild(clipContainer);
    this.cache.clips.set(clip.id, clipContainer);
    
    console.log('SimpleDAWRenderer: Updated clip', clip.id, 'with interaction and resize handles enabled');
  }

  private addWaveform(container: PIXI.Container, audioData: any, x: number, y: number, width: number, height: number): void {
    if (!audioData.waveformPoints || audioData.waveformPoints.length === 0) return;

    const waveform = new PIXI.Graphics();
    const points = audioData.waveformPoints;
    const stepX = width / points.length;
    const centerY = y + height / 2;

    waveform.moveTo(x, centerY);
    
    for (let i = 0; i < points.length; i++) {
      const pointX = x + i * stepX;
      const pointY = centerY + (points[i] * height / 4);
      waveform.lineTo(pointX, pointY);
    }
    
    waveform.stroke({ color: 0x00ff00, width: 1, alpha: 0.7 });
    container.addChild(waveform);
  }

  private updatePlayhead(sceneState: DAWSceneState): void {
    if (!this.app || !this.layers) return;

    console.log('🎯 SimpleDAWRenderer: updatePlayhead called:', {
      currentTime: sceneState.playhead.currentTime,
      isVisible: sceneState.playhead.isVisible,
      isPlaying: sceneState.playhead.isPlaying,
      pixelsPerBeat: sceneState.timeline.pixelsPerBeat,
      scrollX: sceneState.timeline.scrollX
    });

    // Remove old playhead
    if (this.cache.playhead) {
      this.layers.playhead.removeChild(this.cache.playhead);
      this.cache.playhead.destroy();
      console.log('🎯 SimpleDAWRenderer: Old playhead removed');
    }

    if (!sceneState.playhead.isVisible) {
      console.log('🎯 SimpleDAWRenderer: Playhead not visible, skipping render');
      return;
    }

    // Calculate dynamic height based on content
    const headerHeight = 50; // Time ruler height
    const trackHeight = 80;
    const totalHeight = Math.max(
      sceneState.viewport.height,
      headerHeight + (sceneState.tracks.length * trackHeight) + 100 // Add extra space
    );

    // Create new playhead
    const playhead = new PIXI.Graphics();
    const x = (sceneState.playhead.currentTime * sceneState.timeline.pixelsPerBeat) - sceneState.timeline.scrollX;
      const color = parseInt(sceneState.playhead.color.replace('#', ''), 16);
    
    console.log('🎯 SimpleDAWRenderer: Playhead position calculated:', {
      x: x,
      calculation: `(${sceneState.playhead.currentTime} * ${sceneState.timeline.pixelsPerBeat}) - ${sceneState.timeline.scrollX}`,
      totalHeight: totalHeight,
      color: sceneState.playhead.color
    });
    
    playhead.moveTo(x, 0);
    playhead.lineTo(x, totalHeight);
    playhead.stroke({ color, width: 2, alpha: 0.8 });
    
    // Add playhead triangle at top
    const triangle = new PIXI.Graphics();
    triangle.poly([x-5, 0, x+5, 0, x, 10]);
    triangle.fill(color);
    playhead.addChild(triangle);

    this.layers.playhead.addChild(playhead);
    this.cache.playhead = playhead;
    
    console.log('🎯 SimpleDAWRenderer: Playhead updated successfully');
  }

  private handleBackgroundPointerDown(event: PIXI.FederatedPointerEvent, sceneState: DAWSceneState): void {
    console.log('🖱️ Background pointerdown detected:', {
      globalX: event.global.x,
      globalY: event.global.y,
      localX: event.client.x,
      localY: event.client.y,
      scrollX: sceneState.timeline.scrollX,
      pixelsPerBeat: sceneState.timeline.pixelsPerBeat
    });
    
    // Start dragging
    this.isDragging = true;
    this.dragStartX = event.global.x;
    
    if (this.onInteractionCallback) {
      const point = event.global;
      const time = Math.max(0, (point.x + sceneState.timeline.scrollX) / sceneState.timeline.pixelsPerBeat);
      this.lastDragTime = time;
      
      console.log('🎯 Timeline scrub start at time:', time, 'beats');
      
      this.onInteractionCallback({
        type: 'timeline-scrub-start',
        payload: { time, x: point.x, y: point.y },
        timestamp: Date.now()
      });
    } else {
      console.warn('⚠️ No interaction callback set for timeline scrub');
    }
  }

  private handleBackgroundPointerMove(event: PIXI.FederatedPointerEvent, sceneState: DAWSceneState): void {
    if (!this.isDragging || !this.onInteractionCallback) return;
    
    const point = event.global;
    const time = Math.max(0, (point.x + sceneState.timeline.scrollX) / sceneState.timeline.pixelsPerBeat);
    
    // Only update if time has changed significantly (prevents too many updates)
    if (Math.abs(time - this.lastDragTime) > 0.01) {
      this.lastDragTime = time;
      
      console.log('🎯 Timeline scrubbing to time:', time, 'beats');
      
      this.onInteractionCallback({
        type: 'timeline-scrub',
        payload: { time, x: point.x, y: point.y },
        timestamp: Date.now()
      });
    }
  }

  private handleBackgroundPointerUp(event: PIXI.FederatedPointerEvent, sceneState: DAWSceneState): void {
    if (!this.isDragging) return;
    
    console.log('🖱️ Background pointerup - ending scrub');
    
    this.isDragging = false;
    this.dragStartX = 0;
    
    if (this.onInteractionCallback) {
      const point = event.global;
      const time = Math.max(0, (point.x + sceneState.timeline.scrollX) / sceneState.timeline.pixelsPerBeat);
      
      console.log('🎯 Timeline scrub end at time:', time, 'beats');
      
      this.onInteractionCallback({
        type: 'timeline-scrub-end',
        payload: { time, x: point.x, y: point.y },
        timestamp: Date.now()
      });
    }
  }

  private handleBackgroundClick(event: PIXI.FederatedPointerEvent, sceneState: DAWSceneState): void {
    console.log('🖱️ Background click detected:', {
      globalX: event.global.x,
      globalY: event.global.y,
      localX: event.client.x,
      localY: event.client.y,
      scrollX: sceneState.timeline.scrollX,
      pixelsPerBeat: sceneState.timeline.pixelsPerBeat
    });
    
      if (this.onInteractionCallback) {
        const point = event.global;
      const time = Math.max(0, (point.x + sceneState.timeline.scrollX) / sceneState.timeline.pixelsPerBeat);
      
      console.log('🎯 Calculated time:', time, 'beats');
        
        this.onInteractionCallback({
          type: 'timeline-click',
          payload: { time, x: point.x, y: point.y },
          timestamp: Date.now()
        });
    } else {
      console.warn('⚠️ No interaction callback set for background click');
      }
  }

  public setInteractionCallback(callback: (event: DAWInteractionEvent) => void): void {
    this.onInteractionCallback = callback;
  }

  public resize(width: number, height: number): void {
    if (this.isInitialized && this.app && !this.isDestroyed) {
      console.log(`SimpleDAWRenderer: Resizing to ${width}x${height}`);
      
      this.app.renderer.resize(width, height);
      
      const dpr = window.devicePixelRatio || 1;
      this.app.canvas.width = width * dpr;
      this.app.canvas.height = height * dpr;
      this.app.canvas.style.width = `${width}px`;
      this.app.canvas.style.height = `${height}px`;
      
      // Update PIXI app screen size for interactions
      this.app.screen.width = width;
      this.app.screen.height = height;
      
      console.log(`SimpleDAWRenderer: Canvas resized to ${width}x${height}, screen: ${this.app.screen.width}x${this.app.screen.height}`);
      
      // Force re-render after resize
      if (this.lastSceneState) {
        this.updateScene(this.lastSceneState);
      }
    }
  }

  /**
   * Optimized cleanup with proper memory management
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.isInitialized = false;

    // Cancel pending renders
    if (this.renderFrameId) {
      cancelAnimationFrame(this.renderFrameId);
      this.renderFrameId = null;
    }

    // Cleanup cache
    this.cache.tracks.forEach(container => container.destroy({ children: true }));
    this.cache.clips.forEach(container => container.destroy({ children: true }));
    
    if (this.cache.grid) this.cache.grid.destroy();
    if (this.cache.playhead) this.cache.playhead.destroy();
    if (this.cache.background) this.cache.background.destroy();

    this.cache.tracks.clear();
    this.cache.clips.clear();
    this.cache.grid = null;
    this.cache.playhead = null;
    this.cache.background = null;

    // Destroy PIXI app
    if (this.app) {
      try {
      this.app.destroy(true);
      } catch (error) {
        console.warn('Error destroying PIXI Application:', error);
      } finally {
      this.app = null;
    }
    }

    console.log('SimpleDAWRenderer: Destroyed with complete cleanup');
  }

  public getApp(): PIXI.Application | null {
    return this.app;
  }

  // Object pooling methods for better performance
  private getPooledGraphics(): PIXI.Graphics {
    return this.objectPool.graphics.pop() || new PIXI.Graphics();
  }

  private getPooledContainer(): PIXI.Container {
    return this.objectPool.containers.pop() || new PIXI.Container();
  }

  private getPooledText(text: string, style?: any): PIXI.Text {
    const pooledText = this.objectPool.texts.pop() || new PIXI.Text();
    pooledText.text = text;
    if (style) pooledText.style = style;
    return pooledText;
  }

  private returnToPool(obj: PIXI.Graphics | PIXI.Container | PIXI.Text): void {
    // Reset object state
    obj.removeFromParent();
    if (obj instanceof PIXI.Graphics) {
      obj.clear();
    }
    
    // Return to appropriate pool
    if (obj instanceof PIXI.Graphics) {
      this.objectPool.graphics.push(obj);
    } else if (obj instanceof PIXI.Text) {
      this.objectPool.texts.push(obj);
    } else if (obj instanceof PIXI.Container) {
      this.objectPool.containers.push(obj);
    }

    // Limit pool size to prevent memory bloat
    const maxPoolSize = 50;
    Object.values(this.objectPool).forEach(pool => {
      if (pool.length > maxPoolSize) {
        const excess = pool.splice(maxPoolSize);
        excess.forEach(obj => obj.destroy?.());
      }
    });
  }

  // Viewport culling for better performance
  private isObjectVisible(x: number, y: number, width: number, height: number, sceneState: DAWSceneState): boolean {
    if (!this.viewportCulling) return true;
    
    const { scrollX, scrollY } = sceneState.timeline;
    const viewWidth = sceneState.viewport.width;
    const viewHeight = sceneState.viewport.height;
    
    // Add buffer for smooth scrolling
    const buffer = 100;
    
    return !(x + width < scrollX - buffer || 
             x > scrollX + viewWidth + buffer ||
             y + height < scrollY - buffer || 
             y > scrollY + viewHeight + buffer);
  }
} 