import { TrackRouting } from '../track/TrackRouting';

describe('TrackRouting', () => {
  describe('constructor', () => {
    it('應該正確初始化有效值', () => {
      const routing = new TrackRouting('input1', 'output1');
      expect(routing.getInput()).toBe('input1');
      expect(routing.getOutput()).toBe('output1');
    });

    it('應該正確初始化 null 值', () => {
      const routing = new TrackRouting(null, null);
      expect(routing.getInput()).toBeNull();
      expect(routing.getOutput()).toBeNull();
    });

    it('應該在參數為 undefined 時拋出錯誤', () => {
      expect(() => new TrackRouting(undefined as any, 'output1'))
        .toThrow('Routing input and output must be explicitly provided (use null for no value)');
      expect(() => new TrackRouting('input1', undefined as any))
        .toThrow('Routing input and output must be explicitly provided (use null for no value)');
    });
  });

  describe('getters and setters', () => {
    let routing: TrackRouting;

    beforeEach(() => {
      routing = new TrackRouting('input1', 'output1');
    });

    it('應該正確設置和獲取輸入', () => {
      routing.setInput('newInput');
      expect(routing.getInput()).toBe('newInput');
    });

    it('應該正確設置和獲取輸出', () => {
      routing.setOutput('newOutput');
      expect(routing.getOutput()).toBe('newOutput');
    });

    it('應該允許設置 null 值', () => {
      routing.setInput(null);
      routing.setOutput(null);
      expect(routing.getInput()).toBeNull();
      expect(routing.getOutput()).toBeNull();
    });

    it('應該在設置 undefined 值時拋出錯誤', () => {
      expect(() => routing.setInput(undefined as any))
        .toThrow('Input must be explicitly provided (use null for no value)');
      expect(() => routing.setOutput(undefined as any))
        .toThrow('Output must be explicitly provided (use null for no value)');
    });
  });

  describe('equals', () => {
    it('應該正確比較相同的路由', () => {
      const routing1 = new TrackRouting('input1', 'output1');
      const routing2 = new TrackRouting('input1', 'output1');
      expect(routing1.equals(routing2)).toBe(true);
    });

    it('應該正確比較不同的路由', () => {
      const routing1 = new TrackRouting('input1', 'output1');
      const routing2 = new TrackRouting('input2', 'output2');
      expect(routing1.equals(routing2)).toBe(false);
    });

    it('應該正確處理 null 值的比較', () => {
      const routing1 = new TrackRouting(null, null);
      const routing2 = new TrackRouting(null, null);
      expect(routing1.equals(routing2)).toBe(true);
    });

    it('應該在只有一個值為 null 時返回 false', () => {
      const routing1 = new TrackRouting('input1', null);
      const routing2 = new TrackRouting('input1', 'output1');
      expect(routing1.equals(routing2)).toBe(false);
    });

    it('應該在比較非 TrackRouting 實例時返回 false', () => {
      const routing = new TrackRouting('input1', 'output1');
      expect(routing.equals(null as any)).toBe(false);
      expect(routing.equals({} as any)).toBe(false);
    });
  });

  describe('clone', () => {
    it('應該創建具有相同值的新實例', () => {
      const original = new TrackRouting('input1', 'output1');
      const cloned = original.clone();
      expect(cloned).not.toBe(original);
      expect(cloned.equals(original)).toBe(true);
    });

    it('應該正確克隆 null 值', () => {
      const original = new TrackRouting(null, null);
      const cloned = original.clone();
      expect(cloned.getInput()).toBeNull();
      expect(cloned.getOutput()).toBeNull();
    });
  });

  describe('toString', () => {
    it('應該返回正確的字符串表示', () => {
      const routing = new TrackRouting('input1', 'output1');
      expect(routing.toString()).toBe('input1 -> output1');
    });

    it('應該正確處理 null 值的字符串表示', () => {
      const routing = new TrackRouting(null, null);
      expect(routing.toString()).toBe('null -> null');
    });
  });

  describe('toJSON', () => {
    it('應該返回正確的 JSON 表示', () => {
      const routing = new TrackRouting('input1', 'output1');
      expect(routing.toJSON()).toEqual({
        input: 'input1',
        output: 'output1'
      });
    });

    it('應該正確處理 null 值的 JSON 表示', () => {
      const routing = new TrackRouting(null, null);
      expect(routing.toJSON()).toEqual({
        input: null,
        output: null
      });
    });
  });
}); 