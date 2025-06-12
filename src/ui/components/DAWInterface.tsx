import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMusicArrangement } from '../hooks/useMusicArrangement';
import { SimpleDAWRenderer } from '../renderers/SimpleDAWRenderer';
import { DAWInteractionEvent } from '../types/DAWSceneState';

// Import sub-components
import { TopMenuBar } from './layout/TopMenuBar';
import { TransportControls } from './layout/TransportControls';
import { TrackHeaders } from './layout/TrackHeaders';
import { BottomPanel } from './layout/BottomPanel';
import { StatusBar } from './layout/StatusBar';
import { StressTest } from './StressTest';

const DAWInterface: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SimpleDAWRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef<{
    isInitializing: boolean;
    isInitialized: boolean;
    initPromise: Promise<void> | null;
  }>({
    isInitializing: false,
    isInitialized: false,
    initPromise: null
  });
  
  const {
    sceneState,
    isLoading,
    error,
    createTrack,
    deleteTrack,
    moveClip,
    addMidiClip,
    startPlayback,
    stopPlayback,
    selectClip,
    setPlayheadTime,
    setTimelineScroll,
    setViewportSize,
    adapter,
    addMidiNote,
    deleteMidiNote,
    updateMidiNote,
    resizeClip
  } = useMusicArrangement();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rendererReady, setRendererReady] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  const [activeBottomPanel, setActiveBottomPanel] = useState<'piano-roll' | 'mixer' | 'browser' | 'properties'>('piano-roll');
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const [isStressTestVisible, setIsStressTestVisible] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [masterVolume, setMasterVolume] = useState(0.8);

  // Performance: throttle scene updates to prevent excessive renders
  const lastSceneUpdateRef = useRef<number>(0);
  const SCENE_UPDATE_THROTTLE = 16; // ~60fps limit

  const throttledSceneState = useMemo(() => {
    const now = performance.now();
    if (now - lastSceneUpdateRef.current >= SCENE_UPDATE_THROTTLE) {
      lastSceneUpdateRef.current = now;
      return sceneState;
    }
    return sceneState; // Could return previous cached state here for stronger throttling
  }, [sceneState]);

  // Performance optimization will be added after handler definitions

  const initializeRenderer = useCallback(async (): Promise<SimpleDAWRenderer | null> => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) {
      console.log('DAWInterface: Canvas or container not ready');
      return null;
    }

    if (rendererRef.current) {
      try {
        const { clientWidth, clientHeight } = container;
        if (clientWidth > 0 && clientHeight > 0) {
          rendererRef.current.resize(clientWidth, clientHeight);
          console.log('DAWInterface: Reusing existing renderer');
          return rendererRef.current;
        }
      } catch (error) {
        console.log('DAWInterface: Existing renderer is dead, creating new one');
        try {
          rendererRef.current.destroy();
        } catch {}
        rendererRef.current = null;
      }
    }

    try {
      console.log('DAWInterface: Creating new PIXI renderer');
      const renderer = new SimpleDAWRenderer(canvas);
      renderer.setInteractionCallback(handleInteraction);
      console.log('🎯 DAWInterface: Interaction callback set on renderer');
      
      const { clientWidth, clientHeight } = container;
      if (clientWidth > 0 && clientHeight > 0) {
        renderer.resize(clientWidth, clientHeight);
        setViewportSize(clientWidth, clientHeight);
        console.log(`DAWInterface: Renderer initialized with size ${clientWidth}x${clientHeight}`);
      }

      rendererRef.current = renderer;
      return renderer;
    } catch (error) {
      console.error('DAWInterface: Failed to create renderer:', error);
      return null;
    }
  }, [setViewportSize]);

  useEffect(() => {
    const initState = initializationRef.current;
    
    if (initState.isInitializing || initState.isInitialized) {
      return;
    }

    initState.isInitializing = true;
    console.log('DAWInterface: Starting renderer initialization');

    const initPromise = initializeRenderer().then((renderer) => {
      if (renderer) {
        initState.isInitialized = true;
        setRendererReady(true);
        console.log('DAWInterface: Renderer initialization completed');
        
        setTimeout(() => {
          handleResize();
        }, 100);
      } else {
        console.error('DAWInterface: Renderer initialization failed');
      }
      initState.isInitializing = false;
    }).catch((error) => {
      console.error('DAWInterface: Renderer initialization error:', error);
      initState.isInitializing = false;
    });

    initState.initPromise = initPromise;

    return () => {
      console.log('DAWInterface: Cleanup triggered');
      
      if (initState.initPromise) {
        initState.initPromise.then(() => {
          if (rendererRef.current) {
            try {
              console.log('DAWInterface: Destroying renderer');
              rendererRef.current.destroy();
            } catch (error) {
              console.warn('DAWInterface: Error during renderer cleanup:', error);
            }
            rendererRef.current = null;
          }
        });
      }

      initState.isInitializing = false;
      initState.isInitialized = false;
      initState.initPromise = null;
      setRendererReady(false);
    };
  }, []);

  useEffect(() => {
    if (!rendererReady || !rendererRef.current) {
      console.log('DAWInterface: Renderer not ready, skipping scene update');
      return;
    }

    console.log('DAWInterface: throttledSceneState changed, tracks:', throttledSceneState.tracks.length);
    
    try {
      rendererRef.current.updateScene(throttledSceneState);
    } catch (error) {
      console.error('DAWInterface: Error updating scene:', error);
    }
  }, [throttledSceneState, rendererReady]);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !rendererReady) {
      console.log('DAWInterface: Resize skipped - not ready');
      return;
    }
    
    try {
      const { clientWidth, clientHeight } = containerRef.current;
      // Calculate dynamic canvas height based on track count
      const dynamicHeight = Math.max(
        clientHeight,
        50 + (sceneState.tracks.length * 80) + 100 // header + tracks + extra space
      );
      console.log(`DAWInterface: Resizing to ${clientWidth}x${dynamicHeight}`);
      rendererRef.current.resize(clientWidth, dynamicHeight);
      setViewportSize(clientWidth, dynamicHeight);
    } catch (error) {
      console.error('DAWInterface: Error during resize:', error);
    }
  }, [setViewportSize, rendererReady, sceneState.tracks.length]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Trigger resize when track count changes
  useEffect(() => {
    if (rendererReady) {
      console.log('DAWInterface: Track count changed, triggering resize');
      handleResize();
    }
  }, [sceneState.tracks.length, rendererReady, handleResize]);

  const handleInteraction = useCallback((event: DAWInteractionEvent) => {
    console.log('🎯 DAWInterface: Interaction received:', event.type, event.payload);
    
    switch (event.type) {
      case 'clip-select':
        console.log('📎 Selecting clip:', event.payload.clipId, 'Multi-select:', event.payload.isMultiSelect);
        selectClip(event.payload.clipId, event.payload.isMultiSelect);
        console.log('✅ Clip selection triggered');
        break;
      case 'clip-drag':
        // Handle real-time clip drag preview (visual feedback only)
        if (event.payload.isPreview) {
          console.log('🖱️ Clip drag preview:', event.payload.clipId, 'to time:', event.payload.newStartTime);
          // This could be used for visual feedback during drag, but we'll let the renderer handle it
        }
        break;
      case 'clip-move':
        // Handle final clip position update
        if (!event.payload.isPreview) {
          console.log('🎵 Moving clip:', event.payload.clipId, 'to time:', event.payload.newStartTime);
          // Find the current clip to get its trackId
          const currentClip = sceneState.clips.find(c => c.id === event.payload.clipId);
          if (currentClip) {
            moveClip(event.payload.clipId, currentClip.trackId, event.payload.newStartTime);
            console.log('✅ Clip move triggered');
          } else {
            console.error('❌ Clip not found for move operation:', event.payload.clipId);
          }
        }
        break;
      case 'clip-resize':
        // Handle clip resize events
        if (event.payload.isPreview) {
          console.log('🔧 Clip resize preview:', event.payload.clipId, 'handle:', event.payload.resizeHandle, 'duration:', event.payload.newDuration);
          
          // For preview mode, we can directly update the adapter state temporarily
          // This provides immediate visual feedback during dragging
          if (adapter) {
            // Call resizeClip directly for preview updates
            resizeClip(event.payload.clipId, event.payload.newStartTime, event.payload.newDuration);
          }
        } else {
          console.log('🔧 Resizing clip:', event.payload.clipId, 'handle:', event.payload.resizeHandle, 'new duration:', event.payload.newDuration, 'new start:', event.payload.newStartTime);
          // Call the adapter to resize the clip (final update)
          resizeClip(event.payload.clipId, event.payload.newStartTime, event.payload.newDuration);
          console.log('✅ Clip resize triggered');
        }
        break;
      case 'timeline-click':
        console.log('🕐 Timeline clicked at time:', event.payload.time);
        setPlayheadTime(event.payload.time);
        break;
      case 'timeline-scrub-start':
        console.log('🎯 Timeline scrub started at time:', event.payload.time);
        setPlayheadTime(event.payload.time);
        break;
      case 'timeline-scrub':
        console.log('🎯 Timeline scrubbing to time:', event.payload.time);
        setPlayheadTime(event.payload.time);
        break;
      case 'timeline-scrub-end':
        console.log('🎯 Timeline scrub ended at time:', event.payload.time);
        setPlayheadTime(event.payload.time);
        break;
      case 'track-select':
        console.log('🎼 Track selected:', event.payload.trackId);
        handleTrackSelect(event.payload.trackId);
        break;
      default:
        console.log('🤷 Unknown interaction type:', event.type);
    }
  }, [selectClip, moveClip, resizeClip, setPlayheadTime, sceneState.clips]);

  // Update interaction callback when handleInteraction changes
  useEffect(() => {
    if (rendererRef.current && handleInteraction) {
      rendererRef.current.setInteractionCallback(handleInteraction);
      console.log('🎯 DAWInterface: Interaction callback updated');
    }
  }, [handleInteraction]);

  // Transport control handlers
  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      await stopPlayback();
      setIsPlaying(false);
    } else {
      await startPlayback();
      setIsPlaying(true);
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  // Sync initial BPM to adapter when adapter becomes available
  useEffect(() => {
    if (adapter && tempo) {
      adapter.setBPM(tempo);
      console.log(`🎵 DAWInterface: Initial BPM synchronized to adapter: ${tempo}`);
    }
  }, [adapter, tempo]);

  const handleStop = useCallback(async () => {
    await stopPlayback();
    setPlayheadTime(0);
    setIsPlaying(false);
  }, [stopPlayback, setPlayheadTime]);

  const handleRecord = useCallback(() => {
    setIsRecording(!isRecording);
  }, [isRecording]);

  // Track operation handlers
  const handleCreateTrack = useCallback(async (type: 'audio' | 'midi' = 'audio') => {
    const trackCount = sceneState.tracks.length;
    const name = type === 'audio' ? `Audio ${trackCount + 1}` : `MIDI ${trackCount + 1}`;
    await createTrack(name, type);
  }, [createTrack, sceneState.tracks.length]);

  const handleTrackMute = useCallback(async (trackId: string, muted: boolean) => {
    console.log('Track mute operation:', trackId, muted);
    // Update track mute state through adapter
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.updateTrackProperty(trackId, 'isMuted', muted);
    }
  }, []);

  const handleTrackSolo = useCallback(async (trackId: string, soloed: boolean) => {
    console.log('Track solo operation:', trackId, soloed);
    // Update track solo state through adapter
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.updateTrackProperty(trackId, 'isSoloed', soloed);
    }
  }, []);

  const handleTrackSelect = useCallback((trackId: string) => {
    console.log('🎼 DAWInterface: Track selected:', trackId);
    console.log('🎼 DAWInterface: Available adapter:', !!adapter);
    
    // Update track selection state
    if (adapter) {
      console.log('🎼 DAWInterface: Calling adapter.selectTrack');
      adapter.selectTrack(trackId);
    } else {
      console.warn('🎼 DAWInterface: No adapter available for track selection');
    }
  }, [adapter]);

  const handleTrackReorder = useCallback((trackIds: string[]) => {
    console.log('Track reorder:', trackIds);
    // Update track order through adapter
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.reorderTracks(trackIds);
    }
  }, []);

  const handleTrackArm = useCallback((trackId: string, armed: boolean) => {
    console.log('Track arm operation:', trackId, armed);
    // Update track arm state through adapter
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.updateTrackProperty(trackId, 'isArmed', armed);
    }
  }, []);

  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    console.log('Track volume change:', trackId, volume);
    // Update track volume through adapter
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.updateTrackProperty(trackId, 'volume', volume);
    }
  }, []);

  const handleTrackPanChange = useCallback((trackId: string, pan: number) => {
    console.log('Track pan change:', trackId, pan);
    // Update track pan through adapter
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.updateTrackProperty(trackId, 'pan', pan);
    }
  }, []);

  const handleAddClip = useCallback(async () => {
    if (sceneState.tracks.length === 0) {
      console.log('No tracks available. Create a track first.');
      return;
    }
    
    // Find the selected track, or fallback to the first track
    const selectedTrack = sceneState.tracks.find(track => track.isSelected) || sceneState.tracks[0];
    console.log('Adding clip to track:', selectedTrack.id, 'at time:', sceneState.playhead.currentTime);
    await addMidiClip(selectedTrack.id, sceneState.playhead.currentTime, 4, 'New Clip');
    console.log('Clip added successfully to track:', selectedTrack.name);
  }, [addMidiClip, sceneState.tracks, sceneState.playhead.currentTime]);

  // Add a helper function to create a test clip for selection
  const handleCreateTestClip = useCallback(async () => {
    if (sceneState.tracks.length === 0) {
      console.log('Creating a track first...');
      await handleCreateTrack('midi');
      
      // Wait a bit for track creation, then add clip
      setTimeout(async () => {
        if (sceneState.tracks.length > 0) {
          // Find the selected track, or fallback to the first track
          const selectedTrack = sceneState.tracks.find(track => track.isSelected) || sceneState.tracks[0];
          console.log('Adding test clip to track:', selectedTrack.id);
          await addMidiClip(selectedTrack.id, 0, 4, 'Test Clip');
          console.log('Test clip created! You can now click on it to select.');
        }
      }, 500);
    } else {
      // Find the selected track, or fallback to the first track
      const selectedTrack = sceneState.tracks.find(track => track.isSelected) || sceneState.tracks[0];
      console.log('Adding test clip to existing track:', selectedTrack.id);
      await addMidiClip(selectedTrack.id, 0, 4, 'Test Clip');
      console.log('Test clip created! You can now click on it to select.');
    }
  }, [handleCreateTrack, addMidiClip, sceneState.tracks]);

  // Zoom control handlers with renderer integration
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.5, 4.0);
    setZoom(newZoom);
    
    // Update timeline pixels per beat based on zoom
    if (rendererRef.current) {
      const newPixelsPerBeat = 32 * newZoom; // Base 32 pixels per beat
      const adapter = (useMusicArrangement as any).getAdapter?.();
      if (adapter) {
        adapter.updateTimelineProperty('pixelsPerBeat', newPixelsPerBeat);
      }
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.5, 0.25);
    setZoom(newZoom);
    
    // Update timeline pixels per beat based on zoom
    if (rendererRef.current) {
      const newPixelsPerBeat = 32 * newZoom; // Base 32 pixels per beat
      const adapter = (useMusicArrangement as any).getAdapter?.();
      if (adapter) {
        adapter.updateTimelineProperty('pixelsPerBeat', newPixelsPerBeat);
      }
    }
  }, [zoom]);

  // TopMenuBar action handlers
  const handleSave = useCallback(async () => {
    try {
      const projectData = {
        tracks: sceneState.tracks,
        playhead: sceneState.playhead,
        tempo,
        timeSignature,
        masterVolume,
        timestamp: new Date()
      };
      
      // Store project data in localStorage for demo
      localStorage.setItem('echlub-project', JSON.stringify(projectData));
      
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }, [sceneState, tempo, timeSignature, masterVolume]);

  const handleExport = useCallback(async () => {
    try {
      const exportData = {
        tracks: sceneState.tracks,
        clips: sceneState.clips || [],
        metadata: {
          title: 'Untitled Project',
          artist: 'Unknown',
          exportDate: new Date(),
          format: 'WAV',
          sampleRate: 48000,
          bitDepth: 24
        }
      };
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'echlub-project-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Project exported successfully');
    } catch (error) {
      console.error('Failed to export project:', error);
    }
  }, [sceneState]);

  const handleSettings = useCallback(() => {
    console.log('Open settings');
    // Could implement a settings modal here
    alert('Settings panel - Coming soon!');
  }, []);

  // Tempo change handler with adapter synchronization
  const handleTempoChange = useCallback((newTempo: number) => {
    setTempo(newTempo);
    
    // Sync BPM to MusicArrangementAdapter
    if (adapter) {
      adapter.setBPM(newTempo);
      console.log(`🎵 DAWInterface: BPM updated to ${newTempo}`);
    } else {
      console.warn('🎵 DAWInterface: No adapter available for BPM sync');
    }
  }, [adapter]);

  // Bottom panel resize handler
  const handleBottomPanelResize = useCallback((newHeight: number) => {
    setBottomPanelHeight(Math.max(250, Math.min(400, newHeight)));
  }, []);

  // BottomPanel handlers
  const handleQuantize = useCallback((amount: string) => {
    console.log('Quantize notes:', amount);
    // Could implement quantization logic here
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter && amount) {
      adapter.quantizeSelectedNotes(amount);
    }
  }, []);

  const handleHumanize = useCallback((amount: number) => {
    console.log('Humanize notes:', amount);
    // Could implement humanization logic here
    const adapter = (useMusicArrangement as any).getAdapter?.();
    if (adapter) {
      adapter.humanizeSelectedNotes(amount);
    }
  }, []);

  const handleImportFiles = useCallback((files: FileList) => {
    console.log('Import files:', files.length);
    Array.from(files).forEach(file => {
      console.log('- File:', file.name, file.type);
      // Could implement file import logic here
    });
  }, []);

  // MIDI playback methods for UI feedback
  const handlePlayNote = useCallback(async (note: number, velocity: number, duration: number) => {
    console.log(`🎹 Playing note: ${note}, velocity: ${velocity}, duration: ${duration}ms`);
    
    // Use adapter's direct playMidiNote method instead of sendMidiEvent
    if (adapter) {
      adapter.playMidiNote(note, velocity);
    }
  }, [adapter]);

  const handleStopNote = useCallback(async (note: number) => {
    console.log(`🛑 Stopping note: ${note}`);
    
    // Note: The current implementation uses oscillators with automatic stop
    // so we don't need to manually stop individual notes
  }, []);

  // Add CSS for fade-in animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(10px); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#ef4444', 
        background: '#1e293b', 
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>DAW Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#0f172a',
      color: '#f1f5f9',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Menu Bar (60px) */}
      <TopMenuBar 
        projectName="Untitled Project"
        collaborators={[]}
        onSave={handleSave}
        onExport={handleExport}
        onSettings={handleSettings}
      />

      {/* Transport & Master Controls (80px) */}
      <TransportControls
        isPlaying={isPlaying}
        isRecording={isRecording}
        currentTime={sceneState.playhead.currentTime}
        tempo={tempo}
        timeSignature={timeSignature}
        masterVolume={masterVolume}
        onPlay={handlePlay}
        onStop={handleStop}
        onRecord={handleRecord}
        onTempoChange={handleTempoChange}
        onTimeSignatureChange={setTimeSignature}
        onMasterVolumeChange={setMasterVolume}
        onPositionChange={setPlayheadTime}
      />

      {/* Main DAW Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        minHeight: 0
      }}>
        {/* Track Headers (200px) */}
        <TrackHeaders
          tracks={sceneState.tracks}
          onCreateTrack={handleCreateTrack}
          onDeleteTrack={deleteTrack}
          onTrackSelect={handleTrackSelect}
          onTrackMute={handleTrackMute}
          onTrackSolo={handleTrackSolo}
          onTrackReorder={handleTrackReorder}
          onTrackArm={handleTrackArm}
          onTrackVolumeChange={handleTrackVolumeChange}
          onTrackPanChange={handleTrackPanChange}
        />

        {/* Main Timeline Canvas */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          background: '#1e293b',
          overflow: 'auto'
        }} ref={containerRef}>
          {/* Debug Toggle Button - Top Right */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 30
          }}>
            <button
              onClick={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
              style={{
                width: '40px',
                height: '40px',
                background: isDebugPanelVisible ? '#22c55e' : 'rgba(30, 41, 59, 0.9)',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: isDebugPanelVisible ? 'white' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
              title={`${isDebugPanelVisible ? 'Hide' : 'Show'} Debug Panel`}
              onMouseEnter={(e) => {
                if (!isDebugPanelVisible) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.8)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDebugPanelVisible) {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              🐛
            </button>
          </div>

          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: Math.max(
                containerRef.current?.clientHeight || 400,
                50 + (sceneState.tracks.length * 80) + 100 // header + tracks + extra space
              ) + 'px',
              display: 'block',
              cursor: 'crosshair',
              opacity: rendererReady ? 1 : 0.3
            }}
          />
          
          {/* Renderer initialization overlay */}
          {!rendererReady && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15,23,42,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#2563eb',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="loading-spinner" style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #334155',
                  borderTop: '3px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                🎵 Initializing DAW Engine...
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Setting up PIXI.js renderer with professional-grade performance
              </div>
            </div>
          )}
          
          {/* Loading overlay */}
          {isLoading && rendererReady && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: 'white',
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="loading-spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #475569',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </div>
            </div>
          )}

          {/* Debug and Zoom Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Debug Panel - Conditionally Rendered */}
            {isDebugPanelVisible && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.95)',
                padding: '8px',
                borderRadius: '8px',
                backdropFilter: 'blur(8px)',
                border: '1px solid #475569',
                minWidth: '200px',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '12px', 
                    color: '#94a3b8', 
                    fontWeight: '600'
                  }}>
                    Debug Panel
                  </div>
                  <button
                    onClick={() => setIsDebugPanelVisible(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                    title="Close Debug Panel"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  Tracks: {sceneState.tracks.length} | Clips: {sceneState.clips?.length || 0}
                </div>
                
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  Selected: {sceneState.selection?.clips?.length || 0} clips
                </div>
                
                <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '8px' }}>
                  Active Track: {
                    (() => {
                      const selectedTrack = sceneState.tracks.find(track => track.isSelected);
                      return selectedTrack ? selectedTrack.name : sceneState.tracks.length > 0 ? sceneState.tracks[0].name : 'None';
                    })()
                  }
                </div>
                
                <button
                  onClick={handleCreateTestClip}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#22c55e',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}
                  title={
                    (() => {
                      const selectedTrack = sceneState.tracks.find(track => track.isSelected);
                      const targetTrack = selectedTrack || (sceneState.tracks.length > 0 ? sceneState.tracks[0] : null);
                      return targetTrack ? `Create clip on track: ${targetTrack.name}` : 'Create a track first';
                    })()
                  }
                >
                  🎵 Create Test Clip
                </button>
                
                <button
                  onClick={async () => {
                    // Create a clip with a note that starts at time 0 for testing
                    if (sceneState.tracks.length === 0) {
                      await handleCreateTrack('midi');
                    }
                    const selectedTrack = sceneState.tracks.find(track => track.isSelected) || sceneState.tracks[0];
                    if (selectedTrack) {
                      await addMidiClip(selectedTrack.id, 0, 4, 'Test First Note');
                      // Wait a bit for clip creation, then add a note at the beginning
                      setTimeout(async () => {
                        const clips = sceneState.clips;
                        const lastClip = clips[clips.length - 1];
                        if (lastClip) {
                          await addMidiNote(lastClip.id, 60, 80, 0, 1); // C4 note at start
                          console.log('🎵 Added test note at time 0 for debugging first note issue');
                        }
                      }, 100);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}
                  title="Create clip with note at time 0"
                >
                  🎯 Test First Note
                </button>

                <button
                  onClick={() => setIsStressTestVisible(!isStressTestVisible)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: isStressTestVisible ? '#8b5cf6' : '#475569',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}
                  title={`${isStressTestVisible ? 'Hide' : 'Show'} Stress Test Panel`}
                >
                  🔥 {isStressTestVisible ? 'Hide' : 'Show'} Stress Test
                </button>
                
                <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
                  Click on tracks to select them, then create clips
                </div>
              </div>
            )}

            {/* Stress Test Panel - Conditionally Rendered */}
            {isStressTestVisible && (
              <div style={{
                position: 'absolute',
                bottom: '160px', // Position above zoom controls
                right: '16px',
                zIndex: 25,
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <StressTest
                  sceneState={sceneState}
                  createTrack={createTrack}
                  deleteTrack={deleteTrack}
                  addMidiClip={addMidiClip}
                  addMidiNote={addMidiNote}
                  startPlayback={startPlayback}
                  stopPlayback={stopPlayback}
                  setPlayheadTime={setPlayheadTime}
                  setTimelineScroll={setTimelineScroll}
                />
              </div>
            )}
            {isStressTestVisible && (
              <div style={{
                position: 'absolute',
                bottom: '160px', // Position above zoom controls
                right: '16px',
                zIndex: 25,
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <StressTest
                  sceneState={sceneState}
                  createTrack={createTrack}
                  deleteTrack={deleteTrack}
                  addMidiClip={addMidiClip}
                  addMidiNote={addMidiNote}
                  startPlayback={startPlayback}
                  stopPlayback={stopPlayback}
                  setPlayheadTime={setPlayheadTime}
                  setTimelineScroll={setTimelineScroll}
                />
              </div>
            )}

            {/* Zoom Controls */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(30, 41, 59, 0.9)',
              padding: '4px',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)',
              border: '1px solid #475569'
            }}>
              <button
                onClick={handleZoomOut}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}
                title="Zoom Out"
              >
                -
              </button>
              
              <span style={{ 
                padding: '8px 12px', 
                fontSize: '12px',
                color: '#e2e8f0',
                minWidth: '50px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '4px'
              }}>
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel (Resizable 250-400px) */}
      <BottomPanel
        height={bottomPanelHeight}
        activePanel={activeBottomPanel}
        onHeightChange={handleBottomPanelResize}
        onActivePanelChange={setActiveBottomPanel}
        onAddClip={handleAddClip}
        selectedClips={sceneState.selection.clips}
        tracks={sceneState.tracks}
        onQuantize={handleQuantize}
        onHumanize={handleHumanize}
        onImportFiles={handleImportFiles}
        onPlayNote={handlePlayNote}
        onStopNote={handleStopNote}
        onAddMidiNote={addMidiNote}
        onDeleteMidiNote={deleteMidiNote}
        onUpdateMidiNote={updateMidiNote}
        sceneState={sceneState}
      />

      {/* Status Bar (30px) */}
      <StatusBar
        isReady={rendererReady}
        isConnected={true}
        trackCount={sceneState.tracks.length}
        clipCount={sceneState.clips.length}
        selectedCount={sceneState.selection.clips.length}
        currentTime={sceneState.playhead.currentTime}
      />

      {/* Add CSS for loading spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DAWInterface; 