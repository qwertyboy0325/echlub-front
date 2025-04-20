import { AudioClip } from '../../../domain/entities/AudioClip';
import { ClipId } from '../../../domain/value-objects/ClipId';
import { WaveformData } from '../../../domain/value-objects/WaveformData';

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid'
}));

describe('AudioClip', () => {
  let clipId: ClipId;

  beforeEach(() => {
    clipId = ClipId.create();
  });

  describe('建構函數驗證', () => {
    it('應該正確創建音頻片段', () => {
      const clip = new AudioClip(clipId, 'sample-1', 0, 10);
      expect(clip.getSampleId()).toBe('sample-1');
      expect(clip.getStartTime()).toBe(0);
      expect(clip.getDuration()).toBe(10);
      expect(clip.getOffset()).toBe(0);
      expect(clip.getGain()).toBe(1);
    });

    it('當開始時間為負數時應拋出錯誤', () => {
      expect(() => new AudioClip(clipId, 'sample-1', -1, 10))
        .toThrow('Start time cannot be negative');
    });

    it('當持續時間小於等於0時應拋出錯誤', () => {
      expect(() => new AudioClip(clipId, 'sample-1', 0, 0))
        .toThrow('Duration must be positive');
      expect(() => new AudioClip(clipId, 'sample-1', 0, -1))
        .toThrow('Duration must be positive');
    });

    it('應該正確設置偏移量', () => {
      const clip = new AudioClip(clipId, 'sample-1', 0, 10, 2);
      expect(clip.getOffset()).toBe(2);
    });
  });

  describe('波形數據管理', () => {
    let clip: AudioClip;
    let waveformData: WaveformData;

    beforeEach(() => {
      clip = new AudioClip(clipId, 'sample-1', 0, 10);
      const peaks = new Float32Array([0.1, 0.2, 0.3]);
      waveformData = new WaveformData(peaks, 100);
    });

    it('應該能夠更新波形數據', () => {
      clip.updateWaveform(waveformData);
      expect(clip.getWaveform()).toBe(waveformData);
    });

    it('更新波形數據時應增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.updateWaveform(waveformData);
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });
  });

  describe('淡入淡出設置', () => {
    let clip: AudioClip;

    beforeEach(() => {
      clip = new AudioClip(clipId, 'sample-1', 0, 10);
    });

    it('應該能夠設置淡入效果', () => {
      const fadeIn = { type: 'linear' as const, duration: 2 };
      clip.setFadeIn(fadeIn);
      expect(clip.getFadeIn()).toEqual(fadeIn);
    });

    it('應該能夠設置淡出效果', () => {
      const fadeOut = { type: 'exponential' as const, duration: 1.5 };
      clip.setFadeOut(fadeOut);
      expect(clip.getFadeOut()).toEqual(fadeOut);
    });

    it('設置淡入效果時應增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.setFadeIn({ type: 'linear', duration: 2 });
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });

    it('設置淡出效果時應增加版本號', () => {
      const initialVersion = clip.getVersion();
      clip.setFadeOut({ type: 'exponential', duration: 1.5 });
      expect(clip.getVersion()).toBe(initialVersion + 1);
    });
  });

  describe('克隆功能', () => {
    it('應該正確克隆音頻片段', () => {
      const originalClip = new AudioClip(clipId, 'sample-1', 0, 10, 2);
      originalClip.setFadeIn({ type: 'linear', duration: 2 });
      originalClip.setFadeOut({ type: 'exponential', duration: 1.5 });
      originalClip.setGain(0.8);

      const clonedClip = originalClip.clone();

      expect(clonedClip.getSampleId()).toBe(originalClip.getSampleId());
      expect(clonedClip.getStartTime()).toBe(originalClip.getStartTime());
      expect(clonedClip.getDuration()).toBe(originalClip.getDuration());
      expect(clonedClip.getOffset()).toBe(originalClip.getOffset());
      expect(clonedClip.getGain()).toBe(originalClip.getGain());
      expect(clonedClip.getFadeIn()).toEqual(originalClip.getFadeIn());
      expect(clonedClip.getFadeOut()).toEqual(originalClip.getFadeOut());
    });
  });

  describe('JSON序列化', () => {
    it('應該正確序列化所有屬性', () => {
      const clip = new AudioClip(clipId, 'sample-1', 0, 10, 2);
      const peaks = new Float32Array([0.1, 0.2, 0.3]);
      const waveformData = new WaveformData(peaks, 100);
      
      clip.updateWaveform(waveformData);
      clip.setFadeIn({ type: 'linear', duration: 2 });
      clip.setFadeOut({ type: 'exponential', duration: 1.5 });
      clip.setGain(0.8);

      const json = clip.toJSON() as {
        clipId: string;
        sampleId: string;
        startTime: number;
        duration: number;
        offset: number;
        gain: number;
        waveform?: { peaks: number[], resolution: number };
        fadeIn?: { type: 'linear' | 'exponential', duration: number };
        fadeOut?: { type: 'linear' | 'exponential', duration: number };
        version: number;
      };
      
      expect(json).toMatchObject({
        clipId: clipId.toString(),
        sampleId: 'sample-1',
        startTime: 0,
        duration: 10,
        offset: 2,
        gain: 0.8,
        fadeIn: { type: 'linear', duration: 2 },
        fadeOut: { type: 'exponential', duration: 1.5 }
      });

      // 單獨驗證波形數據，考慮浮點數精度
      const waveform = json.waveform;
      expect(waveform?.resolution).toBe(100);
      expect(waveform?.peaks[0]).toBeCloseTo(0.1, 5);
      expect(waveform?.peaks[1]).toBeCloseTo(0.2, 5);
      expect(waveform?.peaks[2]).toBeCloseTo(0.3, 5);
      expect(json.version).toEqual(expect.any(Number));
    });
  });
}); 