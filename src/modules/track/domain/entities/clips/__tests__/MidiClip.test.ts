import { MidiClip, TimeSignature } from '../MidiClip';
import { ClipId } from '../../../value-objects/clips/ClipId';
import { MidiNote } from '../../../value-objects/note/MidiNote';

describe('MidiClip', () => {
  let clipId: ClipId;
  let timeSignature: TimeSignature;
  let notes: MidiNote[];
  let clip: MidiClip;

  beforeEach(() => {
    clipId = ClipId.create();
    timeSignature = { numerator: 4, denominator: 4 };
    notes = [
      MidiNote.create({ startTime: 0, duration: 1, noteNumber: 60, velocity: 100 }),
      MidiNote.create({ startTime: 1, duration: 1, noteNumber: 62, velocity: 100 })
    ];
    clip = new MidiClip(clipId, 0, 4, notes, timeSignature);
  });

  describe('建構子驗證', () => {
    it('應該正確初始化 MidiClip', () => {
      expect(clip.getStartTime()).toBe(0);
      expect(clip.getDuration()).toBe(4);
      expect(clip.getNotes()).toHaveLength(2);
      expect(clip.timeSignature).toEqual(timeSignature);
    });

    it('應該驗證拍號分子必須為正數', () => {
      expect(() => {
        new MidiClip(clipId, 0, 4, [], { numerator: 0, denominator: 4 });
      }).toThrow('Time signature numerator must be positive');
    });

    it('應該驗證拍號分母必須為 2 的冪次', () => {
      expect(() => {
        new MidiClip(clipId, 0, 4, [], { numerator: 4, denominator: 3 });
      }).toThrow('Time signature denominator must be a power of 2');
    });
  });

  describe('音符管理', () => {
    it('應該正確添加音符', () => {
      const newNote = MidiNote.create({ startTime: 2, duration: 1, noteNumber: 64, velocity: 100 });
      clip.addNote(newNote);
      expect(clip.getNotes()).toHaveLength(3);
      expect(clip.getNotes()[2]).toEqual(newNote);
    });

    it('不應該允許添加超出片段時間範圍的音符', () => {
      const outOfRangeNote = MidiNote.create({ startTime: 5, duration: 1, noteNumber: 64, velocity: 100 });
      expect(() => {
        clip.addNote(outOfRangeNote);
      }).toThrow('Note must be within clip time range');
    });

    it('不應該允許添加與現有音符重疊的音符', () => {
      const overlappingNote = MidiNote.create({ startTime: 0.5, duration: 1, noteNumber: 64, velocity: 100 });
      expect(() => {
        clip.addNote(overlappingNote);
      }).toThrow('Note overlaps with existing note');
    });

    it('應該正確移除音符', () => {
      clip.removeNote(0);
      expect(clip.getNotes()).toHaveLength(1);
      expect(clip.getNotes()[0]).toEqual(notes[1]);
    });

    it('應該在移除無效索引時拋出錯誤', () => {
      expect(() => {
        clip.removeNote(-1);
      }).toThrow('Invalid note index');
      expect(() => {
        clip.removeNote(2);
      }).toThrow('Invalid note index');
    });

    it('應該正確更新音符', () => {
      const updatedNote = MidiNote.create({ startTime: 0, duration: 0.5, noteNumber: 65, velocity: 90 });
      clip.updateNote(0, updatedNote);
      expect(clip.getNotes()[0]).toEqual(updatedNote);
    });

    it('不應該允許更新為超出時間範圍的音符', () => {
      const outOfRangeNote = MidiNote.create({ startTime: 5, duration: 1, noteNumber: 64, velocity: 100 });
      expect(() => {
        clip.updateNote(0, outOfRangeNote);
      }).toThrow('Note must be within clip time range');
    });
  });

  describe('時間操作', () => {
    it('應該正確查找時間範圍內的音符', () => {
      const foundNotes = clip.findNotesInRange(0, 1);
      expect(foundNotes).toHaveLength(1);
      expect(foundNotes[0]).toEqual(notes[0]);
    });

    it('應該正確按音高排序音符', () => {
      const highNote = MidiNote.create({ startTime: 2, duration: 1, noteNumber: 72, velocity: 100 });
      clip.addNote(highNote);
      clip.sortNotesByPitch();
      expect(clip.getNotes()[0].noteNumber).toBe(60);
      expect(clip.getNotes()[2].noteNumber).toBe(72);
    });

    it('應該正確縮放時間', () => {
      clip.scaleTime(2);
      expect(clip.getDuration()).toBe(8);
      expect(clip.getNotes()[0].startTime).toBe(0);
      expect(clip.getNotes()[0].duration).toBe(2);
      expect(clip.getNotes()[1].startTime).toBe(2);
      expect(clip.getNotes()[1].duration).toBe(2);
    });

    it('不應該允許負的時間縮放因子', () => {
      expect(() => {
        clip.scaleTime(-1);
      }).toThrow('Time scale factor must be positive');
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為 JSON', () => {
      const json = clip.toJSON() as any;
      expect(json.clipId).toBe(clipId.toString());
      expect(json.startTime).toBe(0);
      expect(json.duration).toBe(4);
      expect(json.notes).toHaveLength(2);
      expect(json.timeSignature).toEqual(timeSignature);
      expect(json.version).toBe(clip.getVersion());
    });
  });

  describe('克隆', () => {
    it('應該創建具有新 ID 的深層副本', () => {
      const cloned = clip.clone();
      expect(cloned.getClipId()).not.toBe(clip.getClipId());
      expect(cloned.getStartTime()).toBe(clip.getStartTime());
      expect(cloned.getDuration()).toBe(clip.getDuration());
      expect(cloned.getNotes()).toHaveLength(clip.getNotes().length);
      expect(cloned.timeSignature).toEqual(clip.timeSignature);
      expect(cloned.getVersion()).toBe(1);
    });
  });
}); 