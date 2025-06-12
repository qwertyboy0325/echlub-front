import React, { useState, useCallback, useMemo } from 'react';
import { PixiHostComponent } from './PixiHostComponent';
import { 
  DAWSceneState, 
  DAWInteractionEvent, 
  SceneTrack, 
  SceneClip 
} from './types';

// 示例数据生成器
const createSampleSceneState = (): DAWSceneState => {
  const tracks: SceneTrack[] = [
    {
      id: 'track-1',
      name: 'Drums',
      yPosition: 0,
      height: 80,
      color: '#ff6b6b',
      isMuted: false,
      isSoloed: false,
      isSelected: false,
      volume: 1.0,
      isCollapsed: false,
      collaborators: []
    },
    {
      id: 'track-2',
      name: 'Bass',
      yPosition: 80,
      height: 80,
      color: '#4ecdc4',
      isMuted: false,
      isSoloed: false,
      isSelected: false,
      volume: 0.8,
      isCollapsed: false,
      collaborators: []
    },
    {
      id: 'track-3',
      name: 'Guitar',
      yPosition: 160,
      height: 80,
      color: '#45b7d1',
      isMuted: false,
      isSoloed: false,
      isSelected: false,
      volume: 0.9,
      isCollapsed: false,
      collaborators: []
    }
  ];

  const clips: SceneClip[] = [
    {
      id: 'clip-1',
      trackId: 'track-1',
      name: 'Drum Loop 1',
      startTime: 0,
      duration: 4,
      color: '#ff6b6b',
      isSelected: false,
      isDragging: false,
      isResizing: false,
      collaboratorCursors: [],
      audioData: {
        waveformPoints: Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.1) * 0.5),
        peaks: [0.8, 0.6, 0.9, 0.7]
      }
    },
    {
      id: 'clip-2',
      trackId: 'track-2',
      name: 'Bass Line',
      startTime: 1,
      duration: 6,
      color: '#4ecdc4',
      isSelected: false,
      isDragging: false,
      isResizing: false,
      collaboratorCursors: []
    },
    {
      id: 'clip-3',
      trackId: 'track-3',
      name: 'Guitar Riff',
      startTime: 2,
      duration: 3,
      color: '#45b7d1',
      isSelected: false,
      isDragging: false,
      isResizing: false,
      collaboratorCursors: []
    }
  ];

  return {
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
    tracks,
    clips,
    playhead: {
      currentTime: 2.5,
      isVisible: true,
      isPlaying: false,
      color: '#ffffff'
    },
    selection: {
      clips: [],
      tracks: []
    },
    tools: {
      activeTool: 'select',
      toolSettings: {}
    },
    collaborators: [],
    markers: [],
    regions: [],
    shouldRedrawWaveforms: false,
    shouldRedrawGrid: false,
    lastUpdateTimestamp: Date.now()
  };
};

export const DAWComponent: React.FC = () => {
  const [sceneState, setSceneState] = useState<DAWSceneState>(createSampleSceneState());
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle interactions from PIXI.js
  const handleInteraction = useCallback((event: DAWInteractionEvent) => {
    console.log('DAW Interaction:', event);

    switch (event.type) {
      case 'CLIP_SELECTED':
        if (event.payload.clipId) {
          setSceneState(prevState => ({
            ...prevState,
            selection: {
              ...prevState.selection,
              clips: [event.payload.clipId!]
            },
            clips: prevState.clips.map(clip => ({
              ...clip,
              isSelected: clip.id === event.payload.clipId
            }))
          }));
        }
        break;

      case 'PLAYHEAD_DRAGGED':
        if (event.payload.timePosition !== undefined) {
          setSceneState(prevState => ({
            ...prevState,
            playhead: {
              ...prevState.playhead,
              currentTime: event.payload.timePosition!
            }
          }));
        }
        break;

      case 'TIMELINE_SCRUBBED':
        // Toggle play/pause
        setIsPlaying(prev => !prev);
        setSceneState(prevState => ({
          ...prevState,
          playhead: {
            ...prevState.playhead,
            isPlaying: !isPlaying
          }
        }));
        break;

      case 'CANVAS_CLICKED':
        // Clear selection
        setSceneState(prevState => ({
          ...prevState,
          selection: {
            clips: [],
            tracks: []
          },
          clips: prevState.clips.map(clip => ({
            ...clip,
            isSelected: false
          }))
        }));
        break;
    }
  }, [isPlaying]);

  // Control functions
  const playPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    setSceneState(prevState => ({
      ...prevState,
      playhead: {
        ...prevState.playhead,
        isPlaying: !isPlaying
      }
    }));
  }, [isPlaying]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setSceneState(prevState => ({
      ...prevState,
      playhead: {
        ...prevState.playhead,
        currentTime: 0,
        isPlaying: false
      }
    }));
  }, []);

  const addClip = useCallback(() => {
    const newClip: SceneClip = {
      id: `clip-${Date.now()}`,
      trackId: 'track-1',
      name: 'New Clip',
      startTime: Math.random() * 8,
      duration: 2 + Math.random() * 3,
      color: '#95a5a6',
      isSelected: false,
      isDragging: false,
      isResizing: false,
      collaboratorCursors: []
    };

    setSceneState(prevState => ({
      ...prevState,
      clips: [...prevState.clips, newClip],
      lastUpdateTimestamp: Date.now()
    }));
  }, []);

  // Memoize renderer options for performance
  const rendererOptions = useMemo(() => ({
    enableDebugMode: false,
    maxFPS: 60,
    enableWaveformCaching: true,
    enableCollaboratorCursors: false
  }), []);

  return (
    <div className="daw-container" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#2c3e50', 
        display: 'flex', 
        gap: '10px',
        alignItems: 'center'
      }}>
        <button 
          onClick={playPause}
          style={{
            padding: '8px 16px',
            backgroundColor: isPlaying ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button 
          onClick={stop}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⏹️ Stop
        </button>

        <button 
          onClick={addClip}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ➕ Add Clip
        </button>

        <div style={{ color: 'white', marginLeft: '20px' }}>
          Time: {sceneState.playhead.currentTime.toFixed(2)}s
        </div>

        <div style={{ color: 'white', marginLeft: '10px' }}>
          Selected: {sceneState.selection.clips.length} clips
        </div>
      </div>

      {/* DAW Canvas */}
      <div style={{ flex: 1, backgroundColor: '#34495e' }}>
        <PixiHostComponent
          sceneState={sceneState}
          onInteraction={handleInteraction}
          rendererOptions={rendererOptions}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Info Panel */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#2c3e50', 
        color: 'white',
        fontSize: '12px'
      }}>
        <div>Instructions:</div>
        <div>• Click on clips to select them</div>
        <div>• Press spacebar or click Play/Pause to toggle playback</div>
        <div>• Click on empty areas to clear selection</div>
        <div>• Drag playhead to scrub timeline</div>
      </div>
    </div>
  );
}; 