import { BaseClip } from '../BaseClip';
import { ClipId } from '../../../value-objects/clips/ClipId';

// 創建一個具體的 BaseClip 實現用於測試
class TestClip extends BaseClip {
  toJSON(): object {
    return {
      id: this.getId(),
      startTime: this.getStartTime(),
      duration: this.getDuration(),
      gain: this.getGain(),
      version: this.getVersion()
    };
  }

  clone(): BaseClip {
    const cloned = new TestClip(
      ClipId.create(),
      this.getStartTime(),
      this.getDuration()
    );
    cloned.setGain(this.getGain());
    return cloned;
  }
}

describe('BaseClip', () => {
  let clipId: ClipId;
  let clip: TestClip;

  beforeEach(() => {
    clipId = ClipId.create();
    clip = new TestClip(clipId, 0, 4);
  });

  describe('建構函式', () => {
    it('應該正確初始化基本屬性', () => {
      expect(clip.getId()).toBe(clipId.toString());
      expect(clip.getStartTime()).toBe(0);
      expect(clip.getDuration()).toBe(4);
      expect(clip.getGain()).toBe(1);
      expect(clip.getVersion()).toBe(1);
    });

    it('應該在開始時間為負數時拋出錯誤', () => {
      expect(() => new TestClip(clipId, -1, 4))
        .toThrow('Start time cannot be negative');
    });

    it('應該在持續時間小於等於0時拋出錯誤', () => {
      expect(() => new TestClip(clipId, 0, 0))
        .toThrow('Duration must be positive');
      expect(() => new TestClip(clipId, 0, -1))
        .toThrow('Duration must be positive');
    });
  });

  describe('時間管理', () => {
    it('應該正確設置開始時間', () => {
      clip.setStartTime(2);
      expect(clip.getStartTime()).toBe(2);
    });

    it('應該在設置負數開始時間時拋出錯誤', () => {
      expect(() => clip.setStartTime(-1))
        .toThrow('Start time cannot be negative');
    });

    it('應該正確設置持續時間', () => {
      clip.setDuration(6);
      expect(clip.getDuration()).toBe(6);
    });

    it('應該在設置無效持續時間時拋出錯誤', () => {
      expect(() => clip.setDuration(0))
        .toThrow('Duration must be positive');
      expect(() => clip.setDuration(-1))
        .toThrow('Duration must be positive');
    });
  });

  describe('增益管理', () => {
    it('應該正確設置增益值', () => {
      clip.setGain(0.8);
      expect(clip.getGain()).toBe(0.8);
    });

    it('應該在設置負數增益值時拋出錯誤', () => {
      expect(() => clip.setGain(-0.1))
        .toThrow('Gain cannot be negative');
    });
  });

  describe('版本控制', () => {
    it('應該在修改時增加版本號', () => {
      const initialVersion = clip.getVersion();
      
      clip.setStartTime(2);
      expect(clip.getVersion()).toBe(initialVersion + 1);
      
      clip.setDuration(6);
      expect(clip.getVersion()).toBe(initialVersion + 2);
      
      clip.setGain(0.8);
      expect(clip.getVersion()).toBe(initialVersion + 3);
    });
  });

  describe('狀態管理', () => {
    it('應該正確管理片段狀態', () => {
      clip.setStartTime(2);
      clip.setDuration(6);
      clip.setGain(0.8);

      expect(clip.getStartTime()).toBe(2);
      expect(clip.getDuration()).toBe(6);
      expect(clip.getGain()).toBe(0.8);
    });
  });

  describe('相等性比較', () => {
    it('應該正確比較兩個片段', () => {
      const sameClip = new TestClip(clipId, 0, 4);
      const differentClip = new TestClip(ClipId.create(), 0, 4);

      expect(clip.equals(sameClip)).toBe(true);
      expect(clip.equals(differentClip)).toBe(false);
    });

    it('應該在比較非 BaseClip 實例時返回 false', () => {
      expect(clip.equals(null as any)).toBe(false);
      expect(clip.equals({} as any)).toBe(false);
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為 JSON', () => {
      clip.setStartTime(2);
      clip.setDuration(6);
      clip.setGain(0.8);

      const json = clip.toJSON();
      expect(json).toEqual({
        id: clipId.toString(),
        startTime: 2,
        duration: 6,
        gain: 0.8,
        version: clip.getVersion()
      });
    });
  });

  describe('克隆', () => {
    it('應該創建具有新 ID 的深度副本', () => {
      const cloned = clip.clone();
      
      expect(cloned.getId()).not.toBe(clip.getId());
      expect(cloned.getStartTime()).toBe(clip.getStartTime());
      expect(cloned.getDuration()).toBe(clip.getDuration());
      expect(cloned.getGain()).toBe(clip.getGain());
      expect(cloned.getVersion()).toBe(2); // 克隆操作會增加版本號
      
      // 驗證修改克隆不會影響原始對象
      cloned.setGain(0.5);
      expect(cloned.getGain()).toBe(0.5);
      expect(clip.getGain()).toBe(1.0);
    });
  });
}); 