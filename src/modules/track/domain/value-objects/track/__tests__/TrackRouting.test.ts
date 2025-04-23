import { TrackRouting } from '../TrackRouting';

describe('TrackRouting', () => {
  describe('建構函式', () => {
    it('應該正確初始化路由設置', () => {
      const routing = new TrackRouting('input-1', 'output-1');
      expect(routing.getInput()).toBe('input-1');
      expect(routing.getOutput()).toBe('output-1');
    });

    it('應該允許 null 值作為輸入和輸出', () => {
      const routing = new TrackRouting(null, null);
      expect(routing.getInput()).toBe(null);
      expect(routing.getOutput()).toBe(null);
    });

    it('應該使用 null 作為預設值初始化', () => {
      const routing = new TrackRouting(null, null);
      expect(routing.getInput()).toBe(null);
      expect(routing.getOutput()).toBe(null);
    });
  });

  describe('setters', () => {
    it('應該正確設置輸入值', () => {
      const routing = new TrackRouting(null, null);
      routing.setInput('new-input');
      expect(routing.getInput()).toBe('new-input');
    });

    it('應該正確設置輸出值', () => {
      const routing = new TrackRouting(null, null);
      routing.setOutput('new-output');
      expect(routing.getOutput()).toBe('new-output');
    });

    it('應該允許設置 null 值', () => {
      const routing = new TrackRouting('input-1', 'output-1');
      routing.setInput(null);
      routing.setOutput(null);
      expect(routing.getInput()).toBe(null);
      expect(routing.getOutput()).toBe(null);
    });
  });

  describe('equals', () => {
    it('應該正確比較兩個路由設置', () => {
      const routing1 = new TrackRouting('input-1', 'output-1');
      const routing2 = new TrackRouting('input-1', 'output-1');
      const routing3 = new TrackRouting('input-2', 'output-2');

      expect(routing1.equals(routing2)).toBe(true);
      expect(routing1.equals(routing3)).toBe(false);
    });

    it('應該正確比較包含 null 值的路由設置', () => {
      const routing1 = new TrackRouting(null, 'output-1');
      const routing2 = new TrackRouting(null, 'output-1');
      const routing3 = new TrackRouting('input-1', null);

      expect(routing1.equals(routing2)).toBe(true);
      expect(routing1.equals(routing3)).toBe(false);
    });

    it('應該在比較非 TrackRouting 實例時返回 false', () => {
      const routing = new TrackRouting('input-1', 'output-1');
      expect(routing.equals(null as any)).toBe(false);
      expect(routing.equals({} as any)).toBe(false);
    });
  });

  describe('clone', () => {
    it('應該正確克隆路由設置', () => {
      const original = new TrackRouting('input-1', 'output-1');
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.equals(original)).toBe(true);
      expect(cloned.getInput()).toBe('input-1');
      expect(cloned.getOutput()).toBe('output-1');
    });

    it('應該正確克隆包含 null 值的路由設置', () => {
      const original = new TrackRouting(null, null);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.equals(original)).toBe(true);
      expect(cloned.getInput()).toBe(null);
      expect(cloned.getOutput()).toBe(null);
    });
  });

  describe('toString', () => {
    it('應該返回正確的字符串表示', () => {
      const routing = new TrackRouting('input-1', 'output-1');
      expect(routing.toString()).toBe('input-1 -> output-1');
    });

    it('應該正確處理 null 值的字符串表示', () => {
      const routing1 = new TrackRouting(null, 'output-1');
      const routing2 = new TrackRouting('input-1', null);
      const routing3 = new TrackRouting(null, null);

      expect(routing1.toString()).toBe('null -> output-1');
      expect(routing2.toString()).toBe('input-1 -> null');
      expect(routing3.toString()).toBe('null -> null');
    });
  });

  describe('toJSON', () => {
    it('應該返回正確的 JSON 表示', () => {
      const routing = new TrackRouting('input-1', 'output-1');
      expect(routing.toJSON()).toEqual({
        input: 'input-1',
        output: 'output-1'
      });
    });

    it('應該在 JSON 中正確表示 null 值', () => {
      const routing = new TrackRouting(null, null);
      expect(routing.toJSON()).toEqual({
        input: null,
        output: null
      });
    });
  });
});