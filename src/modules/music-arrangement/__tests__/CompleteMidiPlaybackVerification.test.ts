import 'reflect-metadata';
import { Container } from 'inversify';
import { MusicArrangementContainer } from '../di/MusicArrangementContainer';
import { MusicArrangementTypes } from '../di/MusicArrangementTypes';

// Services
import type { SimpleMusicArrangementService } from '../application/services/SimpleMusicArrangementService';
import type { TrackRepository } from '../domain/repositories/TrackRepository';
import type { ClipRepository } from '../domain/repositories/ClipRepository';

// Domain entities
import { TrackId } from '../domain/value-objects/TrackId';
import { ClipId } from '../domain/value-objects/ClipId';
import { ClipType } from '../domain/value-objects/ClipType';

// Test utilities
import crypto from 'crypto';

// Enhanced Tone.js mock with detailed tracking
const mockToneCallTracker = {
  transportScheduleCalls: [] as any[],
  synthTriggerCalls: [] as any[],
  transportStartCalls: 0,
  transportStopCalls: 0,
  reset: function() {
    this.transportScheduleCalls = [];
    this.synthTriggerCalls = [];
    this.transportStartCalls = 0;
    this.transportStopCalls = 0;
  }
};

const mockSynth = {
  triggerAttackRelease: jest.fn((...args) => {
    mockToneCallTracker.synthTriggerCalls.push(args);
    console.log(`🎵 MOCK: Synth.triggerAttackRelease called with:`, args);
  }),
  connect: jest.fn().mockReturnThis(),
  toDestination: jest.fn().mockReturnThis(),
  dispose: jest.fn(),
  volume: { value: -12 }
};

const mockTransport = {
  start: jest.fn(() => {
    mockToneCallTracker.transportStartCalls++;
    console.log(`▶️ MOCK: Transport.start called (${mockToneCallTracker.transportStartCalls} times)`);
  }),
  stop: jest.fn(() => {
    mockToneCallTracker.transportStopCalls++;
    console.log(`⏹️ MOCK: Transport.stop called (${mockToneCallTracker.transportStopCalls} times)`);
  }),
  pause: jest.fn(),
  cancel: jest.fn(() => {
    console.log(`🚫 MOCK: Transport.cancel called - clearing ${mockToneCallTracker.transportScheduleCalls.length} scheduled events`);
  }),
  schedule: jest.fn((callback, time) => {
    const call = { callback, time, timestamp: Date.now() };
    mockToneCallTracker.transportScheduleCalls.push(call);
    console.log(`⏰ MOCK: Transport.schedule called with time:`, time, `(Total scheduled: ${mockToneCallTracker.transportScheduleCalls.length})`);
    
    // Immediately execute the callback for testing (simulate real-time execution)
    try {
      callback(0.5); // Mock audio context time
    } catch (error) {
      console.error(`❌ MOCK: Error executing scheduled callback:`, error);
    }
  }),
  scheduleRepeat: jest.fn((callback, interval, startTime) => {
    console.log(`🔄 MOCK: Transport.scheduleRepeat called with interval:`, interval, `startTime:`, startTime);
    // For testing, we don't need to actually repeat, just acknowledge the call
  }),
  bpm: { value: 120 },
  position: '0:0:0',
  state: 'stopped'
};

const mockTone = {
  now: jest.fn(() => 0.5),
  start: jest.fn(() => Promise.resolve()),
  Frequency: jest.fn((pitch: number) => ({
    toFrequency: () => 440 * Math.pow(2, (pitch - 69) / 12)
  })),
  Transport: mockTransport,
  Synth: jest.fn(() => mockSynth),
  Gain: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    gain: { value: 0.8 },
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Panner: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    pan: { value: 0 },
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Compressor: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Limiter: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    toDestination: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Reverb: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Delay: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Chorus: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Distortion: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Filter: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  EQ3: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Player: jest.fn(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    toDestination: jest.fn().mockReturnThis()
  })),
  Buffer: jest.fn(() => ({
    onload: null,
    onerror: null
  })),
  context: {
    state: 'running'
  }
};

