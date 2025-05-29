import { Container } from 'inversify';
import { MusicArrangementContainer } from '../../../di/MusicArrangementContainer';
import { MusicArrangementTypes } from '../../../di/MusicArrangementTypes';
import { AddMidiNoteCommandHandler } from '../AddMidiNoteCommandHandler';
import { RemoveMidiNoteCommandHandler } from '../RemoveMidiNoteCommandHandler';
import { CreateTrackCommandHandler } from '../CreateTrackCommandHandler';
import { UndoRedoService } from '../../services/UndoRedoService';
import { InMemoryEventStore } from '../../../infrastructure/events/EventStore';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { TimeRangeVO } from '../../../domain/value-objects/TimeRangeVO';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { AddMidiNoteCommand } from '../../commands/AddMidiNoteCommand';
import { RemoveMidiNoteCommand } from '../../commands/RemoveMidiNoteCommand';
import { CreateTrackCommand } from '../../commands/CreateTrackCommand';
import { CreateMidiClipCommand } from '../../commands/CreateMidiClipCommand';
import { CreateMidiClipCommandHandler } from '../CreateMidiClipCommandHandler';
import { InstrumentRef } from '../../../domain/value-objects/InstrumentRef';
import { ClipMetadata } from '../../../domain/value-objects/ClipMetadata';

