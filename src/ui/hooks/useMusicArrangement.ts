import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MusicArrangementAdapter, MusicArrangementCommands } from '../adapters/MusicArrangementAdapter';
import { DAWSceneState } from '../types/DAWSceneState';
import { PerformanceMonitor } from '../utils/PerformanceOptimizations';

export interface UseMusicArrangementReturn {
  // State
  sceneState: DAWSceneState;
  isLoading: boolean;
  error: string | null;
  
  // Commands
  createTrack: (name: string, type: 'audio' | 'midi') => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => Promise<void>;
  resizeClip: (clipId: string, newStartTime: number, newDuration: number) => Promise<void>;
  addMidiClip: (trackId: string, startTime: number, duration: number, name?: string) => Promise<void>;
  startPlayback: (startTime?: number) => Promise<void>;
  stopPlayback: () => Promise<void>;
  
  // Track management
  reorderTracks: (trackIds: string[]) => void;
  selectTrack: (trackId: string) => void;
  updateTrackProperty: (trackId: string, property: string, value: any) => void;
  
  // MIDI Note Commands
  addMidiNote: (clipId: string, pitch: number, velocity: number, startTime: number, duration: number) => Promise<void>;
  deleteMidiNote: (clipId: string, noteId: string) => Promise<void>;
  updateMidiNote: (clipId: string, noteId: string, updates: { pitch?: number; velocity?: number; startTime?: number; duration?: number }) => Promise<void>;
  
  // UI interactions
  selectClip: (clipId: string, isMultiSelect?: boolean) => void;
  setPlayheadTime: (time: number) => void;
  setTimelineScroll: (scrollX: number, scrollY: number) => void;
  setViewportSize: (width: number, height: number) => void;
  
  // Performance controls
  forceWaveformRedraw: () => void;
  forceGridRedraw: () => void;
  
  // Utilities
  refresh: () => void;
  
  // Adapter access
  adapter: MusicArrangementAdapter | null;
}

// Performance optimization: Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Performance optimization: Deep equality check for specific fields
function isStateUpdateSignificant(prevState: DAWSceneState | null, newState: DAWSceneState): boolean {
  if (!prevState) return true;
  
  // Always consider track/clip count changes as significant
  if (prevState.tracks.length !== newState.tracks.length) {
    console.log(`🔄 Track count changed: ${prevState.tracks.length} -> ${newState.tracks.length}`);
    return true;
  }
  
  if (prevState.clips.length !== newState.clips.length) {
    console.log(`🔄 Clip count changed: ${prevState.clips.length} -> ${newState.clips.length}`);
    return true;
  }
  
  // Other significant changes
  return (
    prevState.playhead.currentTime !== newState.playhead.currentTime ||
    prevState.playhead.isPlaying !== newState.playhead.isPlaying ||
    prevState.selection.clips.length !== newState.selection.clips.length ||
    prevState.shouldRedrawGrid !== newState.shouldRedrawGrid ||
    prevState.shouldRedrawWaveforms !== newState.shouldRedrawWaveforms ||
    Math.abs(prevState.lastUpdateTimestamp - newState.lastUpdateTimestamp) > 100 // Throttle updates
  );
}

/**
 * Enhanced Music Arrangement Hook with performance optimizations
 */