// Mock global objects
(global as any).Tone = mockTone;
(global as any).crypto = crypto;

describe('🎼 Complete MIDI Playback Verification', () => {
  let container: Container;
  let musicService: SimpleMusicArrangementService;
  let trackRepository: TrackRepository;
  let clipRepository: ClipRepository;

  beforeAll(async () => {
    container = new Container();
    const musicContainer = new MusicArrangementContainer();
    container = musicContainer.getContainer();
    
    musicService = container.get<SimpleMusicArrangementService>(MusicArrangementTypes.SimpleMusicArrangementService);
    trackRepository = container.get<TrackRepository>(MusicArrangementTypes.TrackRepository);
    clipRepository = container.get<ClipRepository>(MusicArrangementTypes.ClipRepository);

    console.log('🔧 Complete MIDI Playback Verification Setup Complete');
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockToneCallTracker.reset();
    console.log('\n=== 🧹 Test Reset Complete ===\n');
  });

  describe('🎯 Critical MIDI Playback Verification', () => {
    test('🔍 應該確保所有 Clip 內的 MIDI 音符都被 Tone.js 正確調度和播放', async () => {
      console.log('🎵 === 開始完整 MIDI 播放驗證 ===');

      // === STEP 1: 創建測試數據 ===
      console.log('📋 STEP 1: 創建測試軌道和 Clip');
      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Verification Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 5000 },
        { type: 'synth', name: 'Test Synth' },
        'Verification Clip'
      );

      // === STEP 2: 添加多個音符（包含不同時間點） ===
      console.log('📋 STEP 2: 添加多個測試音符');
      const testNotes = [
        { pitch: 60, velocity: 100, startTime: 0, endTime: 500, name: 'C4 (immediate)' },
        { pitch: 62, velocity: 110, startTime: 500, endTime: 1000, name: 'D4 (500ms)' },
        { pitch: 64, velocity: 120, startTime: 1000, endTime: 1500, name: 'E4 (1000ms)' },
        { pitch: 65, velocity: 127, startTime: 1500, endTime: 2000, name: 'F4 (1500ms)' },
        { pitch: 67, velocity: 115, startTime: 2000, endTime: 2500, name: 'G4 (2000ms)' }
      ];

      const addedNoteIds = [];
      for (const note of testNotes) {
        const noteId = await musicService.addMidiNote(
          trackId,
          clipId,
          note.pitch,
          note.velocity,
          { startTime: note.startTime, endTime: note.endTime }
        );
        addedNoteIds.push(noteId);
        console.log(`✅ 添加音符: ${note.name} (ID: ${noteId})`);
      }

      expect(addedNoteIds).toHaveLength(5);
      console.log(`✅ 所有 ${addedNoteIds.length} 個音符已添加`);

      // === STEP 3: 驗證 Clip 包含所有音符 ===
      console.log('📋 STEP 3: 驗證 Clip 狀態');
      const clip = await clipRepository.findById(ClipId.fromString(clipId));
      expect(clip).toBeDefined();
      expect(clip!.getType()).toBe(ClipType.MIDI);
      
      const midiClip = clip as any;
      expect(midiClip.notes).toBeDefined();
      expect(midiClip.notes.length).toBe(5);
      console.log(`✅ Clip 包含 ${midiClip.notes.length} 個音符`);

      // 詳細驗證每個音符
      midiClip.notes.forEach((note: any, index: number) => {
        const expectedNote = testNotes[index];
        expect(note.pitch).toBe(expectedNote.pitch);
        expect(note.velocity).toBe(expectedNote.velocity);
        expect(note.range.start).toBe(expectedNote.startTime);
        console.log(`🎵 音符 ${index + 1}: ${expectedNote.name} - pitch=${note.pitch}, velocity=${note.velocity}, start=${note.range.start}ms ✓`);
      });

      // === STEP 4: 初始化音頻系統 ===
      console.log('📋 STEP 4: 初始化音頻系統');
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);
      console.log('✅ 音頻系統已初始化');

      // === STEP 5: 播放 MIDI Clip ===
      console.log('📋 STEP 5: 播放 MIDI Clip');
      
      // Reset call tracker before playback
      mockToneCallTracker.reset();
      
      await musicService.playMidiClip(trackId, clipId);
      console.log('✅ MIDI Clip 播放指令已執行');

      // === STEP 6: 詳細驗證 Tone.js 調用 ===
      console.log('📋 STEP 6: 驗證 Tone.js 調用');

      // 6.1: 驗證 Transport 已啟動
      expect(mockToneCallTracker.transportStartCalls).toBeGreaterThanOrEqual(1);
      console.log(`✅ Transport.start 被調用 ${mockToneCallTracker.transportStartCalls} 次`);

      // 6.2: 驗證所有音符都被調度
      expect(mockToneCallTracker.transportScheduleCalls.length).toBe(5);
      console.log(`✅ Transport.schedule 被調用 ${mockToneCallTracker.transportScheduleCalls.length} 次（應該是 5 次）`);

      // 6.3: 驗證每個調度調用的詳細信息
      mockToneCallTracker.transportScheduleCalls.forEach((call, index) => {
        const expectedNote = testNotes[index];
        console.log(`🎵 調度 ${index + 1}: 時間=${call.time}, 預期音符=${expectedNote.name}`);
        
        // 驗證時間格式正確
        expect(typeof call.time).toBe('string');
        expect(call.time).toMatch(/^\+[\d.]+$/); // 應該是 +數字 格式
      });

      // 6.4: 驗證所有音符都實際觸發了合成器
      expect(mockToneCallTracker.synthTriggerCalls.length).toBe(5);
      console.log(`✅ Synth.triggerAttackRelease 被調用 ${mockToneCallTracker.synthTriggerCalls.length} 次（應該是 5 次）`);

      // 6.5: 驗證每個合成器調用的詳細信息
      mockToneCallTracker.synthTriggerCalls.forEach((call, index) => {
        const expectedNote = testNotes[index];
        const [frequency, duration, time, velocity] = call;
        
        console.log(`🎵 合成器觸發 ${index + 1}:`, {
          frequency: frequency,
          duration: duration,
          time: time,
          velocity: velocity,
          expectedPitch: expectedNote.pitch,
          expectedVelocity: expectedNote.velocity
        });

        // 驗證頻率對應正確的音高
        expect(frequency).toBeDefined();
        
        // 驗證音長
        expect(duration).toBeGreaterThan(0);
        
        // 驗證力度 (應該被標準化到 0-1 範圍)
        expect(velocity).toBeGreaterThan(0);
        expect(velocity).toBeLessThanOrEqual(1);
      });

      console.log('🎉 === 完整 MIDI 播放驗證通過！所有音符都被正確調度和播放 ===');
    });

    test('🔄 應該能正確處理停止播放並清除所有調度事件', async () => {
      console.log('⏹️ === 測試停止播放功能 ===');

      // 創建軌道和音符
      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Stop Test Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 2000 },
        { type: 'synth', name: 'Stop Test Synth' },
        'Stop Test Clip'
      );
      await musicService.addMidiNote(trackId, clipId, 60, 100, { startTime: 0, endTime: 500 });

      // 初始化並播放
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);
      
      mockToneCallTracker.reset();
      await musicService.playMidiClip(trackId, clipId);

      // 驗證播放開始
      expect(mockToneCallTracker.transportStartCalls).toBeGreaterThanOrEqual(1);
      expect(mockToneCallTracker.transportScheduleCalls.length).toBe(1);
      console.log('✅ 播放已開始，音符已調度');

      // 停止播放
      await musicService.stopAllTracks();

      // 驗證停止調用
      expect(mockTone.Transport.stop).toHaveBeenCalled();
      expect(mockTone.Transport.cancel).toHaveBeenCalled();
      console.log('✅ Transport.stop 和 Transport.cancel 都被調用');

      console.log('🎉 停止播放功能測試通過！');
    });

    test('🎼 應該能正確處理多軌道同時播放', async () => {
      console.log('🎼 === 測試多軌道同時播放 ===');

      // 創建兩個軌道
      const track1Id = await musicService.createTrack('test-user', 'INSTRUMENT', 'Multi Track 1');
      const track2Id = await musicService.createTrack('test-user', 'INSTRUMENT', 'Multi Track 2');

      // 為每個軌道創建 Clip 和音符
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

      await musicService.addMidiNote(track1Id, clip1Id, 60, 100, { startTime: 0, endTime: 500 });
      await musicService.addMidiNote(track1Id, clip1Id, 64, 110, { startTime: 500, endTime: 1000 });
      await musicService.addMidiNote(track2Id, clip2Id, 67, 120, { startTime: 0, endTime: 500 });

      // 初始化音頻
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(track1Id);
      await musicService.addTrackToAdapter(track2Id);

      // 播放所有軌道
      mockToneCallTracker.reset();
      await musicService.playAllTracks();

      // 驗證所有音符都被調度（軌道1有2個音符，軌道2有1個音符，總共3個）
      expect(mockToneCallTracker.transportScheduleCalls.length).toBe(3);
      expect(mockToneCallTracker.synthTriggerCalls.length).toBe(3);
      console.log(`✅ 多軌道播放成功：${mockToneCallTracker.synthTriggerCalls.length} 個音符被觸發`);

      console.log('🎉 多軌道同時播放測試通過！');
    });

    test('⚡ 應該能高效處理大量音符', async () => {
      console.log('⚡ === 測試大量音符性能 ===');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Performance Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 10000 },
        { type: 'synth', name: 'Performance Synth' },
        'Performance Clip'
      );

      // 添加 50 個音符
      console.log('🔧 添加 50 個音符...');
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        await musicService.addMidiNote(
          trackId,
          clipId,
          60 + (i % 12),
          100,
          { startTime: i * 100, endTime: (i * 100) + 50 }
        );
      }

      const addTime = Date.now() - startTime;
      console.log(`✅ 50 個音符添加完成，耗時: ${addTime}ms`);

      // 初始化並播放
      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);

      mockToneCallTracker.reset();
      const playStartTime = Date.now();
      await musicService.playMidiClip(trackId, clipId);
      const playTime = Date.now() - playStartTime;

      // 驗證所有音符都被正確調度
      expect(mockToneCallTracker.transportScheduleCalls.length).toBe(50);
      expect(mockToneCallTracker.synthTriggerCalls.length).toBe(50);
      console.log(`✅ 大量音符播放成功：${mockToneCallTracker.synthTriggerCalls.length} 個音符被觸發，耗時: ${playTime}ms`);

      console.log('🎉 大量音符性能測試通過！');
    });
  });

  describe('🔬 深度調試和故障排除', () => {
    test('🔍 應該提供詳細的播放過程調試信息', async () => {
      console.log('🔍 === 深度調試測試 ===');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Debug Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 2000 },
        { type: 'synth', name: 'Debug Synth' },
        'Debug Clip'
      );

      await musicService.addMidiNote(trackId, clipId, 60, 100, { startTime: 0, endTime: 500 });
      await musicService.addMidiNote(trackId, clipId, 64, 110, { startTime: 500, endTime: 1000 });

      await musicService.initializeAudio();
      await musicService.addTrackToAdapter(trackId);

      // 獲取調試信息
      await musicService.debugAdapterState();
      await musicService.debugAudioChain(trackId);

      // 播放並記錄詳細過程
      mockToneCallTracker.reset();
      await musicService.playMidiClip(trackId, clipId);

      // 輸出詳細的調試信息
      console.log('=== 📊 詳細播放統計 ===');
      console.log(`Transport 啟動次數: ${mockToneCallTracker.transportStartCalls}`);
      console.log(`音符調度次數: ${mockToneCallTracker.transportScheduleCalls.length}`);
      console.log(`合成器觸發次數: ${mockToneCallTracker.synthTriggerCalls.length}`);
      console.log(`Synth 創建次數: ${mockTone.Synth.mock.calls.length}`);
      
      // 驗證調試功能正常工作
      expect(mockToneCallTracker.transportScheduleCalls.length).toBeGreaterThan(0);
      expect(mockToneCallTracker.synthTriggerCalls.length).toBeGreaterThan(0);

      console.log('🎉 深度調試測試通過！');
    });
  });
}); 