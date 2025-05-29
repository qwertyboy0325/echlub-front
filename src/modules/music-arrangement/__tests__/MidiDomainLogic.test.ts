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

// Mock global crypto
(global as any).crypto = crypto;

describe('MIDI Domain Logic Tests (No Audio)', () => {
  let container: Container;
  let musicService: SimpleMusicArrangementService;
  let trackRepository: TrackRepository;
  let clipRepository: ClipRepository;

  beforeAll(async () => {
    // Setup DI container
    container = new Container();
    const musicContainer = new MusicArrangementContainer();
    container = musicContainer.getContainer();
    
    // Get services
    musicService = container.get<SimpleMusicArrangementService>(MusicArrangementTypes.SimpleMusicArrangementService);
    trackRepository = container.get<TrackRepository>(MusicArrangementTypes.TrackRepository);
    clipRepository = container.get<ClipRepository>(MusicArrangementTypes.ClipRepository);

    console.log('🔧 MIDI Domain Logic Test Setup Complete');
  });

  afterEach(() => {
    // Clear any state between tests
  });

  describe('完整的 MIDI Track 業務邏輯測試', () => {
    test('應該能完整創建 Track、Clip 和 MIDI 音符（不包含音頻播放）', async () => {
      console.log('🎵 測試：完整 MIDI 業務邏輯流程（無音頻）');

      // Step 1: Create MIDI track
      console.log('📊 Step 1: 創建 MIDI 軌道');
      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Test MIDI Track');
      expect(trackId).toBeDefined();
      console.log(`✅ 軌道已創建: ${trackId}`);

      // Verify track exists and has correct properties
      const track = await trackRepository.loadWithClips(TrackId.fromString(trackId));
      expect(track).toBeDefined();
      expect(track!.trackType.value).toBe('INSTRUMENT');
      expect(track!.name).toBe('Test MIDI Track');
      expect(track!.clips.size).toBe(0);
      console.log(`✅ 軌道驗證成功: ${track!.name}, type: ${track!.trackType.value}`);

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

      // Step 4: Verify track has the clip with notes (via loadWithClips)
      console.log('📊 Step 4: 驗證軌道包含 Clip 和音符');
      const trackWithClips = await trackRepository.loadWithClips(TrackId.fromString(trackId));
      expect(trackWithClips).toBeDefined();
      expect(trackWithClips!.clips.size).toBe(1);
      
      const clipInTrack = Array.from(trackWithClips!.clips.values())[0];
      expect(clipInTrack.getType()).toBe(ClipType.MIDI);
      console.log(`✅ Track 包含 ${trackWithClips!.clips.size} 個 clip`);
      
      // Step 5: Verify MIDI clip contains all notes
      console.log('📊 Step 5: 驗證 MIDI Clip 包含所有音符');
      const refreshedClip = await clipRepository.findById(ClipId.fromString(clipId));
      expect(refreshedClip).toBeDefined();
      expect(refreshedClip!.getType()).toBe(ClipType.MIDI);
      
      // Access the notes from the MIDI clip
      if (refreshedClip!.getType() === ClipType.MIDI) {
        const midiClip = refreshedClip as any; // Cast to access notes
        expect(midiClip.notes).toBeDefined();
        expect(midiClip.notes.length).toBe(4);
        console.log(`✅ MIDI Clip 包含 ${midiClip.notes.length} 個音符`);
        
        // Verify note details
        midiClip.notes.forEach((note: any, index: number) => {
          expect(note.pitch).toBe(notes[index].pitch);
          expect(note.velocity).toBe(notes[index].velocity);
          expect(note.range.start).toBe(notes[index].startTime);
          expect(note.range.length).toBe(notes[index].endTime - notes[index].startTime);
          console.log(`🎵 音符 ${index + 1}: pitch=${note.pitch}, velocity=${note.velocity}, start=${note.range.start}ms, length=${note.range.length}ms`);
        });
      }

      console.log('🎉 完整 MIDI 業務邏輯測試通過！');
    });

    test('應該能正確處理多軌道和多 Clip', async () => {
      console.log('🎼 測試：多軌道多 Clip 業務邏輯');

      // Create multiple tracks
      const track1Id = await musicService.createTrack('test-user', 'INSTRUMENT', 'Track 1');
      const track2Id = await musicService.createTrack('test-user', 'INSTRUMENT', 'Track 2');
      console.log(`✅ 創建了 2 個軌道: ${track1Id}, ${track2Id}`);

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
      console.log(`✅ 創建了 2 個 MIDI Clip: ${clip1Id}, ${clip2Id}`);

      // Add notes to each clip
      await musicService.addMidiNote(track1Id, clip1Id, 60, 100, { startTime: 0, endTime: 500 });
      await musicService.addMidiNote(track2Id, clip2Id, 67, 100, { startTime: 0, endTime: 500 });
      console.log('✅ 為每個 Clip 添加了音符');

      // Verify both tracks have their clips
      const track1WithClips = await trackRepository.loadWithClips(TrackId.fromString(track1Id));
      const track2WithClips = await trackRepository.loadWithClips(TrackId.fromString(track2Id));
      
      expect(track1WithClips!.clips.size).toBe(1);
      expect(track2WithClips!.clips.size).toBe(1);
      console.log('✅ 每個軌道都包含正確數量的 Clip');

      console.log('🎉 多軌道多 Clip 測試通過！');
    });

    test('應該能正確處理音符和 Clip 狀態', async () => {
      console.log('✏️ 測試：音符和 Clip 狀態管理');

      // Create track and clip
      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'State Test Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 3000 },
        { type: 'synth', name: 'State Test Synth' },
        'State Test Clip'
      );

      // Add multiple notes
      const note1Id = await musicService.addMidiNote(trackId, clipId, 60, 100, { startTime: 0, endTime: 500 });
      const note2Id = await musicService.addMidiNote(trackId, clipId, 62, 110, { startTime: 500, endTime: 1000 });
      const note3Id = await musicService.addMidiNote(trackId, clipId, 64, 120, { startTime: 1000, endTime: 1500 });
      console.log(`✅ 添加了 3 個音符: ${note1Id}, ${note2Id}, ${note3Id}`);

      // Verify final state
      const clip = await clipRepository.findById(ClipId.fromString(clipId));
      expect((clip as any).notes.length).toBe(3);
      console.log(`✅ 驗證：Clip 包含 ${(clip as any).notes.length} 個音符`);

      // Verify notes are stored correctly
      const notes = (clip as any).notes;
      expect(notes[0].pitch).toBe(60);
      expect(notes[1].pitch).toBe(62);
      expect(notes[2].pitch).toBe(64);
      console.log('✅ 所有音符都正確存儲');

      console.log('🎉 音符和 Clip 狀態測試通過！');
    });

    test('應該能正確處理多 Clip 場景', async () => {
      console.log('📎 測試：多 Clip 場景');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Multi Clip Test Track');

      // Create multiple clips
      const clip1Id = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 2000 },
        { type: 'synth', name: 'Synth 1' },
        'Clip 1'
      );
      const clip2Id = await musicService.createMidiClip(
        trackId,
        { startTime: 2000, endTime: 4000 },
        { type: 'synth', name: 'Synth 2' },
        'Clip 2'
      );
      console.log(`✅ 創建了 2 個 Clip: ${clip1Id}, ${clip2Id}`);

      // Add notes to each clip
      await musicService.addMidiNote(trackId, clip1Id, 60, 100, { startTime: 0, endTime: 500 });
      await musicService.addMidiNote(trackId, clip2Id, 67, 100, { startTime: 2000, endTime: 2500 });
      console.log('✅ 為每個 Clip 添加了音符');

      // Verify track has both clips
      const track = await trackRepository.loadWithClips(TrackId.fromString(trackId));
      expect(track!.clips.size).toBe(2);
      console.log(`✅ Track 包含 ${track!.clips.size} 個 Clip`);

      // Verify each clip has its notes
      const clip1 = await clipRepository.findById(ClipId.fromString(clip1Id));
      const clip2 = await clipRepository.findById(ClipId.fromString(clip2Id));
      expect((clip1 as any).notes.length).toBe(1);
      expect((clip2 as any).notes.length).toBe(1);
      console.log('✅ 每個 Clip 都包含正確數量的音符');

      console.log('🎉 多 Clip 測試通過！');
    });
  });

  describe('性能和壓力測試', () => {
    test('應該能處理大量音符（性能測試）', async () => {
      console.log('⚡ 測試：大量音符性能（無音頻）');

      const trackId = await musicService.createTrack('test-user', 'INSTRUMENT', 'Performance Track');
      const clipId = await musicService.createMidiClip(
        trackId,
        { startTime: 0, endTime: 10000 },
        { type: 'synth', name: 'Performance Synth' },
        'Performance Clip'
      );

      // Add many notes and measure performance
      console.log('🔧 添加 100 個音符...');
      const startTime = Date.now();
      
      const noteIds = [];
      for (let i = 0; i < 100; i++) {
        const noteId = await musicService.addMidiNote(
          trackId,
          clipId,
          60 + (i % 12), // Cycle through chromatic scale
          100,
          { startTime: i * 50, endTime: (i * 50) + 25 }
        );
        noteIds.push(noteId);
      }

      const addTime = Date.now() - startTime;
      console.log(`✅ 100 個音符添加完成，耗時: ${addTime}ms`);
      
      // Performance assertions
      expect(addTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(noteIds).toHaveLength(100);

      // Verify all notes are correctly stored
      const clip = await clipRepository.findById(ClipId.fromString(clipId));
      expect((clip as any).notes.length).toBe(100);
      console.log(`✅ 驗證：Clip 包含 ${(clip as any).notes.length} 個音符`);

      console.log('🎉 大量音符性能測試通過！');
    });
  });
}); 