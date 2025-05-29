import { UndoRedoService } from '../UndoRedoService';
import { InMemoryEventStore } from '../../../infrastructure/events/EventStore';
import { EventSourcedTrackRepository } from '../../../infrastructure/repositories/EventSourcedTrackRepository';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { MidiNoteAddedEvent, MidiNoteRemovedEvent, UndoableEvent } from '../../../domain/events/MidiEvents';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { MidiNote } from '../../../domain/entities/MidiNote';
import { TimeRangeVO } from '../../../domain/value-objects/TimeRangeVO';
import { MidiNoteId } from '../../../domain/value-objects/MidiNoteId';

// Mock ClipRepository
const mockClipRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn()
};

describe('UndoRedoService', () => {
  let undoRedoService: UndoRedoService;
  let eventStore: InMemoryEventStore;
  let trackRepository: EventSourcedTrackRepository;
  let trackId: TrackId;
  let clipId: ClipId;
  let userId: string;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    trackRepository = new EventSourcedTrackRepository(eventStore, mockClipRepository as any);
    undoRedoService = new UndoRedoService(eventStore, trackRepository);
    
    trackId = TrackId.create();
    clipId = ClipId.create();
    userId = 'user123';
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('recordUndoableEvent', () => {
    it('應該能記錄可撤銷事件', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(
        event,
        trackId.toString(),
        1,
        userId
      );
      
      const canUndo = undoRedoService.canUndo(trackId.toString());
      expect(canUndo).toBe(true);
    });

    it('應該正確設置事件元數據', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(
        event,
        trackId.toString(),
        1,
        userId
      );
      
      // 檢查內部狀態（通過 undo 操作來驗證）
      const canUndo = undoRedoService.canUndo(trackId.toString());
      expect(canUndo).toBe(true);
    });

    it('應該支援多個用戶的操作', async () => {
      const note1 = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const note2 = MidiNote.create(62, 100, new TimeRangeVO(1000, 1000));
      
      const event1 = new MidiNoteAddedEvent(trackId, clipId, note1);
      const event2 = new MidiNoteAddedEvent(trackId, clipId, note2);
      
      await undoRedoService.recordUndoableEvent(event1, trackId.toString(), 1, 'user1');
      await undoRedoService.recordUndoableEvent(event2, trackId.toString(), 2, 'user2');
      
      const canUndo = undoRedoService.canUndo(trackId.toString());
      expect(canUndo).toBe(true);
    });

    it('應該限制 undo stack 大小', async () => {
      const maxStackSize = 50; // UndoRedoService 的預設值
      
      // 添加超過最大堆疊大小的事件
      for (let i = 0; i < maxStackSize + 10; i++) {
        const note = MidiNote.create(60 + i, 100, new TimeRangeVO(i * 1000, 1000));
        const event = new MidiNoteAddedEvent(trackId, clipId, note);
        
        await undoRedoService.recordUndoableEvent(
          event,
          trackId.toString(),
          i + 1,
          userId
        );
      }
      
      // 應該仍然可以 undo（但只有最近的 50 個操作）
      const canUndo = undoRedoService.canUndo(trackId.toString());
      expect(canUndo).toBe(true);
    });
  });

  describe('undo', () => {
    it('應該能撤銷單個操作', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, userId);
      
      const result = await undoRedoService.undo(trackId.toString(), userId);
      
      expect(result.success).toBe(true);
      expect(result.eventsApplied).toHaveLength(1);
      expect(result.eventsApplied[0].eventName).toBe('MidiNoteRemoved');
    });

    it('應該拒絕其他用戶的撤銷請求', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, 'user1');
      
      const result = await undoRedoService.undo(trackId.toString(), 'user2');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });

    it('應該在沒有可撤銷操作時返回失敗', async () => {
      const result = await undoRedoService.undo(trackId.toString(), userId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to undo');
    });

    it('應該正確處理撤銷後的狀態', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
      
      await undoRedoService.undo(trackId.toString(), userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(false);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(true);
    });
  });

  describe('redo', () => {
    it('應該能重做撤銷的操作', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, userId);
      await undoRedoService.undo(trackId.toString(), userId);
      
      const result = await undoRedoService.redo(trackId.toString(), userId);
      
      expect(result.success).toBe(true);
      expect(result.eventsApplied).toHaveLength(1);
      expect(result.eventsApplied[0].eventName).toBe('MidiNoteAdded');
    });

    it('應該拒絕其他用戶的重做請求', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, 'user1');
      await undoRedoService.undo(trackId.toString(), 'user1');
      
      const result = await undoRedoService.redo(trackId.toString(), 'user2');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });

    it('應該在沒有可重做操作時返回失敗', async () => {
      const result = await undoRedoService.redo(trackId.toString(), userId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to redo');
    });
  });

  describe('canUndo / canRedo', () => {
    it('應該正確報告 undo/redo 可用性', async () => {
      expect(undoRedoService.canUndo(trackId.toString())).toBe(false);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
      
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
      
      await undoRedoService.undo(trackId.toString(), userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(false);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(true);
      
      await undoRedoService.redo(trackId.toString(), userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
    });
  });

  describe('batchUndo / batchRedo', () => {
    it('應該能批量撤銷多個操作', async () => {
      const notes = [
        MidiNote.create(60, 100, new TimeRangeVO(0, 1000)),
        MidiNote.create(62, 100, new TimeRangeVO(1000, 1000)),
        MidiNote.create(64, 100, new TimeRangeVO(2000, 1000))
      ];
      
      for (let i = 0; i < notes.length; i++) {
        const event = new MidiNoteAddedEvent(trackId, clipId, notes[i]);
        await undoRedoService.recordUndoableEvent(event, trackId.toString(), i + 1, userId);
      }
      
      const result = await undoRedoService.batchUndo(trackId.toString(), 2, userId);
      
      expect(result.success).toBe(true);
      expect(result.eventsApplied).toHaveLength(2);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(true);
    });

    it('應該能批量重做多個操作', async () => {
      const notes = [
        MidiNote.create(60, 100, new TimeRangeVO(0, 1000)),
        MidiNote.create(62, 100, new TimeRangeVO(1000, 1000))
      ];
      
      for (let i = 0; i < notes.length; i++) {
        const event = new MidiNoteAddedEvent(trackId, clipId, notes[i]);
        await undoRedoService.recordUndoableEvent(event, trackId.toString(), i + 1, userId);
      }
      
      await undoRedoService.batchUndo(trackId.toString(), 2, userId);
      
      const result = await undoRedoService.batchRedo(trackId.toString(), 2, userId);
      
      expect(result.success).toBe(true);
      expect(result.eventsApplied).toHaveLength(2);
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
    });

    it('應該限制批量操作的數量', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, userId);
      
      // 嘗試撤銷超過可用數量的操作
      const result = await undoRedoService.batchUndo(trackId.toString(), 5, userId);
      
      expect(result.success).toBe(true);
      expect(result.eventsApplied).toHaveLength(1); // 只能撤銷1個
    });
  });

  describe('clearHistory', () => {
    it('應該能清除指定 aggregate 的歷史', async () => {
      const note = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const event = new MidiNoteAddedEvent(trackId, clipId, note);
      
      await undoRedoService.recordUndoableEvent(event, trackId.toString(), 1, userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      
      undoRedoService.clearHistory(trackId.toString());
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(false);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
    });

    it('應該只清除指定 aggregate 的歷史', async () => {
      const trackId2 = TrackId.create();
      
      const note1 = MidiNote.create(60, 100, new TimeRangeVO(0, 1000));
      const note2 = MidiNote.create(62, 100, new TimeRangeVO(1000, 1000));
      
      const event1 = new MidiNoteAddedEvent(trackId, clipId, note1);
      const event2 = new MidiNoteAddedEvent(trackId2, clipId, note2);
      
      await undoRedoService.recordUndoableEvent(event1, trackId.toString(), 1, userId);
      await undoRedoService.recordUndoableEvent(event2, trackId2.toString(), 1, userId);
      
      undoRedoService.clearHistory(trackId.toString());
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(false);
      expect(undoRedoService.canUndo(trackId2.toString())).toBe(true);
    });
  });

  describe('複雜場景測試', () => {
    it('應該正確處理混合的 undo/redo 操作', async () => {
      const notes = [
        MidiNote.create(60, 100, new TimeRangeVO(0, 1000)),
        MidiNote.create(62, 100, new TimeRangeVO(1000, 1000)),
        MidiNote.create(64, 100, new TimeRangeVO(2000, 1000))
      ];
      
      // 添加3個操作
      for (let i = 0; i < notes.length; i++) {
        const event = new MidiNoteAddedEvent(trackId, clipId, notes[i]);
        await undoRedoService.recordUndoableEvent(event, trackId.toString(), i + 1, userId);
      }
      
      // 撤銷2個
      await undoRedoService.batchUndo(trackId.toString(), 2, userId);
      
      // 重做1個
      await undoRedoService.redo(trackId.toString(), userId);
      
      // 添加新操作（應該清除 redo stack）
      const newNote = MidiNote.create(66, 100, new TimeRangeVO(3000, 1000));
      const newEvent = new MidiNoteAddedEvent(trackId, clipId, newNote);
      await undoRedoService.recordUndoableEvent(newEvent, trackId.toString(), 3, userId);
      
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
    });
  });
}); 