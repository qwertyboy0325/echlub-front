import { injectable, inject } from 'inversify';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import { PerformanceMonitor } from '../../../../ui/utils/PerformanceOptimizations';

// Command Handlers
import type { CreateTrackCommandHandler } from '../handlers/CreateTrackCommandHandler';
import type { CreateMidiClipCommandHandler } from '../handlers/CreateMidiClipCommandHandler';
import type { CreateAudioClipCommandHandler } from '../handlers/CreateAudioClipCommandHandler';
import type { AddMidiNoteCommandHandler } from '../handlers/AddMidiNoteCommandHandler';
import type { QuantizeMidiClipCommandHandler } from '../handlers/QuantizeMidiClipCommandHandler';
import type { TransposeMidiClipCommandHandler } from '../handlers/TransposeMidiClipCommandHandler';

// Commands
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { CreateMidiClipCommand } from '../commands/CreateMidiClipCommand';
import { CreateAudioClipCommand } from '../commands/CreateAudioClipCommand';
import { AddMidiNoteCommand } from '../commands/AddMidiNoteCommand';
import { QuantizeMidiClipCommand } from '../commands/QuantizeMidiClipCommand';
import { TransposeMidiClipCommand } from '../commands/TransposeMidiClipCommand';

// Domain types
import { TrackId } from '../../domain/value-objects/TrackId';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackType } from '../../domain/value-objects/TrackType';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import { InstrumentRef } from '../../domain/value-objects/InstrumentRef';
import { ClipMetadata } from '../../domain/value-objects/ClipMetadata';
import { AudioSourceRef } from '../../domain/value-objects/AudioSourceRef';
import { QuantizeValue } from '../../domain/value-objects/QuantizeValue';
import { DomainError } from '../../domain/errors/DomainError';
import { ClipType } from '../../domain/value-objects/ClipType';
import type { Clip } from '../../domain/entities/Clip';
import type { MidiClip } from '../../domain/entities/MidiClip';
import { PeerId } from '../../domain/events/TrackEvents';

// Services
import type { UndoRedoService } from './UndoRedoService';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';

/**
 * Simplified Music Arrangement Service
 * Direct command handler usage for testing
 */
@injectable()
export class SimpleMusicArrangementService {
  // Global adapter instance to ensure consistency
  private static globalAdapter: any = null;
  