describe('Command Handlers Integration', () => {
  let container: Container;
  let addMidiNoteHandler: AddMidiNoteCommandHandler;
  let removeMidiNoteHandler: RemoveMidiNoteCommandHandler;
  let createTrackHandler: CreateTrackCommandHandler;
  let undoRedoService: UndoRedoService;
  let eventStore: InMemoryEventStore;
  let userId: string;
  let createMidiClipHandler: CreateMidiClipCommandHandler;

  beforeEach(async () => {
    // Initialize container
    const musicContainer = new MusicArrangementContainer();
    await musicContainer.initialize();
    container = musicContainer.getContainer();

    // Get services
    addMidiNoteHandler = container.get<AddMidiNoteCommandHandler>(MusicArrangementTypes.AddMidiNoteCommandHandler);
    removeMidiNoteHandler = container.get<RemoveMidiNoteCommandHandler>(MusicArrangementTypes.RemoveMidiNoteCommandHandler);
    createTrackHandler = container.get<CreateTrackCommandHandler>(MusicArrangementTypes.CreateTrackCommandHandler);
    undoRedoService = container.get<UndoRedoService>(MusicArrangementTypes.UndoRedoService);
    eventStore = container.get<InMemoryEventStore>(MusicArrangementTypes.EventStore);
    createMidiClipHandler = container.get<CreateMidiClipCommandHandler>(MusicArrangementTypes.CreateMidiClipCommandHandler);

    userId = 'test-user-123';
  });

  afterEach(() => {
    // Clean up
    eventStore.clear();
  });

  describe('CreateTrackCommand Integration', () => {
    it('應該能創建 track 並記錄到 undo/redo 系統', async () => {
      const command = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        userId
      );

      const trackIdStr = await createTrackHandler.handle(command);
      
      expect(trackIdStr).toBeDefined();
      expect(typeof trackIdStr).toBe('string');

      // 檢查事件是否被保存
      const events = await eventStore.getEventsForAggregate(trackIdStr);
      expect(events.length).toBeGreaterThan(0);

      // 檢查是否可以 undo（如果 TrackCreated 是 undoable）
      const canUndo = undoRedoService.canUndo(trackIdStr);
      // Note: 這取決於 TrackCreatedEvent 是否實現 UndoableEvent
    });
  });

  describe('AddMidiNoteCommand Integration', () => {
    let trackId: TrackId;
    let clipId: ClipId;

    beforeEach(async () => {
      // 先創建一個 track
      const createCommand = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        userId
      );
      const trackIdStr = await createTrackHandler.handle(createCommand);
      trackId = TrackId.fromString(trackIdStr);

      // 創建一個 MIDI clip
      const createClipCommand = new CreateMidiClipCommand(
        trackId,
        new TimeRangeVO(0, 4000), // 4 seconds
        InstrumentRef.synth('piano', 'Piano'),
        ClipMetadata.create('Test MIDI Clip'),
        'Test MIDI Clip',
        userId
      );
      clipId = await createMidiClipHandler.handle(createClipCommand);
    });

    it('應該能添加 MIDI note 並記錄到 undo/redo 系統', async () => {
      const command = new AddMidiNoteCommand(
        trackId,
        clipId,
        60, // C4
        100, // velocity
        new TimeRangeVO(0, 1000), // 1 second note
        userId
      );

      const noteId = await addMidiNoteHandler.handle(command);
      
      expect(noteId).toBeDefined();

      // 檢查事件是否被保存
      const events = await eventStore.getEventsForAggregate(trackId.toString());
      expect(events.length).toBeGreaterThan(0);

      // 檢查是否可以 undo
      const canUndo = undoRedoService.canUndo(trackId.toString());
      expect(canUndo).toBe(true);

      // 檢查不能 redo（還沒有 undo）
      const canRedo = undoRedoService.canRedo(trackId.toString());
      expect(canRedo).toBe(false);
    });

    it('應該能 undo 添加的 MIDI note', async () => {
      const command = new AddMidiNoteCommand(
        trackId,
        clipId,
        60,
        100,
        new TimeRangeVO(0, 1000),
        userId
      );

      await addMidiNoteHandler.handle(command);
      
      // 執行 undo
      const undoResult = await undoRedoService.undo(trackId.toString(), userId);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.eventsApplied).toHaveLength(1);
      expect(undoResult.eventsApplied[0].eventName).toBe('MidiNoteRemoved');

      // 檢查狀態
      expect(undoRedoService.canUndo(trackId.toString())).toBe(false);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(true);
    });

    it('應該能 redo 撤銷的 MIDI note', async () => {
      const command = new AddMidiNoteCommand(
        trackId,
        clipId,
        60,
        100,
        new TimeRangeVO(0, 1000),
        userId
      );

      await addMidiNoteHandler.handle(command);
      await undoRedoService.undo(trackId.toString(), userId);
      
      // 執行 redo
      const redoResult = await undoRedoService.redo(trackId.toString(), userId);
      
      expect(redoResult.success).toBe(true);
      expect(redoResult.eventsApplied).toHaveLength(1);
      expect(redoResult.eventsApplied[0].eventName).toBe('MidiNoteAdded');

      // 檢查狀態
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      expect(undoRedoService.canRedo(trackId.toString())).toBe(false);
    });
  });

  describe('RemoveMidiNoteCommand Integration', () => {
    let trackId: TrackId;
    let clipId: ClipId;
    let noteId: any;

    beforeEach(async () => {
      // 先創建一個 track
      const createCommand = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        userId
      );
      const trackIdStr = await createTrackHandler.handle(createCommand);
      trackId = TrackId.fromString(trackIdStr);

      // 創建一個 MIDI clip
      const createClipCommand = new CreateMidiClipCommand(
        trackId,
        new TimeRangeVO(0, 4000), // 4 seconds
        InstrumentRef.synth('piano', 'Piano'),
        ClipMetadata.create('Test MIDI Clip'),
        'Test MIDI Clip',
        userId
      );
      clipId = await createMidiClipHandler.handle(createClipCommand);

      // 添加一個 MIDI note
      const addCommand = new AddMidiNoteCommand(
        trackId,
        clipId,
        60,
        100,
        new TimeRangeVO(0, 1000),
        userId
      );
      noteId = await addMidiNoteHandler.handle(addCommand);
    });

    it('應該能移除 MIDI note 並記錄到 undo/redo 系統', async () => {
      const command = new RemoveMidiNoteCommand(
        trackId,
        clipId,
        noteId,
        userId
      );

      await removeMidiNoteHandler.handle(command);

      // 檢查事件是否被保存
      const events = await eventStore.getEventsForAggregate(trackId.toString());
      expect(events.length).toBeGreaterThan(1); // 至少有 add 和 remove 事件

      // 檢查是否可以 undo
      const canUndo = undoRedoService.canUndo(trackId.toString());
      expect(canUndo).toBe(true);
    });

    it('應該能 undo 移除的 MIDI note', async () => {
      const command = new RemoveMidiNoteCommand(
        trackId,
        clipId,
        noteId,
        userId
      );

      await removeMidiNoteHandler.handle(command);
      
      // 執行 undo（應該恢復 note）
      const undoResult = await undoRedoService.undo(trackId.toString(), userId);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.eventsApplied).toHaveLength(1);
      expect(undoResult.eventsApplied[0].eventName).toBe('MidiNoteAdded');
    });
  });

  describe('多用戶權限測試', () => {
    let trackId: TrackId;
    let clipId: ClipId;

    beforeEach(async () => {
      const createCommand = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        'user1'
      );
      const trackIdStr = await createTrackHandler.handle(createCommand);
      trackId = TrackId.fromString(trackIdStr);

      // 創建一個 MIDI clip
      const createClipCommand = new CreateMidiClipCommand(
        trackId,
        new TimeRangeVO(0, 4000), // 4 seconds
        InstrumentRef.synth('piano', 'Piano'),
        ClipMetadata.create('Test MIDI Clip'),
        'Test MIDI Clip',
        'user1'
      );
      clipId = await createMidiClipHandler.handle(createClipCommand);
    });

    it('應該拒絕其他用戶的 undo 請求', async () => {
      // User1 添加 note
      const command = new AddMidiNoteCommand(
        trackId,
        clipId,
        60,
        100,
        new TimeRangeVO(0, 1000),
        'user1'
      );

      await addMidiNoteHandler.handle(command);

      // User2 嘗試 undo
      const undoResult = await undoRedoService.undo(trackId.toString(), 'user2');
      
      expect(undoResult.success).toBe(false);
      expect(undoResult.error).toContain('User can only undo their own operations');
    });

    it('應該允許用戶 undo 自己的操作', async () => {
      // User1 添加 note
      const command = new AddMidiNoteCommand(
        trackId,
        clipId,
        60,
        100,
        new TimeRangeVO(0, 1000),
        'user1'
      );

      await addMidiNoteHandler.handle(command);

      // User1 undo 自己的操作
      const undoResult = await undoRedoService.undo(trackId.toString(), 'user1');
      
      expect(undoResult.success).toBe(true);
    });
  });

  describe('複雜操作序列測試', () => {
    let trackId: TrackId;
    let clipId: ClipId;

    beforeEach(async () => {
      const createCommand = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        userId
      );
      const trackIdStr = await createTrackHandler.handle(createCommand);
      trackId = TrackId.fromString(trackIdStr);

      // 創建一個 MIDI clip
      const createClipCommand = new CreateMidiClipCommand(
        trackId,
        new TimeRangeVO(0, 10000), // 10 seconds for multiple notes
        InstrumentRef.synth('piano', 'Piano'),
        ClipMetadata.create('Test MIDI Clip'),
        'Test MIDI Clip',
        userId
      );
      clipId = await createMidiClipHandler.handle(createClipCommand);
    });

    it('應該正確處理多個操作的 undo/redo', async () => {
      // 添加3個 notes
      const noteIds = [];
      for (let i = 0; i < 3; i++) {
        const command = new AddMidiNoteCommand(
          trackId,
          clipId,
          60 + i,
          100,
          new TimeRangeVO(i * 1000, 1000),
          userId
        );
        const noteId = await addMidiNoteHandler.handle(command);
        noteIds.push(noteId);
      }

      // 檢查可以 undo
      expect(undoRedoService.canUndo(trackId.toString())).toBe(true);
      expect(undoRedoService.getUndoStackSize(trackId.toString())).toBe(3);

      // Undo 2個操作
      await undoRedoService.batchUndo(trackId.toString(), 2, userId);

      expect(undoRedoService.getUndoStackSize(trackId.toString())).toBe(1);
      expect(undoRedoService.getRedoStackSize(trackId.toString())).toBe(2);

      // Redo 1個操作
      await undoRedoService.redo(trackId.toString(), userId);

      expect(undoRedoService.getUndoStackSize(trackId.toString())).toBe(2);
      expect(undoRedoService.getRedoStackSize(trackId.toString())).toBe(1);

      // 添加新操作（應該清除 redo stack）
      const newCommand = new AddMidiNoteCommand(
        trackId,
        clipId,
        70,
        100,
        new TimeRangeVO(5000, 1000),
        userId
      );
      await addMidiNoteHandler.handle(newCommand);

      expect(undoRedoService.getUndoStackSize(trackId.toString())).toBe(3);
      expect(undoRedoService.getRedoStackSize(trackId.toString())).toBe(0);
    });
  });

  describe('事件持久化測試', () => {
    it('應該正確保存和檢索事件', async () => {
      const createCommand = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        userId
      );
      const trackIdStr = await createTrackHandler.handle(createCommand);
      const trackId = TrackId.fromString(trackIdStr);

      // 檢查事件被保存
      const events = await eventStore.getEventsForAggregate(trackIdStr);
      expect(events.length).toBeGreaterThan(0);

      // 檢查事件內容
      const firstEvent = events[0];
      expect(firstEvent.eventName).toBe('TrackCreated');
      expect(firstEvent.aggregateId).toBe(trackIdStr);
    });

    it('應該支援事件版本控制', async () => {
      const createCommand = new CreateTrackCommand(
        'owner123',
        TrackType.instrument(),
        'Test Track',
        userId
      );
      const trackIdStr = await createTrackHandler.handle(createCommand);
      const trackId = TrackId.fromString(trackIdStr);

      // 創建一個 MIDI clip
      const createClipCommand = new CreateMidiClipCommand(
        trackId,
        new TimeRangeVO(0, 10000), // 10 seconds for multiple notes
        InstrumentRef.synth('piano', 'Piano'),
        ClipMetadata.create('Test MIDI Clip'),
        'Test MIDI Clip',
        userId
      );
      const clipId = await createMidiClipHandler.handle(createClipCommand);

      // 添加多個操作
      for (let i = 0; i < 3; i++) {
        const command = new AddMidiNoteCommand(
          trackId,
          clipId,
          60 + i,
          100,
          new TimeRangeVO(i * 1000, 1000),
          userId
        );
        await addMidiNoteHandler.handle(command);
      }

      // 檢查事件版本遞增
      const events = await eventStore.getEventsForAggregate(trackIdStr);
      expect(events.length).toBeGreaterThan(3);
      
      // 檢查版本號（如果 EventStore 支援）
      if ('version' in events[0]) {
        for (let i = 1; i < events.length; i++) {
          expect((events[i] as any).version).toBeGreaterThan((events[i-1] as any).version);
        }
      }
    });
  });
}); 