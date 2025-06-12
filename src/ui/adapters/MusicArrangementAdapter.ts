import { DAWSceneState, SceneTrack, SceneClip, MidiNote } from '../types/DAWSceneState';
import { PerformanceMonitor } from '../utils/PerformanceOptimizations';
import { MusicArrangementBridge } from './MusicArrangementBridge';

// MIDI Event interface
export interface MidiEvent {
  type: 'noteOn' | 'noteOff' | 'controlChange' | 'programChange';
  note?: number;
  velocity?: number;
  control?: number;
  value?: number;
  program?: number;
  timestamp: number;
}

// Command interfaces
export interface MusicArrangementCommands {
  createTrack: { type: 'audio' | 'midi'; name?: string };
  deleteTrack: { trackId: string };
  selectTrack: { trackId: string; isMultiSelect?: boolean };
  moveClip: { clipId: string; newTrackId: string; newStartTime: number };
  selectClip: { clipId: string; isMultiSelect?: boolean };
  addMidiClip: { trackId: string; startTime: number; duration: number; name?: string };
  resizeClip: { clipId: string; newStartTime: number; newDuration: number };
  setPlayheadTime: { time: number };
  addMidiNote: { clipId: string; pitch: number; velocity: number; startTime: number; duration: number };
  deleteMidiNote: { clipId: string; noteId: string };
  updateMidiNote: { clipId: string; noteId: string; updates: { pitch?: number; velocity?: number; startTime?: number; duration?: number } };
  updateTimelineProperty: { property: string; value: any };
  startPlayback: { startTime?: number };
  stopPlayback: {};
}

// Query interfaces
export interface MusicArrangementQueries {
  getTrackById: { trackId: string };
  getClipsInTimeRange: { startTime: number; endTime: number };
  getTracksByOwner: { ownerId: string };
}

// Result type for operations
export interface Result<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
}

interface StateUpdateFlags {
  shouldRedrawGrid: boolean;
  shouldRedrawWaveforms: boolean;
  shouldUpdateTracks: boolean;
  shouldUpdateClips: boolean;
  shouldUpdatePlayhead: boolean;
}

/**
 * Enhanced Music Arrangement Adapter with intelligent state management
 * Optimizes rendering performance through selective updates
 * Now with optional Business Context integration
 */
export class MusicArrangementAdapter {
  private currentState: DAWSceneState;
  private listeners: Set<(state: DAWSceneState) => void> = new Set();
  private nextTrackId = 1;
  private nextClipId = 1;
  private updateFlags: StateUpdateFlags = this.resetUpdateFlags();
  private notificationScheduled = false;
  private bcBridge: MusicArrangementBridge;

  // Audio playback engine
  private audioContext: AudioContext | null = null;
  private playbackIntervalId: number | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private bpm: number = 120; // beats per minute
  private activeOscillators: Map<string, { oscillator: OscillatorNode; gainNode: GainNode; endTime: number }> = new Map();
  private scheduledNotes: Set<string> = new Set(); // Track which notes have been scheduled

