import { AudioClip, FadeSettings } from '../../domain/entities/AudioClip';
import { ClipId } from '../../domain/value-objects/ClipId';
import { WaveformData } from '../../domain/value-objects/WaveformData';

describe('AudioClip', () => {
  let clip: AudioClip;
  const clipId = ClipId.create();
  const sampleId = 'test-sample-1';
  const startTime = 0;
  const duration = 10;
  const offset = 2;

  beforeEach(() => {
    clip = new AudioClip(clipId, sampleId, startTime, duration, offset);
  });

  it('should create an audio clip with correct properties', () => {
    expect(clip.getId()).toBe(clipId.toString());
    expect(clip.getSampleId()).toBe(sampleId);
    expect(clip.getStartTime()).toBe(startTime);
    expect(clip.getDuration()).toBe(duration);
    expect(clip.getOffset()).toBe(offset);
    expect(clip.getVersion()).toBe(0);
  });

  it('should update waveform data', () => {
    const waveform = new WaveformData(new Float32Array([0.1, 0.2]), 100);
    clip.updateWaveform(waveform);
    expect(clip.getWaveform()).toEqual(waveform);
    expect(clip.getVersion()).toBe(1);
  });

  it('should set fade in settings', () => {
    const fadeIn: FadeSettings = {
      type: 'linear',
      duration: 2
    };
    clip.setFadeIn(fadeIn);
    expect(clip.getFadeIn()).toEqual(fadeIn);
    expect(clip.getVersion()).toBe(1);
  });

  it('should set fade out settings', () => {
    const fadeOut: FadeSettings = {
      type: 'exponential',
      duration: 1.5
    };
    clip.setFadeOut(fadeOut);
    expect(clip.getFadeOut()).toEqual(fadeOut);
    expect(clip.getVersion()).toBe(1);
  });

  it('should set gain', () => {
    const gain = 0.8;
    clip.setGain(gain);
    expect(clip.getGain()).toBe(gain);
    expect(clip.getVersion()).toBe(1);
  });

  it('should throw error when setting negative gain', () => {
    expect(() => clip.setGain(-0.5)).toThrow('Gain cannot be negative');
  });

  it('should serialize to JSON correctly', () => {
    const fadeIn: FadeSettings = { type: 'linear', duration: 2 };
    const fadeOut: FadeSettings = { type: 'exponential', duration: 1.5 };
    const waveform = new WaveformData(new Float32Array([0.1, 0.2]), 100);
    
    clip.setFadeIn(fadeIn);
    clip.setFadeOut(fadeOut);
    clip.updateWaveform(waveform);
    clip.setGain(0.8);

    const json = clip.toJSON();
    expect(json).toEqual({
      clipId: clipId.toString(),
      startTime,
      duration,
      gain: 0.8,
      sampleId,
      offset,
      waveform: waveform.toJSON(),
      fadeIn,
      fadeOut,
      version: 4
    });
  });
}); 