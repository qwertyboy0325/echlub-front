import { injectable } from 'inversify';
import { IAudioContext } from '../di/types';

@injectable()
export class AudioContextWrapper implements IAudioContext {
  private context: AudioContext | null = null;

  constructor() {
    this.context = new AudioContext();
  }

  public async onInit(): Promise<void> {
    if (this.context) {
      await this.context.resume();
    }
  }

  public async onDestroy(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }

  public getContext(): AudioContext | null {
    return this.context;
  }

  public async resume(): Promise<void> {
    if (this.context) {
      await this.context.resume();
    }
  }

  public async suspend(): Promise<void> {
    if (this.context) {
      await this.context.suspend();
    }
  }

  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }

  // 代理 AudioContext 的其他方法
  public get currentTime(): number {
    return this.context?.currentTime ?? 0;
  }

  public get sampleRate(): number {
    return this.context?.sampleRate ?? 44100;
  }

  public get state(): AudioContextState {
    return this.context?.state ?? 'suspended';
  }

  public async decodeAudioData(
    arrayBuffer: ArrayBuffer
  ): Promise<AudioBuffer> {
    if (!this.context) {
      throw new Error('AudioContext is not initialized');
    }
    return this.context.decodeAudioData(arrayBuffer);
  }

  public createGain(): GainNode {
    if (!this.context) {
      throw new Error('AudioContext is not initialized');
    }
    return this.context.createGain();
  }

  public createOscillator(): OscillatorNode {
    if (!this.context) {
      throw new Error('AudioContext is not initialized');
    }
    return this.context.createOscillator();
  }

  public createBufferSource(): AudioBufferSourceNode {
    if (!this.context) {
      throw new Error('AudioContext is not initialized');
    }
    return this.context.createBufferSource();
  }
} 