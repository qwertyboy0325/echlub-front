// DAW Scene State Types
export interface SceneViewport {
  width: number;
  height: number;
  resolution: number;
  devicePixelRatio: number;
}

export interface SceneTimeline {
  scrollX: number;
  scrollY: number;
  pixelsPerBeat: number;
  beatsPerMeasure: number;
  snapToGrid: boolean;
  gridResolution: number;
  visibleTimeRange: {
    start: number;
    end: number;
  };
}

export interface SceneTrack {
  id: string;
  name: string;
  yPosition: number;
  height: number;
  color: string;
  isMuted: boolean;
  isSoloed: boolean;
  isSelected: boolean;
  volume: number;
  isCollapsed: boolean;
  collaborators: SceneCollaborator[];
}

export interface SceneClip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  duration: number;
  color: string;
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  audioData?: {
    waveformPoints: number[];
    peaks: number[];
  };
  collaboratorCursors: SceneCollaboratorCursor[];
}

export interface ScenePlayhead {
  currentTime: number;
  isVisible: boolean;
  isPlaying: boolean;
  color: string;
}

export interface SceneCollaborator {
  id: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    isVisible: boolean;
  };
}

export interface SceneCollaboratorCursor {
  collaboratorId: string;
  position: number;
  isActive: boolean;
}

export interface SceneSelection {
  clips: string[];
  tracks: string[];
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface SceneTools {
  activeTool: 'select' | 'cut' | 'draw' | 'erase' | 'zoom';
  toolSettings: Record<string, any>;
}

export interface SceneMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  isVisible: boolean;
}

export interface SceneRegion {
  id: string;
  startTime: number;
  endTime: number;
  trackIds: string[];
  color: string;
  opacity: number;
  label?: string;
}

export interface DAWSceneState {
  viewport: SceneViewport;
  timeline: SceneTimeline;
  tracks: SceneTrack[];
  clips: SceneClip[];
  playhead: ScenePlayhead;
  selection: SceneSelection;
  tools: SceneTools;
  collaborators: SceneCollaborator[];
  markers: SceneMarker[];
  regions: SceneRegion[];
  // Performance optimization flags
  shouldRedrawWaveforms: boolean;
  shouldRedrawGrid: boolean;
  lastUpdateTimestamp: number;
}

// Interaction Event Types
export type DAWInteractionType =
  | 'CLIP_SELECTED'
  | 'CLIP_DESELECTED'
  | 'CLIP_MOVED'
  | 'CLIP_RESIZED'
  | 'CLIP_DOUBLE_CLICKED'
  | 'TRACK_SELECTED'
  | 'TRACK_HEADER_CLICKED'
  | 'TIMELINE_SCRUBBED'
  | 'PLAYHEAD_DRAGGED'
  | 'CANVAS_CLICKED'
  | 'CANVAS_RIGHT_CLICKED'
  | 'SELECTION_CHANGED'
  | 'VIEWPORT_CHANGED'
  | 'ZOOM_CHANGED'
  | 'SCROLL_CHANGED'
  | 'COLLABORATOR_CURSOR_MOVED';

export interface DAWInteractionEvent {
  type: DAWInteractionType;
  timestamp: number;
  payload: {
    clipId?: string;
    trackId?: string;
    position?: { x: number; y: number };
    timePosition?: number;
    modifiers?: {
      shift: boolean;
      ctrl: boolean;
      alt: boolean;
      meta: boolean;
    };
    collaboratorId?: string;
    [key: string]: any;
  };
}

// Specific event payload interfaces
export interface ClipMovedPayload {
  clipId: string;
  oldTrackId: string;
  newTrackId: string;
  oldStartTime: number;
  newStartTime: number;
  isSnappedToGrid: boolean;
}

export interface ClipResizedPayload {
  clipId: string;
  newDuration: number;
  resizeHandle: 'start' | 'end';
  isSnappedToGrid: boolean;
}

export interface ViewportChangedPayload {
  scrollX: number;
  scrollY: number;
  zoomLevel: number;
  visibleTimeRange: {
    start: number;
    end: number;
  };
}

// Renderer Configuration
export interface PixiRendererConfig {
  canvas: HTMLCanvasElement;
  backgroundColor: number;
  antialias: boolean;
  preserveDrawingBuffer: boolean;
  powerPreference: 'high-performance' | 'low-power' | 'default';
}

export interface PixiRendererOptions {
  enableDebugMode: boolean;
  maxFPS: number;
  enableWaveformCaching: boolean;
  enableCollaboratorCursors: boolean;
}

// Performance Monitoring
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  totalObjects: number;
  memoryUsage: number;
  lastUpdateTime: number;
}

// Scene Diffing
export interface SceneDiff {
  viewport?: Partial<SceneViewport>;
  timeline?: Partial<SceneTimeline>;
  tracks?: {
    added: SceneTrack[];
    removed: string[];
    updated: { id: string; changes: Partial<SceneTrack> }[];
  };
  clips?: {
    added: SceneClip[];
    removed: string[];
    updated: { id: string; changes: Partial<SceneClip> }[];
  };
  playhead?: Partial<ScenePlayhead>;
  selection?: Partial<SceneSelection>;
  collaborators?: {
    added: SceneCollaborator[];
    removed: string[];
    updated: { id: string; changes: Partial<SceneCollaborator> }[];
  };
  shouldRedrawWaveforms?: boolean;
  shouldRedrawGrid?: boolean;
} 