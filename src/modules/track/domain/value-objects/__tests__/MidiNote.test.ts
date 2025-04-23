import { MidiNote, MidiNoteProps } from '../note/MidiNote';

describe('MidiNote', () => {
  let validProps: MidiNoteProps;

  beforeEach(() => {
    validProps = {
      noteNumber: 60,  // 中央 C
      velocity: 100,
      startTime: 0,
      duration: 1
    };
  });

  describe('創建', () => {
    it('應該使用有效的屬性創建音符', () => {
      const note = MidiNote.create(validProps);
      expect(note.noteNumber).toBe(validProps.noteNumber);
      expect(note.velocity).toBe(validProps.velocity);
      expect(note.startTime).toBe(validProps.startTime);
      expect(note.duration).toBe(validProps.duration);
    });

    it('應該在音符號超出範圍時拋出錯誤', () => {
      expect(() => MidiNote.create({ ...validProps, noteNumber: 128 }))
        .toThrow('Note number must be between 0 and 127');
      expect(() => MidiNote.create({ ...validProps, noteNumber: -1 }))
        .toThrow('Note number must be between 0 and 127');
    });

    it('應該在音量超出範圍時拋出錯誤', () => {
      expect(() => MidiNote.create({ ...validProps, velocity: 128 }))
        .toThrow('Velocity must be between 0 and 127');
      expect(() => MidiNote.create({ ...validProps, velocity: -1 }))
        .toThrow('Velocity must be between 0 and 127');
    });

    it('應該在開始時間為負時拋出錯誤', () => {
      expect(() => MidiNote.create({ ...validProps, startTime: -1 }))
        .toThrow('Note start time cannot be negative');
    });

    it('應該在持續時間不為正時拋出錯誤', () => {
      expect(() => MidiNote.create({ ...validProps, duration: 0 }))
        .toThrow('Note duration must be positive');
      expect(() => MidiNote.create({ ...validProps, duration: -1 }))
        .toThrow('Note duration must be positive');
    });
  });

  describe('相等性比較', () => {
    it('應該正確比較相同的音符', () => {
      const note1 = MidiNote.create(validProps);
      const note2 = MidiNote.create(validProps);
      expect(note1.equals(note2)).toBe(true);
    });

    it('應該正確比較不同的音符', () => {
      const note1 = MidiNote.create(validProps);
      const note2 = MidiNote.create({ ...validProps, noteNumber: 61 });
      expect(note1.equals(note2)).toBe(false);
    });
  });

  describe('修改', () => {
    it('應該創建具有新屬性的音符', () => {
      const note = MidiNote.create(validProps);
      const modifiedNote = note.with({ velocity: 80 });
      expect(modifiedNote.velocity).toBe(80);
      expect(modifiedNote.noteNumber).toBe(note.noteNumber);
      expect(modifiedNote.startTime).toBe(note.startTime);
      expect(modifiedNote.duration).toBe(note.duration);
    });

    it('應該在修改時驗證新的屬性', () => {
      const note = MidiNote.create(validProps);
      expect(() => note.with({ velocity: 128 }))
        .toThrow('Velocity must be between 0 and 127');
    });
  });

  describe('時間重疊檢查', () => {
    it('應該檢測到重疊的音符', () => {
      const note1 = MidiNote.create(validProps);
      const note2 = MidiNote.create({ ...validProps, startTime: 0.5 });
      expect(note1.overlaps(note2)).toBe(true);
    });

    it('應該檢測到不重疊的音符', () => {
      const note1 = MidiNote.create(validProps);
      const note2 = MidiNote.create({ ...validProps, startTime: 2 });
      expect(note1.overlaps(note2)).toBe(false);
    });
  });

  describe('時間範圍檢查', () => {
    it('應該檢測到完全在範圍內的音符', () => {
      const note = MidiNote.create({ ...validProps, startTime: 1, duration: 1 });
      expect(note.isInTimeRange(0, 3)).toBe(true);
    });

    it('應該檢測到部分在範圍開始處的音符', () => {
      const note = MidiNote.create({ ...validProps, startTime: 0, duration: 1.5 });
      expect(note.isInTimeRange(0.5, 2)).toBe(true);
    });

    it('應該檢測到部分在範圍結束處的音符', () => {
      const note = MidiNote.create({ ...validProps, startTime: 1.5, duration: 2 });
      expect(note.isInTimeRange(0, 2)).toBe(true);
    });

    it('應該檢測到跨越整個範圍的音符', () => {
      const note = MidiNote.create({ ...validProps, startTime: 0, duration: 4 });
      expect(note.isInTimeRange(1, 3)).toBe(true);
    });

    it('應該檢測到不在範圍內的音符（在範圍之前）', () => {
      const note = MidiNote.create({ ...validProps, startTime: 0, duration: 1 });
      expect(note.isInTimeRange(2, 3)).toBe(false);
    });

    it('應該檢測到不在範圍內的音符（在範圍之後）', () => {
      const note = MidiNote.create({ ...validProps, startTime: 3, duration: 1 });
      expect(note.isInTimeRange(0, 2)).toBe(false);
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為 JSON', () => {
      const note = MidiNote.create(validProps);
      expect(note.toJSON()).toEqual(validProps);
    });

    it('應該有可讀的字符串表示', () => {
      const note = MidiNote.create(validProps);
      expect(note.toString()).toBe('MidiNote(note=60, vel=100, start=0, dur=1)');
    });
  });
}); 