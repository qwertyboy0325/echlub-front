import { TrackId } from '../TrackId';

describe('TrackId', () => {
  describe('create', () => {
    it('應該創建具有唯一 UUID 的新實例', () => {
      const id1 = TrackId.create();
      const id2 = TrackId.create();
      
      expect(id1.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(id1.toString()).not.toBe(id2.toString());
    });
  });

  describe('fromString', () => {
    it('應該從有效的字符串創建實例', () => {
      const originalId = TrackId.create();
      const idString = originalId.toString();
      const recreatedId = TrackId.fromString(idString);
      
      expect(recreatedId.toString()).toBe(idString);
    });

    it('應該在空字符串時拋出錯誤', () => {
      expect(() => TrackId.fromString('')).toThrow('Track ID cannot be empty');
    });
  });

  describe('equals', () => {
    it('應該正確比較兩個 ID', () => {
      const id1 = TrackId.create();
      const id2 = TrackId.fromString(id1.toString());
      const id3 = TrackId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });

    it('應該在比較非 TrackId 實例時返回 false', () => {
      const id = TrackId.create();
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals({} as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('應該返回正確的字符串表示', () => {
      const id = TrackId.create();
      const idString = id.toString();
      
      expect(typeof idString).toBe('string');
      expect(idString).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
}); 