  constructor() {
    this.currentState = this.initializeState();
    
    // Initialize BC bridge
    this.bcBridge = new MusicArrangementBridge();
    
    // Initialize audio context
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎵 Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private resetUpdateFlags(): StateUpdateFlags {
    return {
      shouldRedrawGrid: false,
      shouldRedrawWaveforms: false,
      shouldUpdateTracks: false,
      shouldUpdateClips: false,
      shouldUpdatePlayhead: false
    };
  }

  private initializeState(): DAWSceneState {
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
        pixelsPerBeat: 80, // Increased from 32 to 80 for better alignment
        beatsPerMeasure: 4, 
        snapToGrid: true, 
        gridResolution: 0.25, 
        visibleTimeRange: { start: 0, end: 128 } // Extended from 32 to 128 beats
      },
      tracks: [],
      clips: [],
      playhead: { 
        currentTime: 0, 
        isVisible: true, 
        isPlaying: false, 
        color: '#ff4444' 
      },
      selection: { clips: [], tracks: [] },
      tools: { activeTool: 'select', toolSettings: {} },
      collaborators: [],
      markers: [],
      regions: [],
      shouldRedrawWaveforms: false,
      shouldRedrawGrid: true, // Initial grid draw
      lastUpdateTimestamp: Date.now()
    };
  }

  public getState(): DAWSceneState {
    return { ...this.currentState };
  }

  public subscribe(listener: (state: DAWSceneState) => void): () => void {
    this.listeners.add(listener);
    console.log('MusicArrangementAdapter: Listener added, total:', this.listeners.size);
    return () => {
      this.listeners.delete(listener);
      console.log('MusicArrangementAdapter: Listener removed, total:', this.listeners.size);
    };
  }

  private scheduleNotification(): void {
    if (this.notificationScheduled) return;

    this.notificationScheduled = true;
    
    // Use microtask to batch multiple updates
    Promise.resolve().then(() => {
      this.notifyListeners();
      this.notificationScheduled = false;
    });
  }

  private notifyListeners(): void {
    // Apply update flags to state
    this.currentState.shouldRedrawGrid = this.updateFlags.shouldRedrawGrid;
    this.currentState.shouldRedrawWaveforms = this.updateFlags.shouldRedrawWaveforms;
    this.currentState.lastUpdateTimestamp = Date.now();
    
    console.log('MusicArrangementAdapter: notifyListeners called. Listeners count:', this.listeners.size);
    console.log('Current state tracks:', this.currentState.tracks.length);
    console.log('Update flags:', this.updateFlags);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.currentState });
      } catch (error) {
        console.error('MusicArrangementAdapter: Error in listener:', error);
      }
    });
    
    // Reset flags after notification
    this.resetFlags();
  }

  private resetFlags(): void {
    this.updateFlags = this.resetUpdateFlags();
    this.currentState.shouldRedrawGrid = false;
    this.currentState.shouldRedrawWaveforms = false;
  }

  public async executeCommand<T extends keyof MusicArrangementCommands>(
    command: T,
    payload: MusicArrangementCommands[T]
  ): Promise<Result<void>> {
    console.log(`MusicArrangementAdapter: Executing ${command}:`, payload);
    
    try {
      switch (command) {
        case 'createTrack':
          await this.handleCreateTrack(payload as MusicArrangementCommands['createTrack']);
          this.updateFlags.shouldUpdateTracks = true;
          this.updateFlags.shouldRedrawGrid = true; // New track may affect grid
          break;
        case 'deleteTrack':
          await this.handleDeleteTrack(payload as MusicArrangementCommands['deleteTrack']);
          this.updateFlags.shouldUpdateTracks = true;
          this.updateFlags.shouldUpdateClips = true;
          this.updateFlags.shouldRedrawGrid = true;
          break;
        case 'selectTrack':
          await this.handleSelectTrack(payload as MusicArrangementCommands['selectTrack']);
          break;
        case 'moveClip':
          await this.handleMoveClip(payload as MusicArrangementCommands['moveClip']);
          this.updateFlags.shouldUpdateClips = true;
          break;
        case 'selectClip':
          await this.handleSelectClip(payload as MusicArrangementCommands['selectClip']);
          break;
        case 'addMidiClip':
          await this.handleAddMidiClip(payload as MusicArrangementCommands['addMidiClip']);
          this.updateFlags.shouldUpdateClips = true;
          break;
        case 'resizeClip':
          await this.handleResizeClip(payload as MusicArrangementCommands['resizeClip']);
          break;
        case 'setPlayheadTime':
          await this.handleSetPlayheadTime(payload as MusicArrangementCommands['setPlayheadTime']);
          this.updateFlags.shouldUpdatePlayhead = true;
          break;
        case 'addMidiNote':
          await this.handleAddMidiNote(payload as MusicArrangementCommands['addMidiNote']);
          this.updateFlags.shouldUpdateClips = true;
          break;
        case 'deleteMidiNote':
          await this.handleDeleteMidiNote(payload as MusicArrangementCommands['deleteMidiNote']);
          this.updateFlags.shouldUpdateClips = true;
          break;
        case 'updateMidiNote':
          await this.handleUpdateMidiNote(payload as MusicArrangementCommands['updateMidiNote']);
          this.updateFlags.shouldUpdateClips = true;
          break;
        case 'updateTimelineProperty':
          await this.handleUpdateTimelineProperty(payload as MusicArrangementCommands['updateTimelineProperty']);
          break;
        case 'startPlayback':
          await this.handleStartPlayback(payload as MusicArrangementCommands['startPlayback']);
          break;
        case 'stopPlayback':
          await this.handleStopPlayback(payload as MusicArrangementCommands['stopPlayback']);
          break;
        default:
          return { isSuccess: false, error: `Unknown command: ${command}` };
      }
      
      this.scheduleNotification();
      return { isSuccess: true };
    } catch (error) {
      console.error(`MusicArrangementAdapter: Error executing ${command}:`, error);
      return { 
        isSuccess: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async handleCreateTrack(payload: MusicArrangementCommands['createTrack']) {
    const endTiming = PerformanceMonitor.startOperation('handleCreateTrack', 'ui-adapter');
    console.log('MusicArrangementAdapter: handleCreateTrack called with payload:', payload);
    console.log('Current tracks before creation:', this.currentState.tracks.length);
    
    try {
      const newTrack: SceneTrack = {
        id: `track-${this.nextTrackId++}`,
        name: payload.name || 'New Track',
        type: payload.type,
        yPosition: 50 + (this.currentState.tracks.length * 80), // Start after 50px header to align with track panel
        height: 80,
        color: this.generateTrackColor(),
        isMuted: false,
        isSoloed: false,
        isSelected: false,
        volume: 1.0,
        isCollapsed: false,
        collaborators: []
      };

      // Create new state object with new track added (immutable update)
      this.currentState = {
        ...this.currentState,
        tracks: [...this.currentState.tracks, newTrack],
        lastUpdateTimestamp: Date.now()
      };
      
      // 🔧 CRITICAL FIX: Schedule notification to update React state
      this.updateFlags.shouldUpdateTracks = true;
      this.scheduleNotification();
      
      console.log('Track created:', newTrack);
      console.log('Total tracks after creation:', this.currentState.tracks.length);
      console.log('🔔 MusicArrangementAdapter: Track creation notification scheduled');
      endTiming();
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  private async handleDeleteTrack(payload: MusicArrangementCommands['deleteTrack']) {
    const trackIndex = this.currentState.tracks.findIndex(t => t.id === payload.trackId);
    if (trackIndex >= 0) {
      // Create new tracks array without the deleted track
      const updatedTracks = this.currentState.tracks.filter(t => t.id !== payload.trackId);
      // Update track positions
      updatedTracks.forEach((track, index) => {
        track.yPosition = 50 + (index * 80);
      });
      
      // Create new state object (immutable update)
      this.currentState = {
        ...this.currentState,
        tracks: updatedTracks,
        clips: this.currentState.clips.filter(c => c.trackId !== payload.trackId),
        lastUpdateTimestamp: Date.now()
      };
      
      // 🔧 Schedule notification for track deletion
      this.updateFlags.shouldUpdateTracks = true;
      this.updateFlags.shouldUpdateClips = true;
      this.scheduleNotification();
      
      console.log('MusicArrangementAdapter: Track deleted:', payload.trackId);
      console.log('🔔 MusicArrangementAdapter: Track deletion notification scheduled');
    }
  }

  private async handleSelectTrack(payload: MusicArrangementCommands['selectTrack']) {
    console.log('MusicArrangementAdapter: Selecting track:', payload.trackId);
    
    // Create new tracks array with updated selection state (immutable update)
    const updatedTracks = this.currentState.tracks.map(track => ({
      ...track,
      isSelected: track.id === payload.trackId
    }));
    
    // Create new state object
    this.currentState = {
      ...this.currentState,
      tracks: updatedTracks,
      selection: {
        ...this.currentState.selection,
        tracks: [payload.trackId]
      },
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateTracks = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Track selected:', payload.trackId);
  }

  private async handleMoveClip(payload: MusicArrangementCommands['moveClip']) {
    // Create new clips array with updated clip position (immutable update)
    const updatedClips = this.currentState.clips.map(clip => {
      if (clip.id === payload.clipId) {
        return {
          ...clip,
          trackId: payload.newTrackId,
          startTime: payload.newStartTime
        };
      }
      return clip;
    });

    // Create new state object
    this.currentState = {
      ...this.currentState,
      clips: updatedClips,
      lastUpdateTimestamp: Date.now()
    };
    
    // 🔧 Schedule notification for clip move
    this.updateFlags.shouldUpdateClips = true;
    this.scheduleNotification();
    
    console.log('MusicArrangementAdapter: Clip moved:', payload.clipId);
    console.log('🔔 MusicArrangementAdapter: Clip move notification scheduled');
  }

  private async handleSelectClip(payload: MusicArrangementCommands['selectClip']) {
    let updatedClips: SceneClip[];
    let selectedClips: string[];

    if (!payload.isMultiSelect) {
      // Clear existing selection and toggle the clicked clip
      updatedClips = this.currentState.clips.map(clip => ({
        ...clip,
        isSelected: clip.id === payload.clipId ? !clip.isSelected : false
      }));
      
      const targetClip = updatedClips.find(c => c.id === payload.clipId);
      selectedClips = targetClip?.isSelected ? [payload.clipId] : [];
    } else {
      // Multi-select: toggle the clicked clip
      updatedClips = this.currentState.clips.map(clip => ({
        ...clip,
        isSelected: clip.id === payload.clipId ? !clip.isSelected : clip.isSelected
      }));
      
      selectedClips = updatedClips.filter(c => c.isSelected).map(c => c.id);
    }

    // Create new state object (immutable update)
    this.currentState = {
      ...this.currentState,
      clips: updatedClips,
      selection: {
        ...this.currentState.selection,
        clips: selectedClips
      },
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateClips = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Clip selection changed:', payload.clipId);
  }

  private async handleAddMidiClip(payload: MusicArrangementCommands['addMidiClip']) {
    const endTiming = PerformanceMonitor.startOperation('handleAddMidiClip', 'ui-adapter');
    
    try {
      const newClip: SceneClip = {
        id: `clip-${this.nextClipId++}`,
        trackId: payload.trackId,
        name: payload.name || 'New Clip',
        startTime: payload.startTime,
        duration: payload.duration,
        color: '#4a90e2',
        isSelected: false,
        isDragging: false,
        isResizing: false,
        type: 'midi',
        midiData: {
          notes: [] // Start with empty notes array
        },
        collaboratorCursors: []
      };

      // Create new state object with new clip added (immutable update)
      this.currentState = {
        ...this.currentState,
        clips: [...this.currentState.clips, newClip],
        lastUpdateTimestamp: Date.now()
      };
      
      this.updateFlags.shouldUpdateClips = true;
      this.scheduleNotification();
      console.log('🎵 MusicArrangementAdapter: Empty MIDI clip added:', newClip.id);
      endTiming();
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  private async handleResizeClip(payload: MusicArrangementCommands['resizeClip']) {
    // Create new clips array with updated clip size and position (immutable update)
    const updatedClips = this.currentState.clips.map(clip => {
      if (clip.id === payload.clipId) {
        return {
          ...clip,
          startTime: payload.newStartTime,
          duration: payload.newDuration
        };
      }
      return clip;
    });

    // Create new state object
    this.currentState = {
      ...this.currentState,
      clips: updatedClips,
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateClips = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Clip resized:', payload.clipId, 'start:', payload.newStartTime, 'duration:', payload.newDuration);
  }

  private async handleSetPlayheadTime(payload: MusicArrangementCommands['setPlayheadTime']) {
    console.log('🎯 MusicArrangementAdapter: setPlayheadTime called with:', payload.time);
    console.log('🎯 MusicArrangementAdapter: Current playhead time:', this.currentState.playhead.currentTime);
    
    if (this.currentState.playhead.currentTime !== payload.time) {
      const oldTime = this.currentState.playhead.currentTime;
      
      // If this is a significant jump (more than 0.5 beats), clear scheduled notes to avoid overlaps
      if (Math.abs(payload.time - oldTime) > 0.5) {
        this.stopAllNotes();
        this.scheduledNotes.clear();
        console.log('🎯 Significant time jump detected, clearing scheduled notes');
      }
      
      // Create new state object with immutable update
      this.currentState = {
        ...this.currentState,
        playhead: {
          ...this.currentState.playhead,
          currentTime: payload.time
        },
        lastUpdateTimestamp: Date.now()
      };
      
      this.updateFlags.shouldUpdatePlayhead = true;
      
      console.log('🎯 MusicArrangementAdapter: Playhead time updated:', {
        from: oldTime,
        to: payload.time,
        shouldUpdatePlayhead: this.updateFlags.shouldUpdatePlayhead
      });
      
      this.scheduleNotification();
      console.log('🎯 MusicArrangementAdapter: Notification scheduled for playhead update');
    } else {
      console.log('🎯 MusicArrangementAdapter: Playhead time unchanged, no update needed');
    }
  }

  private async handleAddMidiNote(payload: MusicArrangementCommands['addMidiNote']) {
    const endTiming = PerformanceMonitor.startOperation('handleAddMidiNote', 'ui-adapter');
    
    try {
      const clip = this.currentState.clips.find(c => c.id === payload.clipId);
      if (!clip || clip.type !== 'midi') {
        throw new Error(`MIDI clip not found: ${payload.clipId}`);
      }

      if (!clip.midiData) {
        clip.midiData = { notes: [] };
      }

      const newNote: MidiNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pitch: payload.pitch,
        velocity: payload.velocity,
        startTime: payload.startTime,
        duration: payload.duration,
        isSelected: false
      };

      clip.midiData.notes.push(newNote);
      console.log('MusicArrangementAdapter: MIDI note added:', newNote.id, `pitch: ${newNote.pitch}`);
      endTiming();
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  private async handleDeleteMidiNote(payload: MusicArrangementCommands['deleteMidiNote']) {
    const clip = this.currentState.clips.find(c => c.id === payload.clipId);
    if (!clip || !clip.midiData) {
      throw new Error(`MIDI clip not found: ${payload.clipId}`);
    }

    const noteIndex = clip.midiData.notes.findIndex(n => n.id === payload.noteId);
    if (noteIndex === -1) {
      throw new Error(`MIDI note not found: ${payload.noteId}`);
    }

    clip.midiData.notes.splice(noteIndex, 1);
    console.log('MusicArrangementAdapter: MIDI note deleted:', payload.noteId);
  }

  private async handleUpdateMidiNote(payload: MusicArrangementCommands['updateMidiNote']) {
    const clip = this.currentState.clips.find(c => c.id === payload.clipId);
    if (!clip || !clip.midiData) {
      throw new Error(`MIDI clip not found: ${payload.clipId}`);
    }

    const note = clip.midiData.notes.find(n => n.id === payload.noteId);
    if (!note) {
      throw new Error(`MIDI note not found: ${payload.noteId}`);
    }

    // Update note properties
    if (payload.updates.pitch !== undefined) note.pitch = payload.updates.pitch;
    if (payload.updates.velocity !== undefined) note.velocity = payload.updates.velocity;
    if (payload.updates.startTime !== undefined) note.startTime = payload.updates.startTime;
    if (payload.updates.duration !== undefined) note.duration = payload.updates.duration;

    console.log('MusicArrangementAdapter: MIDI note updated:', payload.noteId);
  }

  private async handleUpdateTimelineProperty(payload: MusicArrangementCommands['updateTimelineProperty']) {
    // Implementation needed
    console.warn('MusicArrangementAdapter: updateTimelineProperty not implemented');
  }

  private async handleStartPlayback(payload: MusicArrangementCommands['startPlayback']) {
    const endTiming = PerformanceMonitor.startOperation('handleStartPlayback', 'ui-adapter');
    console.log('🎵 MusicArrangementAdapter: Starting playback', payload);
    
    try {
      // Set optional start time if provided
      if (payload.startTime !== undefined) {
        this.currentState = {
          ...this.currentState,
          playhead: {
            ...this.currentState.playhead,
            currentTime: payload.startTime
          }
        };
      }
      
      // Set playing state
      this.currentState = {
        ...this.currentState,
        playhead: {
          ...this.currentState.playhead,
          isPlaying: true
        },
        lastUpdateTimestamp: Date.now()
      };
      
      // Start the playback engine
      this.startPlaybackEngine();
      
      this.updateFlags.shouldUpdatePlayhead = true;
      this.scheduleNotification();
      
      console.log('🎵 MusicArrangementAdapter: Playback started at time:', this.currentState.playhead.currentTime);
      endTiming();
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  private async handleStopPlayback(payload: MusicArrangementCommands['stopPlayback']) {
    console.log('🎵 MusicArrangementAdapter: Stopping playback');
    
    // Set playing state to false
    this.currentState = {
      ...this.currentState,
      playhead: {
        ...this.currentState.playhead,
        isPlaying: false
      },
      lastUpdateTimestamp: Date.now()
    };
    
    // Stop the playback engine
    this.stopPlaybackEngine();
    this.stopAllNotes();
    this.scheduledNotes.clear();
    
    this.updateFlags.shouldUpdatePlayhead = true;
    this.scheduleNotification();
    
    console.log('🎵 MusicArrangementAdapter: Playback stopped');
  }

  private startPlaybackEngine(): void {
    if (this.playbackIntervalId !== null) {
      clearInterval(this.playbackIntervalId);
    }

    this.startTime = performance.now() - (this.currentState.playhead.currentTime * this.getSecondsPerBeat() * 1000);
    
    // Immediately schedule notes at the current playhead position
    console.log(`🎵 Starting playback at time: ${this.currentState.playhead.currentTime}`);
    this.scheduleMidiEvents(this.currentState.playhead.currentTime);
    
    // Update playhead at 60fps for smooth animation
    this.playbackIntervalId = window.setInterval(() => {
      if (this.currentState.playhead.isPlaying) {
        const elapsed = performance.now() - this.startTime;
        const currentTime = elapsed / 1000 / this.getSecondsPerBeat();
        
        // Update playhead position
        this.currentState = {
          ...this.currentState,
          playhead: {
            ...this.currentState.playhead,
            currentTime: currentTime
          },
          lastUpdateTimestamp: Date.now()
        };
        this.updateFlags.shouldUpdatePlayhead = true;
        
        // Schedule MIDI events for current time
        this.scheduleMidiEvents(currentTime);
        
        // 🔧 CRITICAL FIX: Notify listeners for smooth playhead animation
        this.scheduleNotification();
      }
    }, 1000 / 60); // 60fps
  }

  private stopPlaybackEngine(): void {
    if (this.playbackIntervalId !== null) {
      clearInterval(this.playbackIntervalId);
      this.playbackIntervalId = null;
    }
  }

  private getSecondsPerBeat(): number {
    return 60 / this.bpm; // seconds per beat
  }

  private scheduleMidiEvents(currentTime: number): void {
    // Look ahead window of 0.1 seconds in beats
    const lookAheadBeats = 0.1 / this.getSecondsPerBeat();
    const endTime = currentTime + lookAheadBeats;
    
    // Clean up finished notes
    this.cleanupFinishedNotes(currentTime);
    
    // Find all clips that should be playing
    this.currentState.clips.forEach(clip => {
      if (clip.type === 'midi' && clip.midiData?.notes && clip.midiData.notes.length > 0) {
        // Check if clip is active at current time
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          
          clip.midiData.notes.forEach(note => {
            const noteStartTime = clip.startTime + note.startTime;
            const noteEndTime = noteStartTime + note.duration;
            const noteId = `${clip.id}_${note.id}`;
            
            // Schedule note if it should start within the look-ahead window and hasn't been scheduled
            // Use a small tolerance (0.001 beats) to handle floating point precision issues
            const tolerance = 0.001;
            const shouldSchedule = noteStartTime >= (currentTime - tolerance) && 
                                  noteStartTime < endTime && 
                                  !this.scheduledNotes.has(noteId);
            
            if (shouldSchedule) {
              console.log(`🎵 Scheduling note: clip=${clip.id}, note=${note.id}, pitch=${note.pitch}, noteStartTime=${noteStartTime}, currentTime=${currentTime}, endTime=${endTime}`);
              this.scheduleNote(noteId, note.pitch, note.velocity, noteStartTime, noteEndTime);
              this.scheduledNotes.add(noteId);
            }
          });
        }
      }
    });
  }

  private scheduleNote(noteId: string, pitch: number, velocity: number, startTime: number, endTime: number): void {
    if (!this.audioContext) {
      console.warn('🎵 No audio context available for scheduling note');
      return;
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Convert MIDI note to frequency
    const frequency = 440 * Math.pow(2, (pitch - 69) / 12);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sawtooth';
    
    // Set volume based on velocity
    const volume = (velocity / 127) * 0.3;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    
    // Calculate audio timing
    const delayBeats = startTime - this.currentState.playhead.currentTime;
    const delaySeconds = delayBeats * this.getSecondsPerBeat();
    const audioStartTime = this.audioContext.currentTime + delaySeconds;
    const audioEndTime = audioStartTime + ((endTime - startTime) * this.getSecondsPerBeat());
    
    // Ensure start time is not in the past
    const actualStartTime = Math.max(audioStartTime, this.audioContext.currentTime);
    
    oscillator.start(actualStartTime);
    oscillator.stop(audioEndTime);
    
    // Store the oscillator info for cleanup
    this.activeOscillators.set(noteId, {
      oscillator,
      gainNode,
      endTime
    });
    
    console.log(`🎵 Scheduled note ${pitch} (${frequency.toFixed(1)}Hz): 
      startTime=${startTime}, endTime=${endTime}, duration=${endTime - startTime}
      delayBeats=${delayBeats}, delaySeconds=${delaySeconds.toFixed(3)}s
      audioStartTime=${audioStartTime.toFixed(3)}, actualStartTime=${actualStartTime.toFixed(3)}
      currentTime=${this.currentState.playhead.currentTime}, audioContextTime=${this.audioContext.currentTime.toFixed(3)}`);
  }

  private cleanupFinishedNotes(currentTime: number): void {
    // Remove notes that have finished playing
    this.activeOscillators.forEach((noteInfo, noteId) => {
      if (noteInfo.endTime <= currentTime) {
        this.activeOscillators.delete(noteId);
        this.scheduledNotes.delete(noteId);
      }
    });
  }

  private stopAllNotes(): void {
    this.activeOscillators.forEach((noteInfo, key) => {
      try {
        noteInfo.oscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();
    this.scheduledNotes.clear();
  }

  // Clean up resources
  public dispose(): void {
    this.stopPlaybackEngine();
    this.stopAllNotes();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.listeners.clear();
    console.log('🧹 MusicArrangementAdapter disposed');
  }

  private async handleSendMidiEvent(event: MidiEvent) {
    console.log(`🎵 MIDI Event: ${event.type}`, {
      note: event.note,
      velocity: event.velocity,
      timestamp: event.timestamp
    });
    
    // Here we would integrate with actual audio engine
    // For now, we'll use Web Audio API or Tone.js to play the note
    if (event.type === 'noteOn' && event.note && event.velocity) {
      this.playMidiNote(event.note, event.velocity);
    } else if (event.type === 'noteOff' && event.note) {
      this.stopMidiNote(event.note);
    }
  }

  public playMidiNote(midiNote: number, velocity: number) {
    try {
      // Create a simple oscillator for immediate playback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Convert MIDI note to frequency: freq = 440 * 2^((note - 69) / 12)
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sawtooth'; // Nice synth sound
      
      // Set volume based on velocity (0-127)
      const volume = (velocity / 127) * 0.3; // Max 30% volume
      gainNode.gain.value = volume;
      
      // Envelope: quick attack, sustain, then fade
      const currentTime = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01); // 10ms attack
      gainNode.gain.setValueAtTime(volume, currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5); // 500ms release
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.5);
      
      console.log(`🎵 Playing MIDI note ${midiNote} (${frequency.toFixed(2)}Hz) at velocity ${velocity}`);
    } catch (error) {
      console.error('Error playing MIDI note:', error);
    }
  }

  private stopMidiNote(midiNote: number) {
    // In a real implementation, we would track active oscillators and stop them
    console.log(`🎵 Stopping MIDI note ${midiNote}`);
  }

  // UI interaction methods
  public selectClip(clipId: string, isMultiSelect: boolean = false): void {
    let updatedClips: SceneClip[];
    let selectedClips: string[];

    if (!isMultiSelect) {
      // Clear existing selection and toggle the clicked clip
      updatedClips = this.currentState.clips.map(clip => ({
        ...clip,
        isSelected: clip.id === clipId ? !clip.isSelected : false
      }));
      
      const targetClip = updatedClips.find(c => c.id === clipId);
      selectedClips = targetClip?.isSelected ? [clipId] : [];
    } else {
      // Multi-select: toggle the clicked clip
      updatedClips = this.currentState.clips.map(clip => ({
        ...clip,
        isSelected: clip.id === clipId ? !clip.isSelected : clip.isSelected
      }));
      
      selectedClips = updatedClips.filter(c => c.isSelected).map(c => c.id);
    }

    // Create new state object (immutable update)
    this.currentState = {
      ...this.currentState,
      clips: updatedClips,
      selection: {
        ...this.currentState.selection,
        clips: selectedClips
      },
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateClips = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Clip selection changed:', clipId);
  }

  public setPlayheadTime(time: number): void {
    console.log('🎯 MusicArrangementAdapter: setPlayheadTime called with:', time);
    console.log('🎯 MusicArrangementAdapter: Current playhead time:', this.currentState.playhead.currentTime);
    
    if (this.currentState.playhead.currentTime !== time) {
      const oldTime = this.currentState.playhead.currentTime;
      
      // If this is a significant jump (more than 0.5 beats), clear scheduled notes to avoid overlaps
      if (Math.abs(time - oldTime) > 0.5) {
        this.stopAllNotes();
        this.scheduledNotes.clear();
        console.log('🎯 Significant time jump detected, clearing scheduled notes');
      }
      
      // Create new state object with immutable update
      this.currentState = {
        ...this.currentState,
        playhead: {
          ...this.currentState.playhead,
          currentTime: time
        },
        lastUpdateTimestamp: Date.now()
      };
      
      this.updateFlags.shouldUpdatePlayhead = true;
      
      console.log('🎯 MusicArrangementAdapter: Playhead time updated:', {
        from: oldTime,
        to: time,
        shouldUpdatePlayhead: this.updateFlags.shouldUpdatePlayhead
      });
      
      this.scheduleNotification();
      console.log('🎯 MusicArrangementAdapter: Notification scheduled for playhead update');
    } else {
      console.log('🎯 MusicArrangementAdapter: Playhead time unchanged, no update needed');
    }
  }

  public setTimelineScroll(scrollX: number, scrollY: number): void {
    const timeline = this.currentState.timeline;
    if (timeline.scrollX !== scrollX || timeline.scrollY !== scrollY) {
      timeline.scrollX = scrollX;
      timeline.scrollY = scrollY;
      
      // Update visible time range
      const visibleDuration = this.currentState.viewport.width / timeline.pixelsPerBeat;
      timeline.visibleTimeRange = {
        start: scrollX / timeline.pixelsPerBeat,
        end: (scrollX / timeline.pixelsPerBeat) + visibleDuration
      };
      
      this.updateFlags.shouldUpdateClips = true; // Clips may need repositioning
      this.updateFlags.shouldUpdatePlayhead = true; // Playhead position relative to view
      this.scheduleNotification();
      console.log('MusicArrangementAdapter: Timeline scroll updated:', { scrollX, scrollY });
    }
  }

  public setViewportSize(width: number, height: number): void {
    const viewport = this.currentState.viewport;
    if (viewport.width !== width || viewport.height !== height) {
      viewport.width = width;
      viewport.height = height;
      
      // Update visible time range based on new viewport
      const visibleDuration = width / this.currentState.timeline.pixelsPerBeat;
      this.currentState.timeline.visibleTimeRange.end = 
        this.currentState.timeline.visibleTimeRange.start + visibleDuration;
      
      this.updateFlags.shouldRedrawGrid = true; // Grid needs to be redrawn for new size
      this.scheduleNotification();
      console.log('MusicArrangementAdapter: Viewport size updated:', { width, height });
    }
  }

  /**
   * Force a redraw of waveforms (expensive operation)
   */
  public forceWaveformRedraw(): void {
    this.updateFlags.shouldRedrawWaveforms = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Waveform redraw forced');
  }

  /**
   * Force a redraw of the grid
   */
  public forceGridRedraw(): void {
    this.updateFlags.shouldRedrawGrid = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Grid redraw forced');
  }

  private generateTrackColor(): string {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    return colors[this.nextTrackId % colors.length];
  }

  private updateTrackPositions(): void {
    this.currentState.tracks.forEach((track, index) => {
      track.yPosition = 50 + (index * 80); // Start after 50px header to align with track panel
    });
  }

  // sendMidiEvent is no longer needed - use playMidiNote directly

  public addMidiNote(clipId: string, pitch: number, velocity: number, startTime: number, duration: number): Promise<Result<void>> {
    return this.executeCommand('addMidiNote', { clipId, pitch, velocity, startTime, duration });
  }

  public deleteMidiNote(clipId: string, noteId: string): Promise<Result<void>> {
    return this.executeCommand('deleteMidiNote', { clipId, noteId });
  }

  public updateMidiNote(clipId: string, noteId: string, updates: { pitch?: number; velocity?: number; startTime?: number; duration?: number }): Promise<Result<void>> {
    return this.executeCommand('updateMidiNote', { clipId, noteId, updates });
  }

  // Track management methods
  public reorderTracks(trackIds: string[]): void {
    console.log('MusicArrangementAdapter: Reordering tracks:', trackIds);
    
    // Create new track array based on the new order
    const reorderedTracks: SceneTrack[] = [];
    
    trackIds.forEach((trackId, index) => {
      const track = this.currentState.tracks.find(t => t.id === trackId);
      if (track) {
        // Update position based on new index
        const updatedTrack = {
          ...track,
          yPosition: 50 + (index * 80) // Recalculate position
        };
        reorderedTracks.push(updatedTrack);
      }
    });
    
    // Create new state object with reordered tracks (immutable update)
    this.currentState = {
      ...this.currentState,
      tracks: reorderedTracks,
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateTracks = true;
    this.scheduleNotification();
    
    console.log('MusicArrangementAdapter: Tracks reordered successfully');
  }

  public selectTrack(trackId: string): void {
    console.log('MusicArrangementAdapter: Selecting track:', trackId);
    
    // Create new tracks array with updated selection state (immutable update)
    const updatedTracks = this.currentState.tracks.map(track => ({
      ...track,
      isSelected: track.id === trackId
    }));
    
    // Create new state object
    this.currentState = {
      ...this.currentState,
      tracks: updatedTracks,
      selection: {
        ...this.currentState.selection,
        tracks: [trackId]
      },
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateTracks = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Track selected:', trackId);
  }

  public updateTrackProperty(trackId: string, property: string, value: any): void {
    console.log('MusicArrangementAdapter: Updating track property:', trackId, property, value);
    
    // Find track and create new tracks array with updated property (immutable update)
    const updatedTracks = this.currentState.tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          [property]: value
        };
      }
      return track;
    });
    
    // Create new state object
    this.currentState = {
      ...this.currentState,
      tracks: updatedTracks,
      lastUpdateTimestamp: Date.now()
    };
    
    this.updateFlags.shouldUpdateTracks = true;
    this.scheduleNotification();
    console.log('MusicArrangementAdapter: Track property updated');
  }

  // Playback control methods
  public setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
    console.log(`🎵 BPM set to ${this.bpm}`);
  }

  public getBPM(): number {
    return this.bpm;
  }

  public isPlaying(): boolean {
    return this.currentState.playhead.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentState.playhead.currentTime;
  }
} 