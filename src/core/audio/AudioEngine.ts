import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import type { IAudioEngine, IAudioContext } from '../di/types';
import type { DomainEventBus } from '../events/DomainEventBus';
import type { AudioRepository } from '../../domain/repositories/AudioRepository';
import type { UIEventBus } from '../events/UIEventBus';

@injectable()
export class AudioEngine implements IAudioEngine {
  private bpm: number = 120;
  private isPausedState: boolean = true;
  private startTime: number = 0;
  private pauseTime: number = 0;

  constructor(
    @inject(TYPES.AudioContext) public context: IAudioContext,
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus,
    @inject(TYPES.AudioRepository) private audioRepository: AudioRepository
  ) {}

  public async onInit(): Promise<void> {
    await this.context.resume();
    this.uiEventBus.on('ui:playback:start', () => this.play());
    this.uiEventBus.on('ui:playback:pause', () => this.pause());
    this.uiEventBus.on('ui:playback:stop', () => this.stop());
    this.uiEventBus.on('ui:bpm:change', (payload) => this.setBPM(payload.bpm));
  }

  public async onDestroy(): Promise<void> {
    await this.context.close();
    this.uiEventBus.off('ui:playback:start', () => this.play());
    this.uiEventBus.off('ui:playback:pause', () => this.pause());
    this.uiEventBus.off('ui:playback:stop', () => this.stop());
    this.uiEventBus.off('ui:bpm:change', (payload) => this.setBPM(payload.bpm));
  }

  public play(): void {
    if (this.isPausedState) {
      this.context.resume();
      if (this.pauseTime > 0) {
        this.startTime = this.context.currentTime - this.pauseTime;
      } else {
        this.startTime = this.context.currentTime;
      }
      this.isPausedState = false;
      this.domainEventBus.emit('domain:playback:started', { time: this.getCurrentTime() });
    }
  }

  public pause(): void {
    if (!this.isPausedState) {
      this.context.suspend();
      this.pauseTime = this.context.currentTime - this.startTime;
      this.isPausedState = true;
      this.domainEventBus.emit('domain:playback:paused', { time: this.getCurrentTime() });
    }
  }

  public stop(): void {
    this.context.suspend();
    this.startTime = 0;
    this.pauseTime = 0;
    this.isPausedState = true;
    this.domainEventBus.emit('domain:playback:stopped', { time: 0 });
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public getCurrentTime(): number {
    if (this.isPausedState) {
      return this.pauseTime;
    }
    return this.context.currentTime - this.startTime;
  }

  public setBPM(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
    this.domainEventBus.emit('domain:bpm:changed', { bpm: this.bpm });
  }

  public getBPM(): number {
    return this.bpm;
  }

  public async loadAudio(file: File): Promise<string> {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
          
          const id = crypto.randomUUID();
          const url = URL.createObjectURL(file);
          
          await this.audioRepository.addAudioResource({
            id,
            url,
            name: file.name,
            duration: audioBuffer.duration,
            waveformData: this.generateWaveformData(audioBuffer)
          });
          
          resolve(id);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private generateWaveformData(audioBuffer: AudioBuffer): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    const samples = 200; // 波形數據點數
    const blockSize = Math.floor(channelData.length / samples);
    const waveformData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let sum = 0;
      
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j]);
      }
      
      waveformData[i] = sum / blockSize;
    }

    return waveformData;
  }
} 