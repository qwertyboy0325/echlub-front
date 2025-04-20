import { ClipId } from '../../../domain/value-objects/ClipId';
import { BaseClip } from '../../../domain/entities/BaseClip';

class TestClip extends BaseClip {
  toJSON(): object {
    return this.getState();
  }
  clone(): BaseClip {
    return new TestClip(
      ClipId.create(),
      this.getStartTime(),
      this.getDuration()
    );
  }
}

describe('BaseClip', () => {
  let clipId: ClipId;

  beforeEach(() => {
    clipId = ClipId.create();
  });

  describe('建構函數驗證', () => {
    it('應該正確創建片段', () => {
      const clip = new TestClip(clipId, 0, 10);
      expect(clip.getStartTime()).toBe(0);
      expect(clip.getDuration()).toBe(10);
      expect(clip.getGain()).toBe(1);
    });

    it('當開始時間為負數時應拋出錯誤', () => {
      expect(() => new TestClip(clipId, -1, 10))
        .toThrow('Start time cannot be negative');
    });

    it('當持續時間小於等於0時應拋出錯誤', () => {
      expect(() => new TestClip(clipId, 0, 0))
        .toThrow('Duration must be positive');
      expect(() => new TestClip(clipId, 0, -1))
        .toThrow('Duration must be positive');
    });
  });

  describe('版本控制', () => {
    it('應該正確追踪版本變化', () => {
      const clip = new TestClip(clipId, 0, 10);
      expect(clip.getVersion()).toBe(0);
      
      clip.setGain(0.8);
      expect(clip.getVersion()).toBe(1);
      
      clip.setGain(0.5);
      expect(clip.getVersion()).toBe(2);
    });
  });

  describe('增益控制', () => {
    it('應該正確設置和獲取增益值', () => {
      const clip = new TestClip(clipId, 0, 10);
      clip.setGain(0.5);
      expect(clip.getGain()).toBe(0.5);
    });

    it('當設置負增益值時應拋出錯誤', () => {
      const clip = new TestClip(clipId, 0, 10);
      expect(() => clip.setGain(-0.1))
        .toThrow('Gain cannot be negative');
    });
  });

  describe('狀態管理', () => {
    it('應該返回正確的狀態對象', () => {
      const clip = new TestClip(clipId, 5, 15);
      clip.setGain(0.7);

      const state = clip.getState();
      expect(state).toEqual({
        startTime: 5,
        duration: 15,
        gain: 0.7
      });
    });
  });
}); 