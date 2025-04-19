import { TrackRouting } from '../TrackRouting';

describe('TrackRouting', () => {
  let routing: TrackRouting;

  beforeEach(() => {
    routing = new TrackRouting();
  });

  describe('constructor', () => {
    it('should initialize with null values when no arguments provided', () => {
      expect(routing.getInput()).toBeNull();
      expect(routing.getOutput()).toBeNull();
    });

    it('should initialize with provided values', () => {
      const routing = new TrackRouting('input1', 'output1');
      expect(routing.getInput()).toBe('input1');
      expect(routing.getOutput()).toBe('output1');
    });
  });

  describe('getters and setters', () => {
    it('should get and set input', () => {
      routing.setInput('input1');
      expect(routing.getInput()).toBe('input1');
    });

    it('should get and set output', () => {
      routing.setOutput('output1');
      expect(routing.getOutput()).toBe('output1');
    });

    it('should handle null input', () => {
      routing.setInput('input1');
      routing.setInput(null);
      expect(routing.getInput()).toBeNull();
    });

    it('should handle null output', () => {
      routing.setOutput('output1');
      routing.setOutput(null);
      expect(routing.getOutput()).toBeNull();
    });
  });

  describe('equals', () => {
    it('should return true for identical routings', () => {
      const routing1 = new TrackRouting('input1', 'output1');
      const routing2 = new TrackRouting('input1', 'output1');
      expect(routing1.equals(routing2)).toBe(true);
    });

    it('should return false for different routings', () => {
      const routing1 = new TrackRouting('input1', 'output1');
      const routing2 = new TrackRouting('input2', 'output2');
      expect(routing1.equals(routing2)).toBe(false);
    });

    it('should handle null values correctly', () => {
      const routing1 = new TrackRouting(null, null);
      const routing2 = new TrackRouting(null, null);
      expect(routing1.equals(routing2)).toBe(true);
    });

    it('should return false when only one value is null', () => {
      const routing1 = new TrackRouting('input1', null);
      const routing2 = new TrackRouting('input1', 'output1');
      expect(routing1.equals(routing2)).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create a new instance with the same values', () => {
      const original = new TrackRouting('input1', 'output1');
      const cloned = original.clone();
      
      expect(cloned).not.toBe(original);
      expect(cloned.equals(original)).toBe(true);
    });

    it('should handle null values when cloning', () => {
      const original = new TrackRouting(null, null);
      const cloned = original.clone();
      
      expect(cloned.getInput()).toBeNull();
      expect(cloned.getOutput()).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON representation', () => {
      const routing = new TrackRouting('input1', 'output1');
      const json = routing.toJSON();
      
      expect(json).toEqual({
        input: 'input1',
        output: 'output1'
      });
    });

    it('should handle null values in JSON representation', () => {
      const routing = new TrackRouting(null, null);
      const json = routing.toJSON();
      
      expect(json).toEqual({
        input: null,
        output: null
      });
    });
  });
}); 