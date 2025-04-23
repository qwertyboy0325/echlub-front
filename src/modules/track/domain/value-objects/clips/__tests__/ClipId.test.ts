import { ClipId } from '../ClipId';
import { validate as uuidValidate } from 'uuid';

describe('ClipId', () => {
  describe('create', () => {
    it('應該創建有效的 UUID', () => {
      const clipId = ClipId.create();
      expect(uuidValidate(clipId.toString())).toBe(true);
    });

    it('每次創建應該生成唯一的 ID', () => {
      const clipId1 = ClipId.create();
      const clipId2 = ClipId.create();
      expect(clipId1.toString()).not.toBe(clipId2.toString());
    });
  });

  describe('fromString', () => {
    it('應該從有效的 UUID 字符串創建 ClipId', () => {
      const uuid = ClipId.create().toString();
      const clipId = ClipId.fromString(uuid);
      expect(clipId.toString()).toBe(uuid);
    });

    it('應該在輸入為空時拋出錯誤', () => {
      expect(() => ClipId.fromString('')).toThrow('Clip ID cannot be empty');
      expect(() => ClipId.fromString(null as any)).toThrow('Clip ID cannot be empty');
      expect(() => ClipId.fromString(undefined as any)).toThrow('Clip ID cannot be empty');
    });

    it('應該在輸入無效 UUID 時拋出錯誤', () => {
      expect(() => ClipId.fromString('invalid-uuid')).toThrow('Invalid Clip ID format');
    });
  });

  describe('equals', () => {
    it('應該正確比較相同的 ID', () => {
      const id = ClipId.create();
      const sameId = ClipId.fromString(id.toString());
      expect(id.equals(sameId)).toBe(true);
    });

    it('應該正確比較不同的 ID', () => {
      const id1 = ClipId.create();
      const id2 = ClipId.create();
      expect(id1.equals(id2)).toBe(false);
    });

    it('應該在比較非 ClipId 對象時返回 false', () => {
      const id = ClipId.create();
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
      expect(id.equals({} as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('應該返回正確的字符串表示', () => {
      const uuid = ClipId.create().toString();
      const clipId = ClipId.fromString(uuid);
      expect(clipId.toString()).toBe(uuid);
    });
  });
}); 