export function useMusicArrangement(): UseMusicArrangementReturn {
  const [sceneState, setSceneState] = useState<DAWSceneState>(() => {
    // Initialize with default state
    return {
      viewport: { width: 1200, height: 600, resolution: 1, devicePixelRatio: 1 },
      timeline: { 
        scrollX: 0, scrollY: 0, pixelsPerBeat: 32, beatsPerMeasure: 4, 
        snapToGrid: true, gridResolution: 0.25, visibleTimeRange: { start: 0, end: 32 }
      },
      tracks: [],
      clips: [],
      playhead: { currentTime: 0, isVisible: true, isPlaying: false, color: '#ff4444' },
      selection: { clips: [], tracks: [] },
      tools: { activeTool: 'select', toolSettings: {} },
      collaborators: [],
      markers: [],
      regions: [],
      shouldRedrawWaveforms: false,
      shouldRedrawGrid: true,
      lastUpdateTimestamp: Date.now()
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<MusicArrangementAdapter | null>(null);
  const updateCountRef = useRef(0);

  // Initialize adapter with singleton pattern
  const getAdapter = useCallback(() => {
    if (!adapterRef.current) {
      adapterRef.current = new MusicArrangementAdapter();
      console.log('useMusicArrangement: Created new adapter instance');
    }
    return adapterRef.current;
  }, []);

  // Initialize adapter and subscribe to state changes
  useEffect(() => {
    const adapter = getAdapter();
    
    // Performance-optimized state change handler with throttling
    const handleStateChange = (newState: DAWSceneState) => {
      setSceneState(prevState => {
        // Performance check: only update if significant changes
        if (!isStateUpdateSignificant(prevState, newState)) {
          console.log('useMusicArrangement: Skipping update - no significant changes');
          return prevState; // Return previous state to prevent re-render
        }
        
        updateCountRef.current++;
        console.log(`useMusicArrangement: State update #${updateCountRef.current} applied`);
        return newState;
      });
    };
    
    // Special real-time handler for playhead updates (no debounce)
    const handlePlayheadChange = (newState: DAWSceneState) => {
      setSceneState(prevState => {
        // Check if only playhead changed (for real-time updates)
        const playheadOnlyUpdate = (
          prevState.playhead.currentTime !== newState.playhead.currentTime ||
          prevState.playhead.isPlaying !== newState.playhead.isPlaying
        ) && (
          prevState.tracks.length === newState.tracks.length &&
          prevState.clips.length === newState.clips.length &&
          prevState.selection.clips.length === newState.selection.clips.length &&
          !newState.shouldRedrawGrid &&
          !newState.shouldRedrawWaveforms
        );
        
        if (playheadOnlyUpdate) {
          console.log('🎯 useMusicArrangement: Real-time playhead update');
          updateCountRef.current++;
          return newState;
        }
        
        // For non-playhead updates, check significance
        if (!isStateUpdateSignificant(prevState, newState)) {
          console.log('useMusicArrangement: Skipping update - no significant changes');
          return prevState; // Return previous state to prevent re-render
        }
        
        updateCountRef.current++;
        console.log(`useMusicArrangement: State update #${updateCountRef.current} applied`);
        return newState;
      });
    };
    
    // Subscribe to adapter changes with special playhead handling
    const unsubscribe = adapter.subscribe(handlePlayheadChange);
    
    // Get initial state
    setSceneState(adapter.getState());
    
    return () => {
      console.log('useMusicArrangement: Cleaning up subscription');
      unsubscribe();
    };
  }, [getAdapter]);

  // Performance-optimized command execution with queue management
  const executeCommandQueue = useRef<Array<() => Promise<void>>>([]);
  const isExecutingQueue = useRef(false);

  const processCommandQueue = useCallback(async () => {
    if (isExecutingQueue.current || executeCommandQueue.current.length === 0) return;
    
    isExecutingQueue.current = true;
    setIsLoading(true);
    
    try {
      // Process commands in batches
      const batchSize = 3; // Process max 3 commands at once
      while (executeCommandQueue.current.length > 0) {
        const batch = executeCommandQueue.current.splice(0, batchSize);
        await Promise.all(batch.map(cmd => cmd()));
        
        // Small delay between batches to prevent UI blocking
        if (executeCommandQueue.current.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    } finally {
      isExecutingQueue.current = false;
      setIsLoading(false);
    }
  }, []);

  // Enhanced command execution with performance optimizations
  const executeCommand = useCallback(async <T extends keyof MusicArrangementCommands>(
    command: T,
    payload: MusicArrangementCommands[T]
  ): Promise<void> => {
    const endTiming = PerformanceMonitor.startOperation(`hook.executeCommand.${String(command)}`, 'ui-hook');
    const adapter = getAdapter();
    
    const commandExecution = async () => {
      const startTime = performance.now();
      
      try {
        console.log(`useMusicArrangement: Executing ${String(command)}:`, payload);
        
        const adapterEndTiming = PerformanceMonitor.startOperation(`adapter.executeCommand.${String(command)}`, 'ui-adapter');
        const result = await adapter.executeCommand(command, payload);
        adapterEndTiming();
        
        if (!result.isSuccess) {
          throw new Error(result.error || 'Command execution failed');
        }
        
        const duration = performance.now() - startTime;
        if (duration > 50) { // Log slow commands
          console.warn(`useMusicArrangement: Slow command ${String(command)} took ${duration}ms`);
        }
        
        endTiming();
      } catch (err) {
        endTiming();
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`useMusicArrangement: Command ${String(command)} failed:`, errorMessage);
        setError(errorMessage);
      }
    };

    // For critical real-time commands, execute immediately
    const realTimeCommands = ['setPlayheadTime', 'startPlayback', 'stopPlayback', 'createTrack', 'addMidiClip', 'deleteTrack'];
    if (realTimeCommands.includes(String(command))) {
      await commandExecution();
    } else {
      // Queue other commands for batch processing
      executeCommandQueue.current.push(commandExecution);
      processCommandQueue();
    }
  }, [getAdapter, processCommandQueue]);

  // Memoized command methods for better performance
  const createTrack = useCallback(async (name: string, type: 'audio' | 'midi') => {
    await executeCommand('createTrack', { name, type });
  }, [executeCommand]);

  const deleteTrack = useCallback(async (trackId: string) => {
    await executeCommand('deleteTrack', { trackId });
  }, [executeCommand]);

  const moveClip = useCallback(async (clipId: string, newTrackId: string, newStartTime: number) => {
    await executeCommand('moveClip', { clipId, newTrackId, newStartTime });
  }, [executeCommand]);

  const resizeClip = useCallback(async (clipId: string, newStartTime: number, newDuration: number) => {
    await executeCommand('resizeClip', { clipId, newStartTime, newDuration });
  }, [executeCommand]);

  const addMidiClip = useCallback(async (trackId: string, startTime: number, duration: number, name?: string) => {
    await executeCommand('addMidiClip', { trackId, startTime, duration, name });
  }, [executeCommand]);

  const startPlayback = useCallback(async (startTime?: number) => {
    await executeCommand('startPlayback', { startTime });
  }, [executeCommand]);

  const stopPlayback = useCallback(async () => {
    await executeCommand('stopPlayback', {});
  }, [executeCommand]);

  // MIDI Note command methods
  const addMidiNote = useCallback(async (clipId: string, pitch: number, velocity: number, startTime: number, duration: number) => {
    const adapter = getAdapter();
    await adapter.addMidiNote(clipId, pitch, velocity, startTime, duration);
  }, [getAdapter]);

  const deleteMidiNote = useCallback(async (clipId: string, noteId: string) => {
    const adapter = getAdapter();
    await adapter.deleteMidiNote(clipId, noteId);
  }, [getAdapter]);

  const updateMidiNote = useCallback(async (clipId: string, noteId: string, updates: { pitch?: number; velocity?: number; startTime?: number; duration?: number }) => {
    const adapter = getAdapter();
    await adapter.updateMidiNote(clipId, noteId, updates);
  }, [getAdapter]);

  // UI interaction methods (non-async for better responsiveness)
  const selectClip = useCallback((clipId: string, isMultiSelect: boolean = false) => {
    const adapter = getAdapter();
    adapter.selectClip(clipId, isMultiSelect);
  }, [getAdapter]);

  const setPlayheadTime = useCallback((time: number) => {
    const adapter = getAdapter();
    adapter.setPlayheadTime(time);
  }, [getAdapter]);

  const setTimelineScroll = useCallback((scrollX: number, scrollY: number) => {
    const adapter = getAdapter();
    adapter.setTimelineScroll(scrollX, scrollY);
  }, [getAdapter]);

  const setViewportSize = useCallback((width: number, height: number) => {
    const adapter = getAdapter();
    adapter.setViewportSize(width, height);
  }, [getAdapter]);

  // Performance control methods
  const forceWaveformRedraw = useCallback(() => {
    const adapter = getAdapter();
    adapter.forceWaveformRedraw();
  }, [getAdapter]);

  const forceGridRedraw = useCallback(() => {
    const adapter = getAdapter();
    adapter.forceGridRedraw();
  }, [getAdapter]);

  const refresh = useCallback(() => {
    const adapter = getAdapter();
    setSceneState(adapter.getState());
    console.log('useMusicArrangement: Manual refresh triggered');
  }, [getAdapter]);

  // Track management methods
  const reorderTracks = useCallback((trackIds: string[]) => {
    const adapter = getAdapter();
    adapter.reorderTracks(trackIds);
  }, [getAdapter]);

  const selectTrack = useCallback((trackId: string) => {
    const adapter = getAdapter();
    adapter.selectTrack(trackId);
  }, [getAdapter]);

  const updateTrackProperty = useCallback((trackId: string, property: string, value: any) => {
    const adapter = getAdapter();
    adapter.updateTrackProperty(trackId, property, value);
  }, [getAdapter]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    sceneState,
    isLoading,
    error,
    createTrack,
    deleteTrack,
    moveClip,
    resizeClip,
    addMidiClip,
    startPlayback,
    stopPlayback,
    addMidiNote,
    deleteMidiNote,
    updateMidiNote,
    selectClip,
    setPlayheadTime,
    setTimelineScroll,
    setViewportSize,
    forceWaveformRedraw,
    forceGridRedraw,
    refresh,
    reorderTracks,
    selectTrack,
    updateTrackProperty,
    adapter: adapterRef.current
  }), [
    sceneState,
    isLoading,
    error,
    createTrack,
    deleteTrack,
    moveClip,
    resizeClip,
    addMidiClip,
    startPlayback,
    stopPlayback,
    addMidiNote,
    deleteMidiNote,
    updateMidiNote,
    selectClip,
    setPlayheadTime,
    setTimelineScroll,
    setViewportSize,
    forceWaveformRedraw,
    forceGridRedraw,
    refresh,
    reorderTracks,
    selectTrack,
    updateTrackProperty
  ]);
} 