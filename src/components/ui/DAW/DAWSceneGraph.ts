import * as PIXI from 'pixi.js';
import { 
  SceneViewport, 
  SceneTimeline, 
  SceneTrack, 
  SceneClip, 
  ScenePlayhead, 
  SceneSelection,
  SceneCollaborator
} from './types';

export class DAWSceneGraph {
  private app: PIXI.Application;
  private containers!: {
    background: PIXI.Container;
    grid: PIXI.Container;
    tracks: PIXI.Container;
    clips: PIXI.Container;
    playhead: PIXI.Container;
    selection: PIXI.Container;
    collaborators: PIXI.Container;
    ui: PIXI.Container;
  };
  
  private trackObjects: Map<string, PIXI.Container> = new Map();
  private clipObjects: Map<string, PIXI.Container> = new Map();
  private playheadLine: PIXI.Graphics | null = null;
  private gridGraphics: PIXI.Graphics | null = null;
  private performanceMode = false;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.setupContainers();
  }

  private setupContainers(): void {
    // Create hierarchical container structure
    this.containers = {
      background: new PIXI.Container(),
      grid: new PIXI.Container(),
      tracks: new PIXI.Container(),
      clips: new PIXI.Container(),
      playhead: new PIXI.Container(),
      selection: new PIXI.Container(),
      collaborators: new PIXI.Container(),
      ui: new PIXI.Container()
    };

    // Add containers to stage in correct order (back to front)
    this.app.stage.addChild(this.containers.background);
    this.app.stage.addChild(this.containers.grid);
    this.app.stage.addChild(this.containers.tracks);
    this.app.stage.addChild(this.containers.clips);
    this.app.stage.addChild(this.containers.selection);
    this.app.stage.addChild(this.containers.playhead);
    this.app.stage.addChild(this.containers.collaborators);
    this.app.stage.addChild(this.containers.ui);

    // Create initial background
    this.createBackground();
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a1a); // Dark background
    bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.endFill();
    this.containers.background.addChild(bg);
  }

  public updateViewport(diff: Partial<SceneViewport>, fullViewport: SceneViewport): void {
    // Handle viewport changes like zoom and scroll
    if (diff.width !== undefined || diff.height !== undefined) {
      this.handleResize(fullViewport.width, fullViewport.height);
    }

    if (diff.resolution !== undefined) {
      // Update resolution if needed
      this.updateResolution(diff.resolution);
    }
  }

  public updateTimeline(diff: Partial<SceneTimeline>, fullTimeline: SceneTimeline): void {
    // Update timeline-related graphics
    if (diff.scrollX !== undefined || diff.scrollY !== undefined) {
      this.updateScroll(fullTimeline.scrollX, fullTimeline.scrollY);
    }

    if (diff.pixelsPerBeat !== undefined || diff.gridResolution !== undefined) {
      this.redrawGrid();
    }
  }

  public updateTracks(diff: any, fullTracks: SceneTrack[]): void {
    // Handle added tracks
    diff.added.forEach((track: SceneTrack) => {
      this.createTrack(track);
    });

    // Handle removed tracks
    diff.removed.forEach((trackId: string) => {
      this.removeTrack(trackId);
    });

    // Handle updated tracks
    diff.updated.forEach((update: any) => {
      this.updateTrack(update.id, update.changes);
    });
  }

  public updateClips(diff: any, fullClips: SceneClip[]): void {
    // Handle added clips
    diff.added.forEach((clip: SceneClip) => {
      this.createClip(clip);
    });

    // Handle removed clips
    diff.removed.forEach((clipId: string) => {
      this.removeClip(clipId);
    });

    // Handle updated clips
    diff.updated.forEach((update: any) => {
      this.updateClip(update.id, update.changes);
    });
  }

  public updatePlayhead(diff: Partial<ScenePlayhead>, fullPlayhead: ScenePlayhead): void {
    if (!this.playheadLine) {
      this.createPlayhead(fullPlayhead);
    } else {
      this.updatePlayheadPosition(fullPlayhead);
    }
  }

  public updateSelection(diff: Partial<SceneSelection>, fullSelection: SceneSelection): void {
    this.clearSelection();
    this.drawSelection(fullSelection);
  }

  public updateCollaborators(diff: any, fullCollaborators: SceneCollaborator[]): void {
    // Handle collaborator cursors and presence indicators
    diff.added.forEach((collaborator: SceneCollaborator) => {
      this.createCollaboratorCursor(collaborator);
    });

    diff.removed.forEach((collaboratorId: string) => {
      this.removeCollaboratorCursor(collaboratorId);
    });

    diff.updated.forEach((update: any) => {
      this.updateCollaboratorCursor(update.id, update.changes);
    });
  }

  private createTrack(track: SceneTrack): void {
    const trackContainer = new PIXI.Container();
    
    // Track background
    const trackBg = new PIXI.Graphics();
    trackBg.beginFill(0x2a2a2a);
    trackBg.drawRect(0, track.yPosition, this.app.screen.width, track.height);
    trackBg.endFill();
    trackContainer.addChild(trackBg);

    // Track label
    const trackLabel = new PIXI.Text(track.name, {
      fontSize: 14,
      fill: track.color,
      fontFamily: 'Arial'
    });
    trackLabel.position.set(10, track.yPosition + 10);
    trackContainer.addChild(trackLabel);

    // Make track interactive
    trackContainer.eventMode = 'static';
    (trackContainer as any).dawData = {
      type: 'track',
      id: track.id
    };

    this.trackObjects.set(track.id, trackContainer);
    this.containers.tracks.addChild(trackContainer);
  }

  private createClip(clip: SceneClip): void {
    const clipContainer = new PIXI.Container();
    
    // Find the track to get Y position
    const trackContainer = this.trackObjects.get(clip.trackId);
    if (!trackContainer) return;

    // Calculate clip position and size
    const clipX = clip.startTime * 100; // Simplified: 100 pixels per time unit
    const clipWidth = clip.duration * 100;
    const clipHeight = 60; // Standard clip height
    const clipY = 0; // Relative to track

    // Clip background
    const clipBg = new PIXI.Graphics();
    clipBg.beginFill(this.parseColor(clip.color));
    clipBg.drawRoundedRect(clipX, clipY, clipWidth, clipHeight, 5);
    clipBg.endFill();

    // Clip selection outline
    if (clip.isSelected) {
      clipBg.lineStyle(2, 0xffffff);
      clipBg.drawRoundedRect(clipX, clipY, clipWidth, clipHeight, 5);
    }

    clipContainer.addChild(clipBg);

    // Clip label
    const clipLabel = new PIXI.Text(clip.name, {
      fontSize: 12,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    clipLabel.position.set(clipX + 5, clipY + 5);
    clipContainer.addChild(clipLabel);

    // Waveform visualization (if audio data available)
    if (clip.audioData) {
      this.drawWaveform(clipContainer, clip.audioData, clipX, clipY, clipWidth, clipHeight);
    }

    // Make clip interactive
    clipContainer.eventMode = 'static';
    (clipContainer as any).dawData = {
      type: 'clip',
      id: clip.id
    };

    this.clipObjects.set(clip.id, clipContainer);
    this.containers.clips.addChild(clipContainer);
  }

  private drawWaveform(container: PIXI.Container, audioData: any, x: number, y: number, width: number, height: number): void {
    if (!audioData.waveformPoints || audioData.waveformPoints.length === 0) return;

    const waveform = new PIXI.Graphics();
    waveform.lineStyle(1, 0x00ff00, 0.7);

    const points = audioData.waveformPoints;
    const stepX = width / points.length;
    const centerY = y + height / 2;

    waveform.moveTo(x, centerY);
    
    for (let i = 0; i < points.length; i++) {
      const pointX = x + i * stepX;
      const pointY = centerY + (points[i] * height / 4); // Scale waveform
      waveform.lineTo(pointX, pointY);
    }

    container.addChild(waveform);
  }

  private createPlayhead(playhead: ScenePlayhead): void {
    if (!playhead.isVisible) return;

    this.playheadLine = new PIXI.Graphics();
    this.updatePlayheadPosition(playhead);
    
    // Make playhead interactive
    this.playheadLine.eventMode = 'static';
    (this.playheadLine as any).dawData = {
      type: 'playhead',
      timePosition: playhead.currentTime
    };

    this.containers.playhead.addChild(this.playheadLine);
  }

  private updatePlayheadPosition(playhead: ScenePlayhead): void {
    if (!this.playheadLine) return;

    this.playheadLine.clear();
    this.playheadLine.lineStyle(2, this.parseColor(playhead.color));
    
    const x = playhead.currentTime * 100; // Simplified positioning
    this.playheadLine.moveTo(x, 0);
    this.playheadLine.lineTo(x, this.app.screen.height);
  }

  private clearSelection(): void {
    this.containers.selection.removeChildren();
  }

  private drawSelection(selection: SceneSelection): void {
    // Draw selection rectangles around selected clips
    selection.clips.forEach(clipId => {
      const clipContainer = this.clipObjects.get(clipId);
      if (clipContainer) {
        const selectionOutline = new PIXI.Graphics();
        selectionOutline.lineStyle(2, 0xffffff);
        selectionOutline.drawRect(
          clipContainer.x - 2,
          clipContainer.y - 2,
          clipContainer.width + 4,
          clipContainer.height + 4
        );
        this.containers.selection.addChild(selectionOutline);
      }
    });
  }

  private createCollaboratorCursor(collaborator: SceneCollaborator): void {
    if (!collaborator.cursor?.isVisible) return;

    const cursor = new PIXI.Graphics();
    cursor.beginFill(this.parseColor(collaborator.color));
    cursor.drawCircle(0, 0, 5);
    cursor.endFill();

    cursor.position.set(collaborator.cursor.x, collaborator.cursor.y);
    this.containers.collaborators.addChild(cursor);
  }

  private removeTrack(trackId: string): void {
    const track = this.trackObjects.get(trackId);
    if (track) {
      this.containers.tracks.removeChild(track);
      this.trackObjects.delete(trackId);
    }
  }

  private removeClip(clipId: string): void {
    const clip = this.clipObjects.get(clipId);
    if (clip) {
      this.containers.clips.removeChild(clip);
      this.clipObjects.delete(clipId);
    }
  }

  private updateTrack(trackId: string, changes: Partial<SceneTrack>): void {
    // Update track properties
    const track = this.trackObjects.get(trackId);
    if (track) {
      // Update visual properties based on changes
      // This would involve updating the track's visual elements
    }
  }

  private updateClip(clipId: string, changes: Partial<SceneClip>): void {
    // Update clip properties
    const clip = this.clipObjects.get(clipId);
    if (clip) {
      // Update visual properties based on changes
      // This would involve redrawing the clip
    }
  }

  private updateCollaboratorCursor(collaboratorId: string, changes: any): void {
    // Update collaborator cursor position and appearance
  }

  private removeCollaboratorCursor(collaboratorId: string): void {
    // Remove collaborator cursor
  }

  private updateScroll(scrollX: number, scrollY: number): void {
    // Apply scroll offset to scrollable containers
    this.containers.tracks.position.set(-scrollX, -scrollY);
    this.containers.clips.position.set(-scrollX, -scrollY);
    this.containers.grid.position.set(-scrollX, -scrollY);
  }

  private updateResolution(resolution: number): void {
    // Update display resolution
  }

  public redrawGrid(): void {
    if (this.gridGraphics) {
      this.containers.grid.removeChild(this.gridGraphics);
    }

    this.gridGraphics = new PIXI.Graphics();
    this.gridGraphics.lineStyle(1, 0x333333, 0.5);

    // Draw vertical grid lines (time divisions)
    const gridSpacing = 100; // Pixels between grid lines
    for (let x = 0; x < this.app.screen.width; x += gridSpacing) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, this.app.screen.height);
    }

    // Draw horizontal grid lines (track divisions)
    const trackHeight = 80;
    for (let y = 0; y < this.app.screen.height; y += trackHeight) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(this.app.screen.width, y);
    }

    this.containers.grid.addChild(this.gridGraphics);
  }

  public redrawWaveforms(): void {
    // Redraw all waveforms (expensive operation)
    this.clipObjects.forEach(clipContainer => {
      // Redraw waveform for each clip
    });
  }

  private parseColor(colorString: string): number {
    if (colorString.startsWith('#')) {
      return parseInt(colorString.substring(1), 16);
    }
    return 0xffffff; // Default white
  }

  public handleResize(width: number, height: number): void {
    // Update background size
    this.containers.background.removeChildren();
    this.createBackground();
    
    // Update other size-dependent elements
    this.redrawGrid();
  }

  public setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;
    
    // Adjust rendering quality based on performance mode
    if (enabled) {
      // Reduce visual quality for better performance
      this.containers.clips.alpha = 0.8;
    } else {
      this.containers.clips.alpha = 1.0;
    }
  }

  public update(): void {
    // Update any animated elements
  }

  public clear(): void {
    // Clear all containers
    Object.values(this.containers).forEach(container => {
      container.removeChildren();
    });
    
    // Clear object maps
    this.trackObjects.clear();
    this.clipObjects.clear();
    this.playheadLine = null;
    this.gridGraphics = null;
  }

  public destroy(): void {
    this.clear();
    
    // Remove containers from stage
    Object.values(this.containers).forEach(container => {
      this.app.stage.removeChild(container);
    });
  }
} 