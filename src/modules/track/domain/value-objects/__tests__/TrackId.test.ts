import { TrackId } from '../TrackId';

describe('TrackId', () => {
  describe('create', () => {
    it('應該創建唯一的 ID', () => {
      const id1 = TrackId.create();
      const id2 = TrackId.create();
      
      expect(id1.toString()).not.toBe(id2.toString());
    });
  });

  describe('fromString', () => {
    it('應該從字符串創建 ID', () => {
      const originalId = TrackId.create();
      const idString = originalId.toString();
      const reconstructedId = TrackId.fromString(idString);
      
      expect(reconstructedId.equals(originalId)).toBe(true);
    });

    it('當輸入無效時應該拋出錯誤', () => {
      expect(() => TrackId.fromString('')).toThrow();
      expect(() => TrackId.fromString('invalid-id')).toThrow();
    });
  });

  describe('equals', () => {
    it('相同的 ID 應該相等', () => {
      const id1 = TrackId.create();
      const id2 = TrackId.fromString(id1.toString());
      
      expect(id1.equals(id2)).toBe(true);
    });

    it('不同的 ID 不應該相等', () => {
      const id1 = TrackId.create();
      const id2 = TrackId.create();
      
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('應該返回有效的字符串表示', () => {
      const id = TrackId.create();
      const idString = id.toString();
      
      expect(typeof idString).toBe('string');
      expect(idString.length).toBeGreaterThan(0);
    });
  });
}); 