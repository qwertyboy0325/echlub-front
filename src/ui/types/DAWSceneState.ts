/**
 * DAW Scene State Types
 * Based on the PIXI.js Black-Box Renderer Design
 */

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
  type: 'audio' | 'midi';
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

export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number (0-127)
  velocity: number; // Velocity (0-127)
  startTime: number; // Start time in beats relative to clip
  duration: number; // Duration in beats
  isSelected: boolean;
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
  type?: 'audio' | 'midi';
  audioData?: {
    waveformPoints: number[];
    peaks: number[];
  };
  midiData?: {
    notes: MidiNote[];
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

// Event types for interaction
export interface DAWInteractionEvent {
  type: 'clip-select' | 'clip-move' | 'clip-drag' | 'clip-resize' | 'track-select' | 'timeline-click' | 'timeline-scrub-start' | 'timeline-scrub' | 'timeline-scrub-end' | 'playhead-move';
  payload: any;
  timestamp: number;
}

export interface ClipSelectEvent {
  type: 'clip-select';
  clipId: string;
  isMultiSelect: boolean;
}

export interface ClipMoveEvent {
  type: 'clip-move';
  clipId: string;
  newTrackId: string;
  newStartTime: number;
}

export interface TimelineClickEvent {
  type: 'timeline-click';
  time: number;
  trackId?: string;
}

export interface PlayheadMoveEvent {
  type: 'playhead-move';
  time: number;
} 