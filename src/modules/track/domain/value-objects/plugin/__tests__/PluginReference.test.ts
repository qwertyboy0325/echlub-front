import { PluginReference } from '../PluginReference';

describe('PluginReference', () => {
  describe('建構函式', () => {
    it('應該正確初始化插件引用', () => {
      const ref = new PluginReference('plugin-1');
      expect(ref.toString()).toBe('plugin-1');
    });

    it('應該在 ID 無效時拋出錯誤', () => {
      expect(() => new PluginReference('')).toThrow('Plugin ID cannot be empty');
      expect(() => new PluginReference(null as any)).toThrow('Plugin ID cannot be empty');
    });
  });

  describe('equals', () => {
    it('應該正確比較兩個插件引用', () => {
      const ref1 = new PluginReference('plugin-1');
      const ref2 = new PluginReference('plugin-1');
      const ref3 = new PluginReference('plugin-2');

      expect(ref1.equals(ref2)).toBe(true);
      expect(ref1.equals(ref3)).toBe(false);
    });

    it('應該在比較非 PluginReference 實例時返回 false', () => {
      const ref = new PluginReference('plugin-1');
      expect(ref.equals(null as any)).toBe(false);
      expect(ref.equals({} as any)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('應該返回正確的 JSON 表示', () => {
      const ref = new PluginReference('plugin-1');
      expect(ref.toJSON()).toEqual({
        id: 'plugin-1'
      });
    });
  });

  describe('toString', () => {
    it('應該返回正確的字符串表示', () => {
      const ref = new PluginReference('plugin-1');
      expect(ref.toString()).toBe('plugin-1');
    });
  });
}); 