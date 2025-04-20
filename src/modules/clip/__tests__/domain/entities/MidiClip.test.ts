import { MidiClip } from '../../../domain/entities/MidiClip';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { MidiNote } from '../../../domain/value-objects/MidiNote';

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
}); 