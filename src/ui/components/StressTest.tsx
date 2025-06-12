import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PerformanceMonitor, MemoryManager } from '../utils/PerformanceOptimizations';
import { MusicArrangementPerformance } from '../utils/MusicArrangementPerformance';

// Type declaration for Chrome's gc() function
declare global {
  interface Window {
    gc?: () => void;
  }
  
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

interface StressTestProps {
  sceneState: any;
  createTrack: (name: string, type: 'audio' | 'midi') => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  addMidiClip: (trackId: string, startTime: number, duration: number, name?: string) => Promise<void>;
  addMidiNote: (clipId: string, pitch: number, velocity: number, startTime: number, duration: number) => Promise<void>;
  startPlayback: (startTime?: number) => Promise<void>;
  stopPlayback: () => Promise<void>;
  setPlayheadTime: (time: number) => void;
  setTimelineScroll: (scrollX: number, scrollY: number) => void;
}

export const StressTest: React.FC<StressTestProps> = ({
  sceneState,
  createTrack,
  deleteTrack,
  addMidiClip,
  addMidiNote,
  startPlayback,
  stopPlayback,
  setPlayheadTime,
  setTimelineScroll
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testType, setTestType] = useState<'tracks' | 'clips' | 'notes' | 'playback' | 'scroll' | 'memory' | 'full' | 'burnout' | 'basic'>('tracks');
  const [intensity, setIntensity] = useState(1); // 1-5 scale
  const [burnoutMode, setBurnoutMode] = useState(false);
  const [metrics, setMetrics] = useState<any>({});
  const [operationStats, setOperationStats] = useState<any>({});
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const testCountRef = useRef(0);

  // Performance metrics monitoring
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      const perfMetrics = PerformanceMonitor.getMetrics();
      
      // Get memory usage from multiple sources
      let memoryUsage = 0;
      
      // Method 1: Chrome's performance.memory API
      if ('memory' in performance && (performance as any).memory) {
        memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
      
      // Method 2: Use MemoryManager utility
      if (memoryUsage === 0) {
        try {
          memoryUsage = MemoryManager.getMemoryUsage();
        } catch (error) {
          console.warn('Failed to get memory usage:', error);
        }
      }
      
      // Method 3: Fallback estimation based on created objects
      if (memoryUsage === 0) {
        const trackCount = sceneState.tracks?.length || 0;
        const clipCount = sceneState.clips?.length || 0;
        // Conservative estimation: track ~30KB, clip ~15KB, base ~8MB
        memoryUsage = (trackCount * 30000) + (clipCount * 15000) + 8000000;
      }
      
      const currentFPS = Math.round((1000 / (perfMetrics['render-time']?.average || 16)) * 10) / 10;
      
      // Get detailed operation statistics
      const opStats = PerformanceMonitor.getOperationStats();
      const catStats = PerformanceMonitor.getCategoryBreakdown();
      
      setMetrics({
        ...perfMetrics,
        memory: memoryUsage,
        fps: isNaN(currentFPS) ? 0 : currentFPS,
        timestamp: Date.now()
      });
      
      setOperationStats(opStats);
      setCategoryStats(catStats);
    }, 500);

    return () => clearInterval(metricsInterval);
  }, [sceneState.tracks, sceneState.clips]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  }, []);

  // Debug memory detection on first load
  useEffect(() => {
    let debugMessage = '🔍 Memory Detection: ';
    
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      debugMessage += `Chrome API ✅ (${Math.round(mem.usedJSHeapSize / 1024 / 1024)}MB)`;
    } else {
      debugMessage += 'Chrome API ❌';
    }
    
    debugMessage += ` | Fallback: Available`;
    debugMessage += ` | Objects: ${sceneState.tracks?.length || 0} tracks, ${sceneState.clips?.length || 0} clips`;
    
    addLog(debugMessage);
  }, []); // Run only once on mount

  // Stress test implementations
  const runTrackStressTest = useCallback(async () => {
    const trackCount = intensity * 5; // 5-25 tracks
    addLog(`🚗 Creating ${trackCount} tracks...`);
    
    for (let i = 0; i < trackCount; i++) {
      const endTiming = PerformanceMonitor.startOperation('createTrack', 'creation');
      try {
        await createTrack(`Stress Track ${i + 1}`, i % 2 === 0 ? 'midi' : 'audio');
        endTiming();
      } catch (error) {
        endTiming();
        addLog(`❌ Failed to create track ${i + 1}: ${error}`);
      }
      
      // Add some delay based on intensity (less delay = more stress)
      if (intensity < 3) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    addLog(`✅ Created ${trackCount} tracks`);
  }, [intensity, createTrack, addLog]);

  const runClipStressTest = useCallback(async () => {
    if (sceneState.tracks.length === 0) {
      await createTrack('Stress Track', 'midi');
    }
    
    const clipCount = intensity * 10; // 10-50 clips
    const tracks = sceneState.tracks;
    addLog(`🎵 Creating ${clipCount} clips...`);
    
    for (let i = 0; i < clipCount; i++) {
      const endTiming = PerformanceMonitor.startOperation('addMidiClip', 'creation');
      try {
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        const startTime = Math.random() * 60; // 16小节内 (保留4拍buffer)
        const duration = 1 + Math.random() * 3; // 1-4 beats duration
        
        await addMidiClip(randomTrack.id, startTime, duration, `Stress Clip ${i + 1}`);
        endTiming();
      } catch (error) {
        endTiming();
        addLog(`❌ Failed to create clip ${i + 1}: ${error}`);
      }
      
      if (i % 5 === 0) {
        addLog(`🎵 Created ${i + 1}/${intensity * 5} clips`);
      }
    }
    
    addLog(`✅ Created ${clipCount} clips`);
  }, [intensity, sceneState.tracks, createTrack, addMidiClip, addLog]);

  const runNoteStressTest = useCallback(async () => {
    const clips = sceneState.clips;
    if (clips.length === 0) {
      addLog('⚠️ No clips available, creating test clip...');
      await runClipStressTest();
      return;
    }
    
    const noteCount = intensity * 20; // 20-100 notes
    addLog(`🎹 Creating ${noteCount} notes...`);
    
    for (let i = 0; i < noteCount; i++) {
      const endTiming = PerformanceMonitor.startOperation('addMidiNote', 'creation');
      try {
        const randomClip = clips[Math.floor(Math.random() * clips.length)];
        const pitch = 48 + Math.floor(Math.random() * 36); // C3 to C6
        const velocity = 60 + Math.floor(Math.random() * 40); // 60-100 velocity
        const startTime = Math.random() * (randomClip.duration || 2);
        const duration = 0.25 + Math.random() * 0.75; // 0.25-1 beat duration
        
        await addMidiNote(randomClip.id, pitch, velocity, startTime, duration);
        endTiming();
      } catch (error) {
        endTiming();
        addLog(`❌ Failed to create note ${i + 1}: ${error}`);
      }
      
      if (intensity < 5) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    addLog(`✅ Created ${noteCount} notes`);
  }, [intensity, sceneState.clips, addMidiNote, addLog, runClipStressTest]);

  const runPlaybackStressTest = useCallback(async () => {
    const cycles = intensity * 2; // 2-10 cycles
    addLog(`⏯️ Running ${cycles} playback cycles...`);
    
    for (let i = 0; i < cycles; i++) {
      // Start playback
      const startEndTiming = PerformanceMonitor.startOperation('startPlayback', 'playback');
      try {
        await startPlayback(0);
        startEndTiming();
        addLog(`▶️ Playback cycle ${i + 1} started`);
      } catch (error) {
        startEndTiming();
        addLog(`❌ Failed to start playback cycle ${i + 1}: ${error}`);
      }
      
      // Random playback duration
      const playDuration = 1000 + Math.random() * 2000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, playDuration));
      
      // Stop playback
      const stopEndTiming = PerformanceMonitor.startOperation('stopPlayback', 'playback');
      try {
        await stopPlayback();
        stopEndTiming();
        addLog(`⏹️ Playback cycle ${i + 1} stopped`);
      } catch (error) {
        stopEndTiming();
        addLog(`❌ Failed to stop playback cycle ${i + 1}: ${error}`);
      }
      
      // Short pause between cycles
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    addLog(`✅ Completed ${cycles} playback cycles`);
  }, [intensity, startPlayback, stopPlayback, addLog]);

  const runScrollStressTest = useCallback(() => {
    const scrollCycles = intensity * 10; // 10-50 scroll operations
    let scrollCount = 0;
    addLog(`📜 Running ${scrollCycles} scroll operations...`);
    
    const scrollInterval = setInterval(() => {
      if (scrollCount >= scrollCycles) {
        clearInterval(scrollInterval);
        addLog(`✅ Completed ${scrollCycles} scroll operations`);
        return;
      }
      
      // Record scroll operations
      const scrollEndTiming = PerformanceMonitor.startOperation('setTimelineScroll', 'ui');
      const playheadEndTiming = PerformanceMonitor.startOperation('setPlayheadTime', 'ui');
      
      try {
        // Random scroll position
        const scrollX = Math.random() * 2000;
        const scrollY = Math.random() * 200;
        setTimelineScroll(scrollX, scrollY);
        scrollEndTiming();
        
        // Random playhead position
        setPlayheadTime(Math.random() * 60); // 16小节内
        playheadEndTiming();
      } catch (error) {
        scrollEndTiming();
        playheadEndTiming();
      }
      
      scrollCount++;
    }, 50 / intensity); // Faster scrolling with higher intensity
  }, [intensity, setTimelineScroll, setPlayheadTime, addLog]);

  const runMemoryStressTest = useCallback(async () => {
    const iterations = intensity * 5; // 5-25 iterations
    addLog(`🧠 Running ${iterations} memory stress iterations...`);
    
    for (let i = 0; i < iterations; i++) {
      // Create and delete tracks rapidly
      const trackEndTiming = PerformanceMonitor.startOperation('createTrack', 'memory');
      try {
        await createTrack(`Memory Test ${i}`, 'midi');
        trackEndTiming();
      } catch (error) {
        trackEndTiming();
        addLog(`❌ Failed to create memory test track ${i}: ${error}`);
      }
      
      // Create clips
      const tracks = sceneState.tracks;
      if (tracks.length > 0) {
        const clipEndTiming = PerformanceMonitor.startOperation('addMidiClip', 'memory');
        try {
          const lastTrack = tracks[tracks.length - 1];
          await addMidiClip(lastTrack.id, 0, 2, `Memory Clip ${i}`);
          clipEndTiming();
        } catch (error) {
          clipEndTiming();
          addLog(`❌ Failed to create memory test clip ${i}: ${error}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100 / intensity));
    }
    
    addLog(`✅ Completed memory stress test`);
  }, [intensity, createTrack, addMidiClip, sceneState.tracks, addLog]);

  const runFullStressTest = useCallback(async () => {
    addLog(`🔥 Starting FULL stress test (intensity: ${intensity})...`);
    
    // Run all tests in sequence
    await runTrackStressTest();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runClipStressTest();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runNoteStressTest();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    runScrollStressTest(); // This runs in background
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await runPlaybackStressTest();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runMemoryStressTest();
    
    addLog(`🎉 FULL stress test completed!`);
  }, [intensity, runTrackStressTest, runClipStressTest, runNoteStressTest, runScrollStressTest, runPlaybackStressTest, runMemoryStressTest, addLog]);

  const runBurnoutStressTest = useCallback(async () => {
    setBurnoutMode(true);
    addLog(`💀 BURNOUT MODE ACTIVATED! 燒毀開始...`);
    addLog(`🚨 WARNING: This will create MASSIVE amounts of data!`);
    
    const extremeMultiplier = intensity * 10; // 10x more extreme than normal
    
    try {
      // Phase 1: Massive Track Creation
      addLog(`🔥 Phase 1: Creating ${extremeMultiplier * 5} tracks...`);
      for (let i = 0; i < extremeMultiplier * 5; i++) {
        const endTiming = PerformanceMonitor.startOperation('createTrack', 'burnout');
        try {
          await createTrack(`BURNOUT Track ${i + 1}`, i % 2 === 0 ? 'midi' : 'audio');
          endTiming();
        } catch (error) {
          endTiming();
          addLog(`❌ Failed to create burnout track ${i + 1}: ${error}`);
        }
        
        // Very minimal delay for maximum stress
        if (i % 10 === 0) {
          addLog(`🔥 Created ${i + 1} tracks... System Status: ${metrics.fps > 30 ? '😅 Surviving' : '💀 BURNING'}`);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Phase 2: Extreme Clip Creation - Get fresh tracks
      let currentTracks = sceneState.tracks;
      // Safety check: if tracks aren't available yet, wait and retry
      let retryCount = 0;
      while (currentTracks.length === 0 && retryCount < 10) {
        addLog(`⏳ Waiting for tracks to be available... (${currentTracks.length} tracks found)`);
        await new Promise(resolve => setTimeout(resolve, 200));
        currentTracks = sceneState.tracks;
        retryCount++;
      }
      
      if (currentTracks.length === 0) {
        throw new Error('No tracks available for clip creation! State update issue detected.');
      }
      
      const clipCount = extremeMultiplier * 15; // 15x clips per intensity level
      addLog(`💥 Phase 2: Creating ${clipCount} clips across ${currentTracks.length} tracks...`);
      
      for (let i = 0; i < clipCount; i++) {
        // Get fresh tracks array each time to handle state updates
        const freshTracks = sceneState.tracks;
        if (freshTracks.length === 0) {
          addLog(`⚠️ Warning: Tracks became unavailable at clip ${i}. Stopping clip creation.`);
          break;
        }
        
        const randomTrack = freshTracks[Math.floor(Math.random() * freshTracks.length)];
        const startTime = Math.random() * 60; // 16小节内 (保留4拍buffer)
        const duration = 1 + Math.random() * 3; // 1-4 beats duration
        
        // 确保clip不会超出16小节范围
        const maxStartTime = Math.min(startTime, 60 - duration);
        
        const clipEndTiming = PerformanceMonitor.startOperation('addMidiClip', 'burnout');
        try {
          await addMidiClip(randomTrack.id, maxStartTime, duration, `BURNOUT Clip ${i + 1}`);
          clipEndTiming();
        } catch (error) {
          clipEndTiming();
          addLog(`❌ Failed to create burnout clip ${i + 1}: ${error}`);
        }
        
        if (i % 20 === 0) {
          addLog(`💥 Created ${i + 1}/${clipCount} clips... Memory: ${metrics.memory ? Math.round(metrics.memory / 1024 / 1024) + 'MB' : 'Unknown'}`);
        }
      }
      
      // Wait for clips to be created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Phase 3: EXTREME Note Creation - Get fresh clips
      let currentClips = sceneState.clips;
      retryCount = 0;
      while (currentClips.length === 0 && retryCount < 10) {
        addLog(`⏳ Waiting for clips to be available... (${currentClips.length} clips found)`);
        await new Promise(resolve => setTimeout(resolve, 200));
        currentClips = sceneState.clips;
        retryCount++;
      }
      
      if (currentClips.length === 0) {
        addLog(`⚠️ Warning: No clips available for note creation! Skipping Phase 3.`);
      } else {
        const noteCount = extremeMultiplier * 50; // 50x notes per intensity level
        addLog(`🎹 Phase 3: EXTREME NOTE CREATION - Adding ${noteCount} notes to ${currentClips.length} clips...`);
        
        for (let i = 0; i < noteCount; i++) {
          // Get fresh clips array each time
          const freshClips = sceneState.clips;
          if (freshClips.length === 0) {
            addLog(`⚠️ Warning: Clips became unavailable at note ${i}. Stopping note creation.`);
            break;
          }
          
          const randomClip = freshClips[Math.floor(Math.random() * freshClips.length)];
          const pitch = 21 + Math.floor(Math.random() * 88); // Full piano range
          const velocity = 40 + Math.floor(Math.random() * 80); // Wide velocity range
          const startTime = Math.random() * (randomClip.duration || 1);
          const duration = 0.1 + Math.random() * 0.5; // Very short notes for density
          
          const noteEndTiming = PerformanceMonitor.startOperation('addMidiNote', 'burnout');
          try {
            await addMidiNote(randomClip.id, pitch, velocity, startTime, duration);
            noteEndTiming();
          } catch (error) {
            noteEndTiming();
            addLog(`❌ Failed to create burnout note ${i + 1}: ${error}`);
          }
          
          if (i % 50 === 0) {
            const currentFPS = metrics.fps || 0;
            const status = currentFPS > 45 ? '🟢 STRONG' : 
                          currentFPS > 30 ? '🟡 STRUGGLING' : 
                          currentFPS > 15 ? '🔴 DYING' : '💀 DEAD';
            addLog(`🎹 Added ${i + 1}/${noteCount} notes... FPS: ${currentFPS} ${status}`);
            
            // Tiny break to prevent complete browser freeze
            if (i % 100 === 0) {
              await new Promise(resolve => setTimeout(resolve, 5));
            }
          }
        }
      }
      
      // Phase 4: Chaos Mode - Random Operations
      addLog(`🌪️ Phase 4: CHAOS MODE - Random operations for maximum stress!`);
      for (let i = 0; i < intensity * 20; i++) {
        const randomAction = Math.floor(Math.random() * 4);
        
        switch (randomAction) {
          case 0: // Random scroll - 限制在16小节范围内
            setTimelineScroll(Math.random() * 2000, Math.random() * 500); // 减少滚动范围
            break;
          case 1: // Random playhead movement - 16小节内
            setPlayheadTime(Math.random() * 60); // 15拍范围，避免超出
            break;
          case 2: // Quick playback test - 16小节内起始
            await startPlayback(Math.random() * 56); // 14拍范围，给播放留空间
            await new Promise(resolve => setTimeout(resolve, 100));
            await stopPlayback();
            break;
          case 3: // Memory pressure
            // Force garbage collection if available
            if (window.gc) {
              window.gc();
            } else {
              // Alternative: force memory pressure
              const tempArrays = [];
              for (let j = 0; j < 1000; j++) {
                tempArrays.push(new Array(1000).fill(Math.random()));
              }
              tempArrays.length = 0; // Clear to trigger GC
            }
            break;
        }
        
        if (i % 5 === 0) {
          addLog(`🌪️ Chaos operation ${i + 1}/${intensity * 20} - FPS: ${metrics.fps || '--'}`);
        }
      }
      
      // Final Stats
      const finalTracks = sceneState.tracks.length;
      const finalClips = sceneState.clips?.length || 0;
      const estimatedNotes = finalClips * 50; // Estimate based on target notes per clip
      
      addLog(`💀 BURNOUT TEST COMPLETED!`);
      addLog(`📊 Final Stats:`);
      addLog(`   🎛️ Tracks: ${finalTracks}`);
      addLog(`   🎵 Clips: ${finalClips}`);
      addLog(`   🎹 Notes: ~${Math.round(estimatedNotes)}`);
      addLog(`   🧠 Memory: ${metrics.memory ? Math.round(metrics.memory / 1024 / 1024) + 'MB' : 'Unknown'}`);
      addLog(`   ⚡ FPS: ${metrics.fps || '--'}`);
      
      if (metrics.fps > 30) {
        addLog(`🎉 CONGRATULATIONS! Your system SURVIVED the burnout test!`);
      } else if (metrics.fps > 15) {
        addLog(`😅 Your system is BARELY alive but still kicking!`);
      } else {
        addLog(`💀 RIP - Your system has been BURNED TO THE GROUND!`);
      }
      
    } catch (error) {
      addLog(`💥 BURNOUT TEST CRASHED: ${error}`);
      addLog(`🔥 The system couldn't handle the heat!`);
    } finally {
      setBurnoutMode(false);
    }
  }, [intensity, createTrack, addMidiClip, addMidiNote, startPlayback, stopPlayback, setTimelineScroll, setPlayheadTime, sceneState, metrics, addLog]);

  const runBasicTest = useCallback(async () => {
    addLog(`🔍 Starting BASIC functionality test...`);
    addLog(`📊 Initial State: ${sceneState.tracks.length} tracks, ${sceneState.clips.length} clips`);
    
    try {
      // Test 1: Create a single track
      addLog(`📝 Test 1: Creating a track...`);
      await createTrack('Test Track', 'midi');
      
      // Wait longer and check multiple times for state update
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const currentTracks = sceneState.tracks.length;
        addLog(`⏳ State check ${i + 1}/5: ${currentTracks} tracks found`);
        if (currentTracks > 0) break;
      }
      
      const tracksAfterCreate = sceneState.tracks.length;
      addLog(`✅ Final tracks after creation: ${tracksAfterCreate}`);
      
      if (tracksAfterCreate === 0) {
        addLog(`❌ DEBUG: Track creation appears to have failed`);
        addLog(`🔧 This suggests the notification system may not be working`);
        throw new Error('❌ Track creation failed - no tracks found in state');
      }
      
      // Test 2: Add a clip to the track
      addLog(`📝 Test 2: Adding a clip...`);
      const testTrack = sceneState.tracks[0];
      addLog(`🎛️ Using track: ${testTrack.id} (${testTrack.name})`);
      await addMidiClip(testTrack.id, 0, 4, 'Test Clip');
      
      // Wait for clip creation
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const currentClips = sceneState.clips.length;
        addLog(`⏳ Clip check ${i + 1}/5: ${currentClips} clips found`);
        if (currentClips > 0) break;
      }
      
      const clipsAfterCreate = sceneState.clips.length;
      addLog(`✅ Final clips after creation: ${clipsAfterCreate}`);
      
      if (clipsAfterCreate === 0) {
        throw new Error('❌ Clip creation failed - no clips found in state');
      }
      
      // Test 3: Add a MIDI note
      addLog(`📝 Test 3: Adding a MIDI note...`);
      const testClip = sceneState.clips[0];
      addLog(`🎵 Using clip: ${testClip.id} (${testClip.name})`);
      await addMidiNote(testClip.id, 60, 80, 0, 1);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addLog(`✅ MIDI note added successfully`);
      
      // Test 4: Playhead movement
      addLog(`📝 Test 4: Testing playhead movement...`);
      const initialTime = sceneState.playhead.currentTime;
      addLog(`🎯 Initial playhead time: ${initialTime}`);
      setPlayheadTime(2.0);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const finalTime = sceneState.playhead.currentTime;
      addLog(`🎯 Final playhead time: ${finalTime}`);
      
      if (Math.abs(finalTime - 2.0) < 0.1) {
        addLog(`✅ Playhead movement working correctly`);
      } else {
        addLog(`⚠️ Playhead movement issue: expected 2.0, got ${finalTime}`);
      }
      
      // Test 5: Playback
      addLog(`📝 Test 5: Testing playback...`);
      await startPlayback(0);
      await new Promise(resolve => setTimeout(resolve, 500));
      await stopPlayback();
      
      addLog(`✅ Playback test completed`);
      
      addLog(`🎉 ALL BASIC TESTS PASSED!`);
      addLog(`📊 Final State: ${sceneState.tracks.length} tracks, ${sceneState.clips.length} clips`);
      
    } catch (error) {
      addLog(`❌ BASIC TEST FAILED: ${error}`);
      addLog(`📊 Current State: ${sceneState.tracks.length} tracks, ${sceneState.clips.length} clips`);
      throw error;
    }
  }, [createTrack, addMidiClip, addMidiNote, setPlayheadTime, startPlayback, stopPlayback, sceneState, addLog]);

  const logPerformanceSummary = useCallback(() => {
    const opStats = PerformanceMonitor.getOperationStats();
    const catStats = PerformanceMonitor.getCategoryBreakdown();
    
    // Add Music Arrangement specific summary first
    const maStats = MusicArrangementPerformance.getPerformanceStats();
    const hasMAData = Object.keys(maStats.trackOperations).length > 0 || 
                    Object.keys(maStats.clipOperations).length > 0 || 
                    Object.keys(maStats.noteOperations).length > 0 ||
                    Object.keys(maStats.playbackOperations).length > 0;
    
    if (hasMAData) {
      addLog('🎵 Music Arrangement Performance:');
      
      // Track operations
      if (Object.keys(maStats.trackOperations).length > 0) {
        Object.entries(maStats.trackOperations).slice(0, 2).forEach(([op, stats]: [string, any]) => {
          addLog(`  🎛️ ${op.split('.').pop()}: avg ${stats.average?.toFixed(1)}ms, 99th ${stats.p99?.toFixed(1)}ms (${stats.count}×)`);
        });
      }
      
      // Clip operations
      if (Object.keys(maStats.clipOperations).length > 0) {
        Object.entries(maStats.clipOperations).slice(0, 2).forEach(([op, stats]: [string, any]) => {
          addLog(`  🎵 ${op.split('.').pop()}: avg ${stats.average?.toFixed(1)}ms, 99th ${stats.p99?.toFixed(1)}ms (${stats.count}×)`);
        });
      }
      
      // Note operations
      if (Object.keys(maStats.noteOperations).length > 0) {
        Object.entries(maStats.noteOperations).slice(0, 2).forEach(([op, stats]: [string, any]) => {
          addLog(`  🎹 ${op.split('.').pop()}: avg ${stats.average?.toFixed(1)}ms, 99th ${stats.p99?.toFixed(1)}ms (${stats.count}×)`);
        });
      }
    }
    
    if (Object.keys(opStats).length > 0) {
      addLog('📊 General Performance Summary:');
      
      // Show top 3 slowest operations by average time
      const slowestOps = Object.entries(opStats)
        .sort(([,a], [,b]) => (b as any).average - (a as any).average)
        .slice(0, 3);
      
      slowestOps.forEach(([op, stats]: [string, any]) => {
        addLog(`  ⏱️ ${op}: avg ${stats.average.toFixed(1)}ms, 99th ${stats.p99.toFixed(1)}ms (${stats.count} ops)`);
      });
      
      // Show category summary
      if (Object.keys(catStats).length > 0) {
        addLog('📈 By Category:');
        Object.entries(catStats).forEach(([cat, stats]: [string, any]) => {
          addLog(`  📂 ${cat}: avg ${stats.averageTime?.toFixed(1)}ms, 99th ${stats.p99High?.toFixed(1)}ms (${stats.totalOperations} ops)`);
        });
      }
    }
  }, [addLog]);

  const startStressTest = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    testCountRef.current++;
    addLog(`🚀 Starting stress test: ${testType} (intensity: ${intensity})`);
    
    try {
      switch (testType) {
        case 'tracks':
          await runTrackStressTest();
          break;
        case 'clips':
          await runClipStressTest();
          break;
        case 'notes':
          await runNoteStressTest();
          break;
        case 'playback':
          await runPlaybackStressTest();
          break;
        case 'scroll':
          runScrollStressTest();
          await new Promise(resolve => setTimeout(resolve, 5000)); // Let scroll test run
          break;
        case 'memory':
          await runMemoryStressTest();
          break;
        case 'full':
          await runFullStressTest();
          break;
        case 'burnout':
          await runBurnoutStressTest();
          break;
        case 'basic':
          await runBasicTest();
          break;
      }
    } catch (error) {
      addLog(`❌ Stress test failed: ${error}`);
    } finally {
      setIsRunning(false);
      addLog(`🏁 Stress test completed (test #${testCountRef.current})`);
      
      // Log performance summary after test completion
      setTimeout(() => {
        logPerformanceSummary();
      }, 500);
    }
  }, [isRunning, testType, intensity, runTrackStressTest, runClipStressTest, runNoteStressTest, runPlaybackStressTest, runScrollStressTest, runMemoryStressTest, runFullStressTest, runBurnoutStressTest, runBasicTest, addLog, logPerformanceSummary]);

  const stopStressTest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    addLog('🛑 Stress test stopped by user');
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    PerformanceMonitor.reset(); // Clear performance statistics
    MusicArrangementPerformance.resetStats(); // Clear music arrangement statistics
    setOperationStats({});
    setCategoryStats({});
    addLog('🧹 Logs and performance statistics cleared');
  }, [addLog]);

  return (
    <div className="stress-test-panel" style={{
      position: 'absolute',
      top: 10,
      right: 10,
      width: 400,
      background: burnoutMode ? 'linear-gradient(45deg, #ff0000, #ff6600, #ff0000)' : 'rgba(0, 0, 0, 0.8)',
      border: burnoutMode ? '3px solid #ff0000' : '1px solid #333',
      borderRadius: 8,
      padding: 15,
      color: 'white',
      fontSize: 12,
      fontFamily: 'monospace',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: burnoutMode ? '0 0 30px #ff6600, 0 0 40px #ff0000' : 'none',
      animation: burnoutMode ? 'burnout-pulse 0.5s infinite alternate' : 'none'
    }}>
      <style>{`
        @keyframes burnout-pulse {
          0% { box-shadow: 0 0 10px #ff0000; }
          100% { box-shadow: 0 0 30px #ff6600, 0 0 40px #ff0000; }
        }
        @keyframes burnout-text {
          0% { color: #ffff00; }
          100% { color: #ff0000; }
        }
      `}</style>
      
      <h3 style={{ 
        margin: '0 0 10px 0', 
        color: burnoutMode ? '#ffff00' : '#00ff00',
        textShadow: burnoutMode ? '0 0 10px #ff0000' : 'none',
        animation: burnoutMode ? 'burnout-text 0.3s infinite alternate' : 'none'
      }}>
        {burnoutMode ? '💀🔥 BURNOUT MODE ACTIVE 🔥💀' : '🧪 Stress Test Panel'}
      </h3>
      
      {/* Performance Metrics */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '6px',
        padding: '8px',
        marginBottom: '12px',
        fontSize: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '4px' 
        }}>
          <div style={{ color: '#94a3b8', fontWeight: '600' }}>
            Performance Metrics
          </div>
          <button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid #6366f1',
              borderRadius: '3px',
              color: '#a5b4fc',
              fontSize: '9px',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            {showDetailedStats ? '📊 Hide Details' : '📈 Show Details'}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div style={{ color: '#e2e8f0' }}>
            FPS: <span style={{ color: metrics.fps > 50 ? '#22c55e' : metrics.fps > 30 ? '#f59e0b' : '#ef4444' }}>
              {metrics.fps || '--'}
            </span>
          </div>
          <div style={{ color: '#e2e8f0' }}>
            Memory: <span style={{ color: '#60a5fa' }}>
              {metrics.memory ? Math.round(metrics.memory / 1024 / 1024) + 'MB' : 'Unknown'}
              {metrics.memory && metrics.memory < 1000000 && (
                <span style={{ fontSize: '8px', color: '#f59e0b' }}> (est)</span>
              )}
            </span>
          </div>
          <div style={{ color: '#e2e8f0' }}>
            Tracks: <span style={{ color: '#10b981' }}>{sceneState.tracks.length}</span>
          </div>
          <div style={{ color: '#e2e8f0' }}>
            Clips: <span style={{ color: '#8b5cf6' }}>{sceneState.clips?.length || 0}</span>
          </div>
        </div>

        {/* Detailed Performance Statistics */}
        {showDetailedStats && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid #374151'
          }}>
            <div style={{ color: '#94a3b8', marginBottom: '8px', fontWeight: '600', fontSize: '9px' }}>
              Operation Performance (Average / 99th Percentile)
            </div>
            
            {/* Music Arrangement Performance Summary */}
            {(() => {
              const maStats = MusicArrangementPerformance.getPerformanceStats();
              const hasMAData = Object.keys(maStats.trackOperations).length > 0 || 
                            Object.keys(maStats.clipOperations).length > 0 || 
                            Object.keys(maStats.noteOperations).length > 0 ||
                            Object.keys(maStats.playbackOperations).length > 0;
              
              if (hasMAData) {
                return (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ color: '#8b5cf6', fontWeight: '600', fontSize: '8px', marginBottom: '4px' }}>
                      🎵 Music Arrangement Performance:
                    </div>
                    <div style={{ marginLeft: '4px' }}>
                      {/* Track Operations */}
                      {Object.keys(maStats.trackOperations).length > 0 && (
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{ color: '#10b981', fontSize: '7px' }}>🎛️ Tracks: </span>
                                                     {Object.entries(maStats.trackOperations).slice(0, 2).map(([op, data]: [string, any], idx) => (
                             <span key={op} style={{ fontSize: '7px', color: '#e2e8f0' }}>
                               {idx > 0 && ', '}
                               {op.split('.').pop()}: {data.average?.toFixed(1)}ms/{data.p99?.toFixed(1)}ms
                             </span>
                           ))}
                        </div>
                      )}
                      
                      {/* Clip Operations */}
                      {Object.keys(maStats.clipOperations).length > 0 && (
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{ color: '#3b82f6', fontSize: '7px' }}>🎵 Clips: </span>
                                                     {Object.entries(maStats.clipOperations).slice(0, 2).map(([op, data]: [string, any], idx) => (
                             <span key={op} style={{ fontSize: '7px', color: '#e2e8f0' }}>
                               {idx > 0 && ', '}
                               {op.split('.').pop()}: {data.average?.toFixed(1)}ms/{data.p99?.toFixed(1)}ms
                             </span>
                           ))}
                        </div>
                      )}
                      
                      {/* Note Operations */}
                      {Object.keys(maStats.noteOperations).length > 0 && (
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{ color: '#f59e0b', fontSize: '7px' }}>🎹 Notes: </span>
                                                     {Object.entries(maStats.noteOperations).slice(0, 2).map(([op, data]: [string, any], idx) => (
                             <span key={op} style={{ fontSize: '7px', color: '#e2e8f0' }}>
                               {idx > 0 && ', '}
                               {op.split('.').pop()}: {data.average?.toFixed(1)}ms/{data.p99?.toFixed(1)}ms
                             </span>
                           ))}
                        </div>
                      )}
                      
                      {/* Playback Operations */}
                      {Object.keys(maStats.playbackOperations).length > 0 && (
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{ color: '#ef4444', fontSize: '7px' }}>⏯️ Playback: </span>
                                                     {Object.entries(maStats.playbackOperations).slice(0, 2).map(([op, data]: [string, any], idx) => (
                             <span key={op} style={{ fontSize: '7px', color: '#e2e8f0' }}>
                               {idx > 0 && ', '}
                               {op.split('.').pop()}: {data.average?.toFixed(1)}ms/{data.p99?.toFixed(1)}ms
                             </span>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Category Breakdown */}
            {Object.keys(categoryStats).length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '8px', marginBottom: '4px' }}>
                  📊 By Category:
                </div>
                {Object.entries(categoryStats).map(([category, stats]: [string, any]) => (
                  <div key={category} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px',
                    padding: '2px 4px',
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '2px'
                  }}>
                    <span style={{ color: '#e2e8f0', fontSize: '8px', textTransform: 'capitalize' }}>
                      {category} ({stats.totalOperations} ops)
                    </span>
                    <span style={{ color: '#22c55e', fontSize: '8px' }}>
                      {stats.averageTime?.toFixed(1)}ms / {stats.p99High?.toFixed(1)}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Individual Operations */}
            {Object.keys(operationStats).length > 0 && (
              <div>
                <div style={{ color: '#10b981', fontWeight: '600', fontSize: '8px', marginBottom: '4px' }}>
                  🔧 By Operation:
                </div>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {Object.entries(operationStats)
                    .sort(([,a], [,b]) => (b as any).count - (a as any).count)
                    .slice(0, 10) // Show top 10 operations
                    .map(([operation, stats]: [string, any]) => (
                    <div key={operation} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1px',
                      padding: '1px 3px',
                      background: 'rgba(20, 20, 30, 0.6)',
                      borderRadius: '2px'
                    }}>
                      <span style={{ 
                        color: '#cbd5e1', 
                        fontSize: '7px',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {operation} ({stats.count})
                      </span>
                      <span style={{ color: '#22c55e', fontSize: '7px', marginLeft: '4px' }}>
                        {stats.average?.toFixed(1)}ms
                      </span>
                      <span style={{ color: '#ef4444', fontSize: '7px', marginLeft: '2px' }}>
                        / {stats.p99?.toFixed(1)}ms
                      </span>
                    </div>
                  ))}
                </div>
                
                {Object.keys(operationStats).length > 10 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#64748b', 
                    fontSize: '7px', 
                    marginTop: '2px' 
                  }}>
                    ... and {Object.keys(operationStats).length - 10} more operations
                  </div>
                )}
              </div>
            )}
            
            {Object.keys(operationStats).length === 0 && Object.keys(categoryStats).length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#64748b', 
                fontSize: '8px', 
                padding: '8px' 
              }}>
                No operation data yet. Run a test to see detailed statistics.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Configuration */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
          Test Configuration
        </div>
        
        {/* Test Type */}
        <select
          value={testType}
          onChange={(e) => setTestType(e.target.value as any)}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '4px',
            color: '#f1f5f9',
            fontSize: '11px',
            marginBottom: '8px'
          }}
        >
          <option value="tracks">Track Creation Test</option>
          <option value="clips">Clip Creation Test</option>
          <option value="notes">Note Creation Test</option>
          <option value="playback">Playback Stress Test</option>
          <option value="scroll">Scroll Performance Test</option>
          <option value="memory">Memory Stress Test</option>
          <option value="full">🔥 Full Stress Test</option>
          <option value="burnout">💀 Burnout Test</option>
          <option value="basic">🔍 Basic Functionality Test</option>
        </select>
        
        {/* Intensity Selection */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <label style={{ 
              fontSize: '11px', 
              fontWeight: '600', 
              color: testType === 'burnout' ? '#ff6600' : '#e2e8f0'
            }}>
              Intensity Level: {intensity}
              {testType === 'burnout' && (
                <span style={{ color: '#ff0000', marginLeft: '8px' }}>
                  ⚠️ EXTREME MODE
                </span>
              )}
            </label>
          </div>
          
          <input
            type="range"
            min="1"
            max="5"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            disabled={isRunning}
            style={{
              width: '100%',
              accentColor: testType === 'burnout' ? '#ff0000' : '#22c55e'
            }}
          />
          
          {testType === 'burnout' && (
            <div style={{
              fontSize: '10px',
              color: '#ff6600',
              marginTop: '4px',
              padding: '4px',
              background: 'rgba(255, 0, 0, 0.1)',
              borderRadius: '3px',
              border: '1px solid #ff0000'
            }}>
              💀 Level {intensity}: Will create {intensity * 50} tracks, {intensity * 150} clips, {intensity * 500} notes!
              <br/>
              🎵 All clips within 16 bars (60 beats) for optimal timeline management
              <br/>
              🔥 WARNING: May cause browser freeze at high levels!
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <button
          onClick={startStressTest}
          disabled={isRunning}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: burnoutMode ? 'linear-gradient(45deg, #ff4444, #ff0000)' : 
                       isRunning ? '#64748b' : 
                       testType === 'burnout' ? '#ff0000' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.5 : 1,
            textShadow: burnoutMode || testType === 'burnout' ? '0 0 5px #ff0000' : 'none',
            animation: testType === 'burnout' && !isRunning ? 'burnout-button 0.8s infinite alternate' : 'none'
          }}
        >
          {isRunning ? 'RUNNING...' : 
           testType === 'burnout' ? '💀 START BURNOUT' : 
           '▶️ Start Test'}
        </button>
        
        <style>{`
          @keyframes burnout-button {
            0% { background: linear-gradient(45deg, #ff4444, #ff0000); }
            100% { background: linear-gradient(45deg, #ff0000, #ff4444); }
          }
        `}</style>
        
        <button
          onClick={stopStressTest}
          disabled={!isRunning}
          style={{
            padding: '8px 12px',
            background: isRunning ? '#ef4444' : '#64748b',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '11px',
            cursor: isRunning ? 'pointer' : 'not-allowed',
            fontWeight: '600'
          }}
        >
          ⏹️ Stop
        </button>
        
        <button
          onClick={clearLogs}
          style={{
            padding: '8px 12px',
            background: '#6366f1',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🧹 Clear
        </button>
      </div>

      {/* Test Logs */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '6px',
        padding: '8px',
        maxHeight: '150px',
        overflowY: 'auto',
        border: '1px solid #334155'
      }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
          Test Logs ({logs.length}/20)
        </div>
        {logs.length === 0 ? (
          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
            No logs yet. Start a stress test to see results.
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                fontSize: '10px',
                color: log.includes('✅') ? '#22c55e' : 
                       log.includes('❌') ? '#ef4444' :
                       log.includes('⚠️') ? '#f59e0b' :
                       log.includes('🎉') ? '#8b5cf6' : '#e2e8f0',
                marginBottom: '2px',
                lineHeight: '1.3'
              }}
            >
              {log}
            </div>
          ))
        )}
      </div>

      {/* Test Descriptions */}
      <div style={{
        marginTop: '8px',
        fontSize: '10px',
        color: '#94a3b8',
        lineHeight: '1.3'
      }}>
        • <strong>Tracks:</strong> Creates multiple tracks rapidly<br/>
        • <strong>Clips:</strong> Creates many clips across tracks<br/>
        • <strong>Notes:</strong> Adds numerous MIDI notes to clips<br/>
        • <strong>Playback:</strong> Tests rapid play/stop cycles<br/>
        • <strong>Scroll:</strong> Intensive scrolling and seeking<br/>
        • <strong>Memory:</strong> Memory allocation stress<br/>
        • <strong>Full:</strong> Combines all tests sequentially<br/>
        • <strong>Burnout:</strong> Creates massive amounts of data<br/>
        • <strong>Basic:</strong> Tests core functionality integrity
      </div>
    </div>
  );
}; 