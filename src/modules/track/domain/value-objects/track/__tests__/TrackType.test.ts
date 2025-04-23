import { TrackType } from '../TrackType';

describe('TrackType', () => {
  describe('fromString', () => {
    it('應該從有效的字符串創建類型', () => {
      expect(TrackType.fromString('audio')).toBe(TrackType.AUDIO);
      expect(TrackType.fromString('midi')).toBe(TrackType.MIDI);
      expect(TrackType.fromString('bus')).toBe(TrackType.BUS);
    });

    it('應該對無效的字符串拋出錯誤', () => {
      expect(() => TrackType.fromString('invalid'))
        .toThrow('Invalid track type: invalid');
      expect(() => TrackType.fromString(''))
        .toThrow('Invalid track type: ');
    });

    it('應該對 null 或 undefined 拋出錯誤', () => {
      expect(() => TrackType.fromString(null as any))
        .toThrow('Track type cannot be null');
      expect(() => TrackType.fromString(undefined as any))
        .toThrow('Track type cannot be null');
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
    it('應該正確比較兩個類型', () => {
      expect(TrackType.AUDIO.equals(TrackType.AUDIO)).toBe(true);
      expect(TrackType.AUDIO.equals(TrackType.MIDI)).toBe(false);
      expect(TrackType.MIDI.equals(TrackType.BUS)).toBe(false);
    });

    it('應該在比較非 TrackType 實例時返回 false', () => {
      expect(TrackType.AUDIO.equals(null as any)).toBe(false);
      expect(TrackType.AUDIO.equals({} as any)).toBe(false);
    });
  });
}); 