import 'reflect-metadata';
import { Container } from 'inversify';
import { MusicArrangementContainer } from '../di/MusicArrangementContainer';
import { MusicArrangementTypes } from '../di/MusicArrangementTypes';

// Services
import type { SimpleMusicArrangementService } from '../application/services/SimpleMusicArrangementService';
import type { TrackRepository } from '../domain/repositories/TrackRepository';
import type { ClipRepository } from '../domain/repositories/ClipRepository';
import type { UndoRedoService } from '../application/services/UndoRedoService';

// Domain entities
import { TrackId } from '../domain/value-objects/TrackId';
import { ClipId } from '../domain/value-objects/ClipId';
import { ClipType } from '../domain/value-objects/ClipType';

// Test utilities
import crypto from 'crypto';

// Mock Tone.js for testing
const mockTone = {
  now: jest.fn(() => 0.5),
  start: jest.fn(() => Promise.resolve()),
  Frequency: jest.fn((pitch: number) => ({
    toFrequency: () => 440 * Math.pow(2, (pitch - 69) / 12)
  })),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    cancel: jest.fn(),
    schedule: jest.fn(),
    bpm: { value: 120 },
    position: '0:0:0',
    state: 'stopped'
  },
  Synth: jest.fn(() => ({
    triggerAttackRelease: jest.fn(),
    connect: jest.fn().mockReturnThis(),
    toDestination: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    volume: { value: -12 }
  })),
  Gain: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    gain: { value: 0.8 },
    dispose: jest.fn()
  })),
  Panner: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    pan: { value: 0 },
    dispose: jest.fn()
  })),
  Compressor: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Limiter: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    toDestination: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Reverb: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Delay: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Chorus: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Distortion: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Filter: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  EQ3: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Player: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  Buffer: jest.fn(() => ({
    onload: null,
    onerror: null
  })),
  context: {
    state: 'running'
  }
};

// Mock global Tone
(global as any).Tone = mockTone;
(global as any).crypto = crypto;