  constructor(
    @inject(MusicArrangementTypes.CreateTrackCommandHandler)
    private readonly createTrackHandler: CreateTrackCommandHandler,
    @inject(MusicArrangementTypes.CreateMidiClipCommandHandler)
    private readonly createMidiClipHandler: CreateMidiClipCommandHandler,
    @inject(MusicArrangementTypes.CreateAudioClipCommandHandler)
    private readonly createAudioClipHandler: CreateAudioClipCommandHandler,
    @inject(MusicArrangementTypes.AddMidiNoteCommandHandler)
    private readonly addMidiNoteHandler: AddMidiNoteCommandHandler,
    @inject(MusicArrangementTypes.QuantizeMidiClipCommandHandler)
    private readonly quantizeMidiClipHandler: QuantizeMidiClipCommandHandler,
    @inject(MusicArrangementTypes.TransposeMidiClipCommandHandler)
    private readonly transposeMidiClipHandler: TransposeMidiClipCommandHandler,
    @inject(MusicArrangementTypes.UndoRedoService)
    private readonly undoRedoService: UndoRedoService,
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  /**
   * Get or create global ToneJsIntegratedAdapter instance
   */
  private async getGlobalAdapter(): Promise<any> {
    if (!SimpleMusicArrangementService.globalAdapter) {
      console.log('🔧 [Service] Creating new global ToneJsIntegratedAdapter...');
      const { ToneJsIntegratedAdapter } = await import('../../integration/adapters/ToneJsIntegratedAdapter');
      SimpleMusicArrangementService.globalAdapter = new ToneJsIntegratedAdapter();
      
      console.log('🔧 [Service] Initializing global ToneJsIntegratedAdapter...');
      await SimpleMusicArrangementService.globalAdapter.initialize();
      
      console.log('🔧 [Service] Checking adapter initialization...');
      const session = SimpleMusicArrangementService.globalAdapter.getCurrentSession();
      if (session) {
        console.log('✅ [Service] Global ToneJsIntegratedAdapter created and initialized successfully');
        console.log(`🔧 [Service] Session ID: ${session.id}`);
      } else {
        console.error('❌ [Service] Adapter initialization failed - no session created');
        throw new Error('Adapter initialization failed - no session created');
      }
    } else {
      console.log('🔧 [Service] Using existing global ToneJsIntegratedAdapter');
      
      // Verify the existing adapter is still properly initialized
      const session = SimpleMusicArrangementService.globalAdapter.getCurrentSession();
      if (!session) {
        console.warn('⚠️ [Service] Existing adapter has no session, reinitializing...');
        await SimpleMusicArrangementService.globalAdapter.initialize();
        
        const newSession = SimpleMusicArrangementService.globalAdapter.getCurrentSession();
        if (!newSession) {
          console.error('❌ [Service] Adapter reinitialization failed');
          throw new Error('Adapter reinitialization failed');
        }
        console.log('✅ [Service] Adapter reinitialized successfully');
      }
    }
    return SimpleMusicArrangementService.globalAdapter;
  }

  async createTrack(ownerId: string, type: string, name: string): Promise<string> {
    const endTiming = PerformanceMonitor.startOperation('service.createTrack', 'music-arrangement');
    
    try {
      const trackType = TrackType.fromString(type);
      const command = new CreateTrackCommand(ownerId, trackType, name, ownerId);
      
      // Time the command handler execution
      const handlerEndTiming = PerformanceMonitor.startOperation('createTrackHandler.handle', 'domain');
      const trackId = await this.createTrackHandler.handle(command);
      handlerEndTiming();
      
      console.log(`🔧 [Service] Track created with ID: ${trackId}, attempting to add to global adapter...`);
      
      // Automatically add the track to the global adapter
      try {
        console.log(`🔧 [Service] Loading track from repository: ${trackId}`);
        
        const repoEndTiming = PerformanceMonitor.startOperation('trackRepository.loadWithClips', 'domain');
        const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
        repoEndTiming();
        
        if (track) {
          console.log(`🔧 [Service] Track loaded successfully: ${track.name}, type: ${track.trackType.value}`);
          const toneJsAdapter = await this.getGlobalAdapter();
          console.log(`🔧 [Service] Global adapter obtained, creating track in adapter...`);
          
          const adapterEndTiming = PerformanceMonitor.startOperation('adapter.createTrackFromAggregate', 'integration');
          await toneJsAdapter.createTrackFromAggregate(track);
          adapterEndTiming();
          
          console.log(`🔧 Track automatically added to global adapter: ${trackId}`);
        } else {
          console.warn(`⚠️ Track not found in repository after creation: ${trackId}`);
        }
      } catch (adapterError) {
        console.warn(`⚠️ Failed to add track to adapter: ${adapterError instanceof Error ? adapterError.message : String(adapterError)}`);
        console.error('Full adapter error:', adapterError);
        // Don't fail the track creation if adapter fails
      }
      
      endTiming();
      return trackId;
    } catch (error) {
      endTiming();
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async createMidiClip(
    trackId: string,
    timeRange: { startTime: number; endTime: number },
    instrument: { type: string; name: string },
    name: string
  ): Promise<string> {
    const endTiming = PerformanceMonitor.startOperation('service.createMidiClip', 'music-arrangement');
    
    try {
      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime - timeRange.startTime);
      const instrumentRef = InstrumentRef.synth(instrument.type, instrument.name);
      const metadata = ClipMetadata.create(name);
      
      const command = new CreateMidiClipCommand(
        TrackId.fromString(trackId),
        range,
        instrumentRef,
        metadata,
        name,
        'default-user'
      );
      
      const handlerEndTiming = PerformanceMonitor.startOperation('createMidiClipHandler.handle', 'domain');
      const clipId = await this.createMidiClipHandler.handle(command);
      handlerEndTiming();
      
      endTiming();
      return clipId.toString();
    } catch (error) {
      endTiming();
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async createAudioClip(
    trackId: string,
    timeRange: { startTime: number; endTime: number },
    audioSource: { url: string; name: string },
    name: string
  ): Promise<string> {
    try {
      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime - timeRange.startTime);
      const audioSourceRef = AudioSourceRef.sample(audioSource.name, audioSource.url);
      const metadata = ClipMetadata.create(name);
      
      const command = new CreateAudioClipCommand(
        TrackId.fromString(trackId),
        range,
        audioSourceRef,
        metadata,
        'default-user'
      );
      
      const clipId = await this.createAudioClipHandler.handle(command);
      return clipId.toString();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async addMidiNote(
    trackId: string,
    clipId: string,
    pitch: number,
    velocity: number,
    timeRange: { startTime: number; endTime: number }
  ): Promise<string> {
    const endTiming = PerformanceMonitor.startOperation('service.addMidiNote', 'music-arrangement');
    
    try {
      const range = new TimeRangeVO(timeRange.startTime, timeRange.endTime - timeRange.startTime);
      
      const command = new AddMidiNoteCommand(
        TrackId.fromString(trackId),
        ClipId.fromString(clipId),
        pitch,
        velocity,
        range,
        'default-user'
      );
      
      const handlerEndTiming = PerformanceMonitor.startOperation('addMidiNoteHandler.handle', 'domain');
      const noteId = await this.addMidiNoteHandler.handle(command);
      handlerEndTiming();
      
      endTiming();
      return noteId.toString();
    } catch (error) {
      endTiming();
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async quantizeMidiClip(trackId: string, clipId: string, quantizeValue: string): Promise<void> {
    try {
      const quantize = QuantizeValue.fromString(quantizeValue);
      
      const command = new QuantizeMidiClipCommand(
        TrackId.fromString(trackId),
        ClipId.fromString(clipId),
        quantize,
        'default-user'
      );
      
      await this.quantizeMidiClipHandler.handle(command);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async transposeMidiClip(trackId: string, clipId: string, semitones: number): Promise<void> {
    try {
      const command = new TransposeMidiClipCommand(
        TrackId.fromString(trackId),
        ClipId.fromString(clipId),
        semitones,
        'default-user'
      );
      
      await this.transposeMidiClipHandler.handle(command);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }

  async undo(trackId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.undoRedoService.undo(trackId, userId);
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async redo(trackId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.undoRedoService.redo(trackId, userId);
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getSystemStats(): Promise<{ trackCount: number; clipCount: number; eventCount: number }> {
    // Simple implementation for testing
    return {
      trackCount: 1,
      clipCount: 0,
      eventCount: 0
    };
  }

  /**
   * Play a track with all its clips
   */
  async playTrack(trackId: string): Promise<void> {
    try {
      // Load track with clips from repository
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
      if (!track) {
        throw new Error(`Track not found: ${trackId}`);
      }

      // Get ToneJsIntegratedAdapter from container
      const { ToneJsIntegratedAdapter } = await import('../../integration/adapters/ToneJsIntegratedAdapter');
      const toneJsAdapter = new ToneJsIntegratedAdapter();
      await toneJsAdapter.initialize();

      // Schedule the entire track for playback
      await toneJsAdapter.scheduleTrackFromAggregate(track, '0:0:0');
      
      // Start playback
      toneJsAdapter.startPlayback();

      console.log(`Track playback started: ${trackId}`);
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  /**
   * Play a specific MIDI clip
   */
  async playMidiClip(trackId: string, clipId: string): Promise<void> {
    try {
      console.log(`[SimpleMusicArrangementService] Starting playMidiClip: trackId=${trackId}, clipId=${clipId}`);
      
      // Load track with clips
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
      if (!track) {
        throw new Error(`Track not found: ${trackId}`);
      }
      console.log(`[SimpleMusicArrangementService] Track loaded: ${track.name}, clips count: ${track.clips.size}`);

      // Find the specific clip
      const clip = Array.from(track.clips.values()).find(c => c.clipId.toString() === clipId) as Clip;
      if (!clip) {
        throw new Error(`Clip not found: ${clipId}`);
      }
      console.log(`[SimpleMusicArrangementService] Clip found: ${clip.getType()}`);

      // Check if it's a MIDI clip
      if (clip.getType() !== ClipType.MIDI) {
        throw new Error(`Clip ${clipId} is not a MIDI clip`);
      }

      // Get global ToneJsIntegratedAdapter
      const toneJsAdapter = await this.getGlobalAdapter();
      console.log(`[SimpleMusicArrangementService] Global ToneJsIntegratedAdapter obtained`);

      // Check if track already exists in adapter
      const currentSession = toneJsAdapter.getCurrentSession();
      const trackExists = currentSession?.tracks.has(trackId);
      console.log(`[SimpleMusicArrangementService] Track exists in adapter: ${trackExists}`);

      // Create track in adapter if needed
      if (!trackExists) {
        console.log(`[SimpleMusicArrangementService] Creating track in adapter...`);
        await toneJsAdapter.createTrackFromAggregate(track);
        console.log(`[SimpleMusicArrangementService] Track created in adapter`);
      } else {
        console.log(`[SimpleMusicArrangementService] Track already exists in adapter, skipping creation`);
      }

      // Debug: Check adapter state before scheduling
      console.log(`[SimpleMusicArrangementService] Adapter state before scheduling:`);
      await this.debugAdapterState();

      // 🔧 CRITICAL FIX: Start transport BEFORE scheduling notes
      console.log(`[SimpleMusicArrangementService] Starting transport BEFORE scheduling...`);
      toneJsAdapter.startPlayback();
      console.log(`[SimpleMusicArrangementService] Transport started, now scheduling MIDI clip...`);

      // Schedule the MIDI clip
      console.log(`[SimpleMusicArrangementService] Scheduling MIDI clip...`);
      await toneJsAdapter.scheduleMidiClipFromEntity(trackId, clip as any, '0:0:0');
      console.log(`[SimpleMusicArrangementService] MIDI clip scheduled`);
      
      // Debug: Test audio chain
      console.log(`[SimpleMusicArrangementService] Testing audio chain...`);
      await this.debugAudioChain(trackId);
      
      console.log(`✅ MIDI clip playback started: ${clipId} on track ${trackId}`);
    } catch (error) {
      console.error('❌ Error playing MIDI clip:', error);
      throw error;
    }
  }

  /**
   * Stop playback
   */
  async stopPlayback(): Promise<void> {
    try {
      // This would stop the global transport
      // For now, we'll just log it
      console.log('Playback stopped');
    } catch (error) {
      console.error('Error stopping playback:', error);
      throw error;
    }
  }

  /**
   * Play all tracks (global playback)
   */
  async playAllTracks(): Promise<void> {
    try {
      console.log('Starting global playback for all tracks...');

      // Get ToneJsIntegratedAdapter
      const { ToneJsIntegratedAdapter } = await import('../../integration/adapters/ToneJsIntegratedAdapter');
      const toneJsAdapter = new ToneJsIntegratedAdapter();
      await toneJsAdapter.initialize();

      // Get all available tracks
      const trackIds = await this.getAllTracks();
      console.log(`Found ${trackIds.length} tracks for playback`);

      if (trackIds.length === 0) {
        console.log('No tracks available for playback');
        // Still start the transport for UI feedback
        toneJsAdapter.startPlayback();
        return;
      }

      // Schedule all tracks for playback
      await this.scheduleAllTracksForPlayback(trackIds);
      
      // Start the global transport
      toneJsAdapter.startPlayback();

      console.log(`Global playback started - ${trackIds.length} tracks scheduled`);

    } catch (error) {
      console.error('Error starting global playback:', error);
      throw error;
    }
  }

  /**
   * Stop all tracks (global stop)
   */
  async stopAllTracks(): Promise<void> {
    try {
      console.log('Stopping global playback...');

      // Get ToneJsIntegratedAdapter
      const { ToneJsIntegratedAdapter } = await import('../../integration/adapters/ToneJsIntegratedAdapter');
      const toneJsAdapter = new ToneJsIntegratedAdapter();
      await toneJsAdapter.initialize();

      // Stop the global transport
      toneJsAdapter.stopPlayback();

      console.log('Global playback stopped');
    } catch (error) {
      console.error('Error stopping global playback:', error);
      throw error;
    }
  }

  /**
   * Create master bus (hidden track for global mixing)
   */
  private async createMasterBus(): Promise<string> {
    try {
      const masterBusId = 'master_bus_' + Date.now();
      
      // Create a hidden bus track
      const trackType = TrackType.fromString('bus');
      const command = new CreateTrackCommand('system', trackType, 'Master Bus', 'system');
      
      const busId = await this.createTrackHandler.handle(command);
      
      console.log(`Master bus created: ${busId}`);
      return busId;
      
    } catch (error) {
      console.error('Error creating master bus:', error);
      // Return a fallback ID if creation fails
      return 'master_bus_fallback';
    }
  }

  /**
   * Get all tracks for global playback
   */
  async getAllTracks(): Promise<string[]> {
    try {
      console.log('Getting all tracks for playback...');
      
      // Get all tracks that have clips (these are the ones we want to play)
      const tracksWithClips = await this.trackRepository.findTracksWithClips();
      
      // Also get empty tracks (in case user wants to play them too)
      const emptyTracks = await this.trackRepository.findEmptyTracks();
      
      // Combine both lists
      const allTracks = [...tracksWithClips, ...emptyTracks];
      
      // Extract track IDs
      const trackIds = allTracks.map(track => track.trackId.toString());
      
      console.log(`Found ${trackIds.length} tracks for playback: ${trackIds.join(', ')}`);
      return trackIds;
      
    } catch (error) {
      console.error('Error getting all tracks:', error);
      
      // Fallback: try to get tracks by a known owner (if any)
      try {
        // Use a common owner ID that might exist
        const ownerId: PeerId = {
          toString: () => 'user123',
          equals: (other: PeerId) => other.toString() === 'user123'
        };
        
        const ownerTracks = await this.trackRepository.findByOwnerId(ownerId);
        const trackIds = ownerTracks.map(track => track.trackId.toString());
        
        console.log(`Fallback: Found ${trackIds.length} tracks by owner: ${trackIds.join(', ')}`);
        return trackIds;
        
      } catch (fallbackError) {
        console.error('Fallback track retrieval also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Schedule all tracks for playback
   */
  async scheduleAllTracksForPlayback(trackIds: string[]): Promise<void> {
    try {
      if (trackIds.length === 0) {
        console.log('No tracks to schedule for playback');
        return;
      }

      // Get ToneJsIntegratedAdapter
      const { ToneJsIntegratedAdapter } = await import('../../integration/adapters/ToneJsIntegratedAdapter');
      const toneJsAdapter = new ToneJsIntegratedAdapter();
      await toneJsAdapter.initialize();

      // Schedule each track
      for (const trackId of trackIds) {
        try {
          const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
          if (track) {
            await toneJsAdapter.scheduleTrackFromAggregate(track, '0:0:0');
            console.log(`Track scheduled: ${trackId}`);
          }
        } catch (error) {
          console.error(`Error scheduling track ${trackId}:`, error);
          // Continue with other tracks
        }
      }

      console.log(`All tracks scheduled for playback: ${trackIds.length} tracks`);
      
    } catch (error) {
      console.error('Error scheduling tracks for playback:', error);
      throw error;
    }
  }

  /**
   * Play a single MIDI note immediately (for preview/testing)
   */
  async playMidiNote(
    midiNote: number, 
    velocity: number = 100, 
    duration: number = 1000,
    instrument: string = 'synth'
  ): Promise<void> {
    try {
      // Get global ToneJsIntegratedAdapter
      const toneJsAdapter = await this.getGlobalAdapter();

      // Play the MIDI note directly
      await toneJsAdapter.playMidiNote(midiNote, velocity, duration, instrument);

      console.log(`MIDI note played: ${midiNote} (velocity: ${velocity}, duration: ${duration}ms, instrument: ${instrument})`);
    } catch (error) {
      console.error('Error playing MIDI note:', error);
      throw error;
    }
  }

  /**
   * Play a chord (multiple MIDI notes simultaneously)
   */
  async playMidiChord(
    midiNotes: number[], 
    velocity: number = 100, 
    duration: number = 1000,
    instrument: string = 'synth'
  ): Promise<void> {
    try {
      // Get global ToneJsIntegratedAdapter
      const toneJsAdapter = await this.getGlobalAdapter();

      // Play all notes simultaneously
      const playPromises = midiNotes.map(note => 
        toneJsAdapter.playMidiNote(note, velocity, duration, instrument)
      );
      
      await Promise.all(playPromises);

      console.log(`MIDI chord played: [${midiNotes.join(', ')}] (velocity: ${velocity}, duration: ${duration}ms, instrument: ${instrument})`);
    } catch (error) {
      console.error('Error playing MIDI chord:', error);
      throw error;
    }
  }

  /**
   * Debug method: Test MIDI note playback directly
   */
  async testMidiNote(trackId: string, pitch: number = 60, velocity: number = 100, duration: number = 1000): Promise<void> {
    try {
      console.log(`🔧 [Service] Testing MIDI note: trackId=${trackId}, pitch=${pitch}`);
      
      // Get global ToneJsIntegratedAdapter
      const toneJsAdapter = await this.getGlobalAdapter();

      // Test through the adapter
      await toneJsAdapter.testMidiNote(trackId, pitch, velocity, duration);

      console.log(`🔧 [Service] MIDI test completed`);
    } catch (error) {
      console.error('❌ [Service] Error testing MIDI note:', error);
      throw error;
    }
  }

  /**
   * Debug method: Check audio chain connectivity
   */
  async debugAudioChain(trackId: string): Promise<void> {
    try {
      console.log(`🔧 [Service] Debugging audio chain for track: ${trackId}`);
      
      // Get global ToneJsIntegratedAdapter
      const toneJsAdapter = await this.getGlobalAdapter();

      // Debug through the adapter
      toneJsAdapter.debugAudioChain(trackId);

      console.log(`🔧 [Service] Audio chain debug completed`);
    } catch (error) {
      console.error('❌ [Service] Error debugging audio chain:', error);
      throw error;
    }
  }

  /**
   * Initialize audio system
   */
  async initializeAudio(): Promise<void> {
    try {
      console.log('🔧 [Service] Initializing audio system...');
      
      // Get global ToneJsIntegratedAdapter (this will create and initialize it)
      await this.getGlobalAdapter();

      console.log('✅ [Service] Audio system initialized successfully');
    } catch (error) {
      console.error('❌ [Service] Error initializing audio system:', error);
      throw error;
    }
  }

  /**
   * Manually add a track to the global adapter
   */
  async addTrackToAdapter(trackId: string): Promise<void> {
    try {
      console.log(`🔧 [Service] Manually adding track to adapter: ${trackId}`);
      
      const track = await this.trackRepository.loadWithClips(TrackId.fromString(trackId));
      if (!track) {
        throw new Error(`Track not found: ${trackId}`);
      }
      
      const toneJsAdapter = await this.getGlobalAdapter();
      await toneJsAdapter.createTrackFromAggregate(track);
      
      console.log(`✅ [Service] Track manually added to adapter: ${trackId}`);
    } catch (error) {
      console.error(`❌ [Service] Error adding track to adapter: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Debug global adapter state
   */
  async debugAdapterState(): Promise<void> {
    try {
      console.log(`🔧 [Service] Debugging global adapter state...`);
      
      const toneJsAdapter = await this.getGlobalAdapter();
      const session = toneJsAdapter.getCurrentSession();
      
      if (session) {
        console.log(`🔧 [Service] Adapter session ID: ${session.id}`);
        console.log(`🔧 [Service] Tracks in adapter: ${session.tracks.size}`);
        console.log(`🔧 [Service] Master volume: ${session.masterVolume}`);
        console.log(`🔧 [Service] Transport state:`, session.transportState);
        
        // List all tracks
        for (const [trackId, trackState] of session.tracks) {
          console.log(`🔧 [Service] Track ${trackId}:`, {
            volume: trackState.volume,
            pan: trackState.pan,
            muted: trackState.muted,
            solo: trackState.solo,
            instrumentType: trackState.instrumentType
          });
        }
      } else {
        console.warn(`⚠️ [Service] No session found in adapter`);
      }
      
      console.log(`✅ [Service] Adapter state debug completed`);
    } catch (error) {
      console.error(`❌ [Service] Error debugging adapter state: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}