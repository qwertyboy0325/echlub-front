import { MidiClip } from '../../../domain/entities/MidiClip';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { MidiNote } from '../../../domain/value-objects/MidiNote';
import type { MidiEvent } from '../../../domain/entities/MidiClip';

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid'
}));

describe('MidiClip', () => {
  let clipId: ClipId;

  beforeEach(() => {
    clipId = ClipId.create();
  });

  describe('建構函數驗證', () => {
    it('應該正確創建MIDI片段', () => {
      const clip = new MidiClip(clipId, 0, 10);
      expect(clip.getStartTime()).toBe(0);
      expect(clip.getDuration()).toBe(10);
      expect(clip.getGain()).toBe(1);
      expect(clip.getNotes()).toHaveLength(0);
    });

    it('當開始時間為負數時應拋出錯誤', () => {
      expect(() => new MidiClip(clipId, -1, 10))
        .toThrow('Start time cannot be negative');
    });

    it('當持續時間小於等於0時應拋出錯誤', () => {
      expect(() => new MidiClip(clipId, 0, 0))
        .toThrow('Duration must be positive');
      expect(() => new MidiClip(clipId, 0, -1))
        .toThrow('Duration must be positive');
    });
  });

  describe('音符管理', () => {
    let clip: MidiClip;
    let note: MidiNote;

    beforeEach(() => {
      clip = new MidiClip(clipId, 0, 10);
      note = new MidiNote(60, 0, 1, 100);
    });

    it('應該能夠添加音符', () => {
      clip.addNote(note);
      expect(clip.getNotes()).toHaveLength(1);
      expect(clip.getNotes()[0]).toEqual(note);
    });

    it('當音符超出片段範圍時應拋出錯誤', () => {
      const invalidNote = new MidiNote(60, 0, 11, 100);
      expect(() => clip.addNote(invalidNote))
        .toThrow('Note cannot extend beyond clip duration');
    });

    it('應該能夠刪除音符', () => {
      clip.addNote(note);
      expect(clip.getNotes()).toHaveLength(1);
      const noteId = clip.getNotes()[0].getId();
      clip.removeNote(noteId);
      expect(clip.getNotes()).toHaveLength(0);
    });

    it('應該能夠更新音符', () => {
      clip.addNote(note);
      const noteId = clip.getNotes()[0].getId();
      clip.updateNote(noteId, { velocity: 80 });
      expect(clip.getNotes()[0].getVelocity()).toBe(80);
    });
  });

  describe('時間標記管理', () => {
    it('應該能夠設置和獲取時間標記', () => {
      const clip = new MidiClip(clipId, 0, 10);
      const timeSignature = { numerator: 3, denominator: 4 };
      
      clip.setTimeSignature(timeSignature);
      expect(clip.getTimeSignature()).toEqual(timeSignature);
    });
  });

  describe('速度管理', () => {
    let clip: MidiClip;

    beforeEach(() => {
      clip = new MidiClip(clipId, 0, 10);
    });

    it('應該能夠設置和獲取速度', () => {
      clip.setVelocity(80);
      expect(clip.getVelocity()).toBe(80);
    });

    it('當速度值無效時應拋出錯誤', () => {
      expect(() => clip.setVelocity(-1))
        .toThrow('MIDI velocity must be between 0 and 127');
      expect(() => clip.setVelocity(128))
        .toThrow('MIDI velocity must be between 0 and 127');
    });
  });

  describe('克隆功能', () => {
    it('應該正確克隆MIDI片段', () => {
      const originalClip = new MidiClip(clipId, 0, 10);
      const note = new MidiNote(60, 0, 1, 100);
      originalClip.addNote(note);
      originalClip.setVelocity(80);
      originalClip.setTimeSignature({ numerator: 3, denominator: 4 });

      const clonedClip = originalClip.clone();

      expect(clonedClip.getStartTime()).toBe(originalClip.getStartTime());
      expect(clonedClip.getDuration()).toBe(originalClip.getDuration());
      expect(clonedClip.getGain()).toBe(originalClip.getGain());
      expect(clonedClip.getVelocity()).toBe(originalClip.getVelocity());
      expect(clonedClip.getTimeSignature()).toEqual(originalClip.getTimeSignature());
      expect(clonedClip.getNotes()).toHaveLength(1);
      expect(clonedClip.getNotes()[0].getPitch()).toBe(note.getPitch());
      expect(clonedClip.getNotes()[0].getVelocity()).toBe(note.getVelocity());
      expect(clonedClip.getNotes()[0].getStartTime()).toBe(note.getStartTime());
      expect(clonedClip.getNotes()[0].getDuration()).toBe(note.getDuration());
    });
  });

  describe('事件管理', () => {
    let clip: MidiClip;
    let event: MidiEvent;

    beforeEach(() => {
      clip = new MidiClip(clipId, 0, 10);
      event = {
        type: 'programChange',
        time: 1,
        data: [1, 64]
      };
    });

    it('應該能夠添加事件', () => {
      clip.addEvent(event);
      expect(clip.getEvents()).toHaveLength(1);
      expect(clip.getEvents()[0]).toEqual(event);
    });

    it('應該能夠刪除事件', () => {
      clip.addEvent(event);
      expect(clip.getEvents()).toHaveLength(1);
      clip.removeEvent(event);
      expect(clip.getEvents()).toHaveLength(0);
    });

    it('刪除事件時應該正確比較事件內容', () => {
      clip.addEvent(event);
      const differentEvent = {
        type: 'programChange',
        time: 1,
        data: [1, 65] // 不同的數據
      };
      clip.removeEvent(differentEvent);
      expect(clip.getEvents()).toHaveLength(1); // 不應該刪除原事件
    });
  });

  describe('JSON序列化', () => {
    it('應該正確序列化所有屬性', () => {
      const clip = new MidiClip(clipId, 0, 10);
      const note = new MidiNote(60, 0, 1, 100);
      const event = {
        type: 'programChange',
        time: 1,
        data: [1, 64]
      };
      
      clip.addNote(note);
      clip.addEvent(event);
      clip.setTimeSignature({ numerator: 3, denominator: 4 });
      clip.setVelocity(80);
      clip.setGain(0.8);

      const json = clip.toJSON();
      
      expect(json).toEqual({
        clipId: clipId.toString(),
        startTime: 0,
        duration: 10,
        gain: 0.8,
        notes: [note.toJSON()],
        events: [event],
        timeSignature: { numerator: 3, denominator: 4 },
        velocity: 80,
        version: expect.any(Number)
      });
    });
  });

  describe('版本控制', () => {
    let clip: MidiClip;

    beforeEach(() => {
      clip = new MidiClip(clipId, 0, 10);
    });

    it('添加音符時應該增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.addNote(new MidiNote(60, 0, 1, 100));
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });

    it('刪除音符時應該增加版本號', () => {
      const note = new MidiNote(60, 0, 1, 100);
      clip.addNote(note);
      const versionAfterAdd = clip.getVersion();
      clip.removeNote(note.getId());
      expect(clip.getVersion()).toBe(versionAfterAdd + 1);
    });

    it('更新音符時應該增加版本號', () => {
      const note = new MidiNote(60, 0, 1, 100);
      clip.addNote(note);
      const versionAfterAdd = clip.getVersion();
      clip.updateNote(note.getId(), { velocity: 80 });
      expect(clip.getVersion()).toBe(versionAfterAdd + 1);
    });

    it('添加事件時應該增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.addEvent({ type: 'programChange', time: 1, data: [1, 64] });
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });

    it('設置時間標記時應該增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.setTimeSignature({ numerator: 3, denominator: 4 });
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });

    it('設置速度時應該增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.setVelocity(80);
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });
  });
}); 