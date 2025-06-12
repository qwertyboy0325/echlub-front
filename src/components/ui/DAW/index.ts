// Main components
export { PixiHostComponent } from './PixiHostComponent';
export { DAWComponent } from './DAWComponent';

// Core classes (for advanced usage)
export { PixiRenderer } from './PixiRenderer';
export { DAWSceneGraph } from './DAWSceneGraph';
export { DAWInteractionManager } from './DAWInteractionManager';
export { PerformanceMonitor } from './PerformanceMonitor';
export { SceneDiffer } from './SceneDiffer';

// Types
export * from './types';

// Utility functions
export const createEmptySceneState = () => ({
  viewport: {
    width: 1200,
    height: 600,
    resolution: 1,
    devicePixelRatio: window.devicePixelRatio || 1
  },
  timeline: {
    scrollX: 0,
    scrollY: 0,
    pixelsPerBeat: 100,
    beatsPerMeasure: 4,
    snapToGrid: true,
    gridResolution: 0.25,
    visibleTimeRange: {
      start: 0,
      end: 10
    }
  },
  tracks: [],
  clips: [],
  playhead: {
    currentTime: 0,
    isVisible: true,
    isPlaying: false,
    color: '#ffffff'
  },
  selection: {
    clips: [],
    tracks: []
  },
  tools: {
    activeTool: 'select' as const,
    toolSettings: {}
  },
  collaborators: [],
  markers: [],
  regions: [],
  shouldRedrawWaveforms: false,
  shouldRedrawGrid: false,
  lastUpdateTimestamp: Date.now()
}); 