describe('MIDI Playback Integration Tests', () => {
  let container: Container;
  let musicService: SimpleMusicArrangementService;
  let trackRepository: TrackRepository;
  let clipRepository: ClipRepository;
  let undoRedoService: UndoRedoService;

  beforeAll(async () => {
    // Setup DI container
    container = new Container();
    const musicContainer = new MusicArrangementContainer();
    container = musicContainer.getContainer();
    
    // Get services
    musicService = container.get<SimpleMusicArrangementService>(MusicArrangementTypes.SimpleMusicArrangementService);
    trackRepository = container.get<TrackRepository>(MusicArrangementTypes.TrackRepository);
    clipRepository = container.get<ClipRepository>(MusicArrangementTypes.ClipRepository);
    undoRedoService = container.get<UndoRedoService>(MusicArrangementTypes.UndoRedoService);

    console.log('🔧 MIDI Playback Integration Test Setup Complete');
  });

  afterEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Complete MIDI Track Playback Flow', () => {
    test('應該能完整創建並播放包含多個 MIDI 音符的軌道', async () => {
      console.log('🎵 測試：完整 MIDI 播放流程');

      // Step 1: Create MIDI track
      console.log('📊 Step 1: 創建 MIDI 軌道');
      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Test MIDI Track');
      expect(trackId).toBeDefined();
      console.log(`✅ 軌道已創建: ${trackId}`);

      // Verify track exists
      const track = await trackRepository.loadWithClips(TrackId.fromString(trackId));
      expect(track).toBeDefined();
      expect(track!.trackType.value).toBe('INSTRUMENT');
      console.log(`✅ 軌道驗證成功: ${track!.name}`);

      // Step 2: Create MIDI clip
      console.log('📊 Step 2: 創建 MIDI Clip');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 4000 }, // 4 seconds clip
        { type: 'synth', name: 'Test Synth' },
        'Test MIDI Clip'
      );
      expect(clipId).toBeDefined();
      console.log(`✅ MIDI Clip 已創建: ${clipId}`);

      // Verify clip exists and is MIDI type
      const clip = await clipRepository.findById(ClipId.fromString(clipId));
      expect(clip).toBeDefined();
      expect(clip!.getType()).toBe(ClipType.MIDI);
      console.log(`✅ Clip 驗證成功: ${clip!.getType()}`);

      // Step 3: Add multiple MIDI notes
      console.log('📊 Step 3: 添加多個 MIDI 音符');
      const notes = [
        { pitch: 60, velocity: 100, startTime: 0, endTime: 500 },      // C4 at 0ms
        { pitch: 64, velocity: 110, startTime: 500, endTime: 1000 },   // E4 at 500ms  
        { pitch: 67, velocity: 120, startTime: 1000, endTime: 1500 },  // G4 at 1000ms
        { pitch: 72, velocity: 127, startTime: 1500, endTime: 2000 }   // C5 at 1500ms
      ];

      const noteIds = [];
      for (const note of notes) {
        const noteId = await musicService.addMidiNote(
          trackId,
          clipId,
          note.pitch,
          note.velocity,
          { startTime: note.startTime, endTime: note.endTime }
        );
        noteIds.push(noteId);
        console.log(`✅ 音符已添加: ${note.pitch} (${noteId})`);
      }

      expect(noteIds).toHaveLength(4);
      console.log(`✅ 所有音符已添加: ${noteIds.length} 個音符`);

      // Step 4: Verify track has the clip with notes
      console.log('📊 Step 4: 驗證軌道包含音符');
      const trackWithClips = await trackRepository.loadWithClips(TrackId.fromString(trackId));
      expect(trackWithClips).toBeDefined();
      expect(trackWithClips!.clips.size).toBe(1);
      
      const clipInTrack = Array.from(trackWithClips!.clips.values())[0];
      expect(clipInTrack.getType()).toBe(ClipType.MIDI);
      
      // Check if it's a MIDI clip and has notes
      if (clipInTrack.getType() === ClipType.MIDI) {
        const midiClip = clipInTrack as any; // Cast to access notes
        expect(midiClip.notes).toBeDefined();
        expect(midiClip.notes.length).toBe(4);
        console.log(`✅ MIDI Clip 包含 ${midiClip.notes.length} 個音符`);
        
        // Verify note details
        midiClip.notes.forEach((note: any, index: number) => {
          console.log(`🎵 音符 ${index + 1}: pitch=${note.pitch}, velocity=${note.velocity}, start=${note.range.start}ms`);
        });
      }

      // Step 5: Test playback through SimpleMusicArrangementService
      console.log('📊 Step 5: 測試 MIDI Clip 播放');
      
      // Initialize audio first
      await musicService.initializeAudio();
      console.log('✅ 音頻系統已初始化');

      // Manually add track to adapter to ensure it exists
      await musicService.addTrackToAdapter(trackId);
      console.log('✅ 軌道已添加到適配器');

      // Test MIDI clip playback
      await expect(musicService.playMidiClip(trackId, clipId)).resolves.not.toThrow();
      console.log('✅ MIDI Clip 播放指令執行成功');

      // Step 6: Verify audio engine calls
      console.log('📊 Step 6: 驗證音頻引擎調用');
      
      // Check if Transport.schedule was called for note scheduling
      expect(mockTone.Transport.schedule).toHaveBeenCalled();
      console.log(`✅ Transport.schedule 被調用了 ${mockTone.Transport.schedule.mock.calls.length} 次`);

      // Verify synth creation and note triggering
      expect(mockTone.Synth).toHaveBeenCalled();
      console.log('✅ Synth 已創建');

      console.log('🎉 完整 MIDI 播放流程測試通過！');
    });

    test('應該能正確處理 Transport 控制', async () => {
      console.log('🎛️ 測試：Transport 控制功能');

      // Create track and clip with notes (simplified)
      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Transport Test Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 2000 },
        { type: 'synth', name: 'Test Synth' },
        'Transport Test Clip'
      );
      await musicService.addMidiNote(trackId, clipId, 60, 100, { startTime: 0, endTime: 500 });

      // Initialize audio
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);

      // Test start playback
      console.log('🔧 測試播放開始');
      await musicService.playMidiClip(trackId, clipId);
      expect(mockTone.Transport.start).toHaveBeenCalled();
      console.log('✅ Transport 開始播放');

      // Test stop playback 
      console.log('🔧 測試播放停止');
      await musicService.stopPlayback();
      expect(mockTone.Transport.stop).toHaveBeenCalled();
      expect(mockTone.Transport.cancel).toHaveBeenCalled();
      console.log('✅ Transport 停止播放並清除事件');

      console.log('🎉 Transport 控制測試通過！');
    });

    test('應該能處理多軌道同時播放', async () => {
      console.log('🎼 測試：多軌道同時播放');

      // Create multiple tracks
      const track1Id = await musicService.createTrack('test-user', 'INSTRUMENT', 'Track 1');
      const track2Id = await musicService.createTrack('test-user', 'INSTRUMENT', 'Track 2');

      // Create clips for each track
      const clip1Id = await musicService.createMidiClip(
        track1Id,
        { startTime: 0, endTime: 2000 },
        { type: 'synth', name: 'Synth 1' },
        'Clip 1'
      );
      const clip2Id = await musicService.createMidiClip(
        track2Id,
        { startTime: 0, endTime: 2000 },
        { type: 'synth', name: 'Synth 2' },
        'Clip 2'
      );

      // Add notes to each clip
      await musicService.addMidiNote(track1Id, clip1Id, 60, 100, { startTime: 0, endTime: 500 });
      await musicService.addMidiNote(track2Id, clip2Id, 67, 100, { startTime: 0, endTime: 500 });

      // Initialize audio
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(track1Id);
      await musicService.addTrackToAdapter(track2Id);

      // Test playing both tracks
      console.log('🔧 測試播放所有軌道');
      await musicService.playAllTracks();
      
      // Verify multiple synths were created (one per track)
      expect(mockTone.Synth).toHaveBeenCalledTimes(2);
      console.log('✅ 多個 Synth 已創建');

      // Verify transport was started
      expect(mockTone.Transport.start).toHaveBeenCalled();
      console.log('✅ Transport 已啟動');

      console.log('🎉 多軌道播放測試通過！');
    });

    test('應該能正確處理音符時序', async () => {
      console.log('⏱️ 測試：音符時序處理');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Timing Test Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 3000 },
        { type: 'synth', name: 'Timing Test Synth' },
        'Timing Test Clip'
      );

      // Add notes with specific timing
      const timingNotes = [
        { pitch: 60, startTime: 0, endTime: 250 },      // Immediate
        { pitch: 62, startTime: 250, endTime: 500 },    // 250ms delay
        { pitch: 64, startTime: 500, endTime: 750 },    // 500ms delay
        { pitch: 65, startTime: 1000, endTime: 1250 }   // 1000ms delay
      ];

      for (const note of timingNotes) {
        await musicService.addMidiNote(
          trackId,
          clipId,
          note.pitch,
          100,
          { startTime: note.startTime, endTime: note.endTime }
        );
      }

      // Initialize and play
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);
      await musicService.playMidiClip(trackId, clipId);

      // Verify Transport.schedule was called for each note
      expect(mockTone.Transport.schedule).toHaveBeenCalledTimes(4);
      console.log('✅ 所有音符都通過 Transport 調度');

      // Check timing parameters in schedule calls
      const scheduleCalls = mockTone.Transport.schedule.mock.calls;
      scheduleCalls.forEach((call, index) => {
        const timeParam = call[1]; // Second parameter is the time
        console.log(`🎵 音符 ${index + 1} 調度時間: ${timeParam}`);
        expect(timeParam).toMatch(/^\+[\d.]+$/); // Should be relative time format
      });

      console.log('🎉 音符時序測試通過！');
    });

    test('應該能處理錯誤情況', async () => {
      console.log('❌ 測試：錯誤處理');

      // Test playing non-existent track
      console.log('🔧 測試播放不存在的軌道');
      await expect(musicService.playMidiClip('non-existent-track', 'non-existent-clip'))
        .rejects.toThrow();
      console.log('✅ 正確拋出錯誤');

      // Test playing track without clips
      const emptyTrackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Empty Track');
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(emptyTrackId);
      
      console.log('🔧 測試播放空軌道');
      await expect(musicService.playMidiClip(emptyTrackId, 'non-existent-clip'))
        .rejects.toThrow();
      console.log('✅ 正確處理空軌道錯誤');

      console.log('🎉 錯誤處理測試通過！');
    });
  });

  describe('Audio Engine Integration', () => {
    test('應該正確初始化音頻系統', async () => {
      console.log('🔧 測試：音頻系統初始化');

      await musicService.initializeAudio();
      
      // Verify Tone.js components were created
      expect(mockTone.start).toHaveBeenCalled();
      console.log('✅ Tone.js 已啟動');

      console.log('🎉 音頻系統初始化測試通過！');
    });

    test('應該能調試音頻鏈', async () => {
      console.log('🔍 測試：音頻鏈調試');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Debug Track');
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);

      // Test debug functionality
      await expect(musicService.debugAudioChain(trackId)).resolves.not.toThrow();
      console.log('✅ 音頻鏈調試功能正常');

      await expect(musicService.debugAdapterState()).resolves.not.toThrow();
      console.log('✅ 適配器狀態調試功能正常');

      console.log('🎉 音頻鏈調試測試通過！');
    });
  });

  describe('Performance Tests', () => {
    test('應該能處理大量音符', async () => {
      console.log('⚡ 測試：大量音符性能');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Performance Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 10000 },
        { type: 'synth', name: 'Performance Synth' },
        'Performance Clip'
      );

      // Add many notes
      console.log('🔧 添加 50 個音符...');
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        await musicService.addMidiNote(
          trackId,
          clipId,
          60 + (i % 12), // Cycle through chromatic scale
          100,
          { startTime: i * 100, endTime: (i * 100) + 50 }
        );
      }

      const addTime = Date.now() - startTime;
      console.log(`✅ 50 個音符添加完成，耗時: ${addTime}ms`);

      // Test playback
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);
      
      const playStartTime = Date.now();
      await musicService.playMidiClip(trackId, clipId);
      const playTime = Date.now() - playStartTime;
      
      console.log(`✅ 大量音符播放啟動耗時: ${playTime}ms`);
      
      // Verify all notes were scheduled
      expect(mockTone.Transport.schedule).toHaveBeenCalledTimes(50);
      console.log('✅ 所有 50 個音符都已調度');

      console.log('🎉 大量音符性能測試通過！');
    });
  });
}); 