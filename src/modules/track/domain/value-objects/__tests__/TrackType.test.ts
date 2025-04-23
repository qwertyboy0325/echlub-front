import { TrackType } from '../track/TrackType';

describe('TrackType', () => {
  describe('fromString', () => {
    it('應該從有效的字符串創建類型', () => {
      expect(TrackType.fromString('audio')).toBe(TrackType.AUDIO);
      expect(TrackType.fromString('midi')).toBe(TrackType.MIDI);
      expect(TrackType.fromString('bus')).toBe(TrackType.BUS);
    });

    it('應該對無效的字符串拋出錯誤', () => {
      expect(() => TrackType.fromString('invalid')).toThrow('Invalid track type: invalid');
      expect(() => TrackType.fromString('')).toThrow('Invalid track type: ');
    });
  });

  describe('toString', () => {
    it('應該返回正確的字符串表示', () => {
      expect(TrackType.AUDIO.toString()).toBe('audio');
      expect(TrackType.MIDI.toString()).toBe('midi');
      expect(TrackType.BUS.toString()).toBe('bus');
    });
  });

  describe('equals', () => {
    it('相同的類型應該相等', () => {
      expect(TrackType.AUDIO.equals(TrackType.AUDIO)).toBe(true);
      expect(TrackType.MIDI.equals(TrackType.MIDI)).toBe(true);
      expect(TrackType.BUS.equals(TrackType.BUS)).toBe(true);
    });

    it('不同的類型不應該相等', () => {
      expect(TrackType.AUDIO.equals(TrackType.MIDI)).toBe(false);
      expect(TrackType.MIDI.equals(TrackType.BUS)).toBe(false);
      expect(TrackType.BUS.equals(TrackType.AUDIO)).toBe(false);
    });
  });

  describe('values', () => {
    it('應該返回所有可用的類型', () => {
      const values = TrackType.values();
      expect(values).toContain(TrackType.AUDIO);
      expect(values).toContain(TrackType.MIDI);
      expect(values).toContain(TrackType.BUS);
      expect(values.length).toBe(3);
    });
  });
}); 