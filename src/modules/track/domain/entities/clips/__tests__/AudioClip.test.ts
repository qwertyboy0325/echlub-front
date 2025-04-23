import { AudioClip, FadeSettings } from '../AudioClip';
import { ClipId } from '../../../value-objects/clips/ClipId';

describe('AudioClip', () => {
  let clipId: ClipId;
  let clip: AudioClip;
  const sampleId = 'sample-1';

  beforeEach(() => {
    clipId = ClipId.create();
    clip = new AudioClip(clipId, sampleId, 0, 4);
  });

  describe('建構函式', () => {
    it('應該正確初始化基本屬性', () => {
      expect(clip.getId()).toBe(clipId.toString());
      expect(clip.getSampleId()).toBe(sampleId);
      expect(clip.getStartTime()).toBe(0);
      expect(clip.getDuration()).toBe(4);
      expect(clip.getGain()).toBe(1);
      expect(clip.getOffset()).toBe(0);
      expect(clip.getFadeIn()).toBeNull();
      expect(clip.getFadeOut()).toBeNull();
    });

    it('應該正確初始化帶有偏移量的片段', () => {
      const clipWithOffset = new AudioClip(clipId, sampleId, 0, 4, 2);
      expect(clipWithOffset.getOffset()).toBe(2);
    });

    it('應該在偏移量為負數時拋出錯誤', () => {
      expect(() => new AudioClip(clipId, sampleId, 0, 4, -1))
        .toThrow('Offset cannot be negative');
    });
  });

  describe('偏移量管理', () => {
    it('應該正確設置偏移量', () => {
      clip.setOffset(2);
      expect(clip.getOffset()).toBe(2);
    });

    it('應該在設置負數偏移量時拋出錯誤', () => {
      expect(() => clip.setOffset(-1))
        .toThrow('Offset cannot be negative');
    });
  });

  describe('淡入淡出管理', () => {
    const fadeSettings: FadeSettings = {
      duration: 1,
      curve: 'linear'
    };

    it('應該正確設置淡入', () => {
      clip.setFadeIn(fadeSettings);
      expect(clip.getFadeIn()).toEqual(fadeSettings);
    });

    it('應該正確設置淡出', () => {
      clip.setFadeOut(fadeSettings);
      expect(clip.getFadeOut()).toEqual(fadeSettings);
    });

    it('應該在淡入持續時間無效時拋出錯誤', () => {
      expect(() => clip.setFadeIn({ ...fadeSettings, duration: -1 }))
        .toThrow('Fade duration must be positive');
      expect(() => clip.setFadeIn({ ...fadeSettings, duration: 0 }))
        .toThrow('Fade duration must be positive');
    });

    it('應該在淡出持續時間無效時拋出錯誤', () => {
      expect(() => clip.setFadeOut({ ...fadeSettings, duration: -1 }))
        .toThrow('Fade duration must be positive');
      expect(() => clip.setFadeOut({ ...fadeSettings, duration: 0 }))
        .toThrow('Fade duration must be positive');
    });

    it('應該在淡入持續時間超過片段長度時拋出錯誤', () => {
      expect(() => clip.setFadeIn({ ...fadeSettings, duration: 5 }))
        .toThrow('Fade duration cannot be longer than clip duration');
    });

    it('應該在淡出持續時間超過片段長度時拋出錯誤', () => {
      expect(() => clip.setFadeOut({ ...fadeSettings, duration: 5 }))
        .toThrow('Fade duration cannot be longer than clip duration');
    });

    it('應該在淡入曲線無效時拋出錯誤', () => {
      expect(() => clip.setFadeIn({ ...fadeSettings, curve: 'invalid' as any }))
        .toThrow('Invalid fade curve type');
    });

    it('應該在淡出曲線無效時拋出錯誤', () => {
      expect(() => clip.setFadeOut({ ...fadeSettings, curve: 'invalid' as any }))
        .toThrow('Invalid fade curve type');
    });
  });

  describe('版本控制', () => {
    it('應該在修改時增加版本號', () => {
      const initialVersion = clip.getVersion();
      const fadeSettings: FadeSettings = {
        duration: 1,
        curve: 'linear'
      };

      clip.setOffset(2);
      expect(clip.getVersion()).toBe(initialVersion + 1);

      clip.setFadeIn(fadeSettings);
      expect(clip.getVersion()).toBe(initialVersion + 2);

      clip.setFadeOut(fadeSettings);
      expect(clip.getVersion()).toBe(initialVersion + 3);
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為 JSON', () => {
      const fadeIn: FadeSettings = {
        duration: 1,
        curve: 'linear'
      };
      const fadeOut: FadeSettings = {
        duration: 0.5,
        curve: 'exponential'
      };

      clip.setStartTime(2);
      clip.setDuration(6);
      clip.setGain(0.8);
      clip.setOffset(1);
      clip.setFadeIn(fadeIn);
      clip.setFadeOut(fadeOut);

      const json = clip.toJSON();
      expect(json).toEqual({
        clipId: clipId.toString(),
        startTime: 2,
        duration: 6,
        gain: 0.8,
        sampleId,
        offset: 1,
        fadeIn,
        fadeOut,
        version: clip.getVersion()
      });
    });
  });

  describe('克隆', () => {
    it('應該創建具有新 ID 的深度副本', () => {
      const fadeIn: FadeSettings = {
        duration: 1,
        curve: 'linear'
      };
      const fadeOut: FadeSettings = {
        duration: 0.5,
        curve: 'exponential'
      };

      clip.setStartTime(2);
      clip.setDuration(6);
      clip.setGain(0.8);
      clip.setOffset(1);
      clip.setFadeIn(fadeIn);
      clip.setFadeOut(fadeOut);

      const cloned = clip.clone();
      expect(cloned.getId()).not.toBe(clip.getId());
      expect(cloned.getSampleId()).toBe(clip.getSampleId());
      expect(cloned.getStartTime()).toBe(clip.getStartTime());
      expect(cloned.getDuration()).toBe(clip.getDuration());
      expect(cloned.getGain()).toBe(clip.getGain());
      expect(cloned.getOffset()).toBe(clip.getOffset());
      expect(cloned.getFadeIn()).toEqual(clip.getFadeIn());
      expect(cloned.getFadeOut()).toEqual(clip.getFadeOut());
      expect(cloned.getVersion()).toBe(clip.getVersion());
    });
  });
}); 