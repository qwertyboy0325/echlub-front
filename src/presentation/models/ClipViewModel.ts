import { v4 as uuidv4 } from 'uuid';
import { Clip } from '../../domain/Clip';

/**
 * 音頻片段的視圖模型
 */
interface AutomationData {
  time: number;
  value: number;
  curveType: 'linear' | 'exponential' | 'step';
}

interface ClipMetadata {
  bpm?: number;
  key?: string;
  tags?: string[];
}

interface ClipAutomation {
  volume?: AutomationData[];
  pan?: AutomationData[];
}

export interface ClipViewModel {
  id: string;
  trackId: string;
  audioUrl: string;
  startTime: number;
  duration: number;
  name: string;
  selected: boolean;
  
  // 計算屬性
  endTime: number;
  width: number;
  left: number;
}

export const PIXELS_PER_SECOND = 100;

export class ClipViewModelFactory {
  static fromDomain(clip: Clip): ClipViewModel {
    return {
      id: clip.id,
      trackId: clip.trackId,
      audioUrl: clip.audioUrl,
      startTime: clip.startTime,
      duration: clip.duration,
      name: clip.name,
      selected: clip.selected,
      
      // 計算屬性
      get endTime() {
        return this.startTime + this.duration;
      },
      get width() {
        return this.duration * PIXELS_PER_SECOND;
      },
      get left() {
        return this.startTime * PIXELS_PER_SECOND;
      }
    };
  }
}

export class ClipViewModel {
  public readonly id: string;
  public name: string;
  public audioUrl: string;
  public startTime: number;
  public duration: number;
  public position: number;
  public trackId: string;
  public volume: number;
  public pan: number;
  public muted: boolean;
  public soloed: boolean;
  public color: string;
  public waveformData?: Float32Array;
  public effects: string[];
  public metadata: ClipMetadata;
  public automation: ClipAutomation;
  public createdAt: Date;
  public updatedAt: Date;
  public version: number;

  constructor(
    audioUrl: string,
    startTime: number = 0,
    duration: number = 0,
    position: number = 0,
    name: string = 'New Clip',
    id: string = uuidv4(),
    trackId: string = '0'
  ) {
    this.id = id;
    this.name = name;
    this.audioUrl = audioUrl;
    this.startTime = startTime;
    this.duration = duration;
    this.position = position;
    this.trackId = trackId;
    this.volume = 1;
    this.pan = 0;
    this.muted = false;
    this.soloed = false;
    this.color = '#' + Math.floor(Math.random()*16777215).toString(16);
    this.effects = [];
    this.metadata = {};
    this.automation = {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
  }

  static fromDomain(domainClip: any): ClipViewModel {
    const viewModel = new ClipViewModel(
      domainClip.audioUrl,
      domainClip.startTime,
      domainClip.duration,
      domainClip.position,
      domainClip.name,
      domainClip.id,
      domainClip.trackId
    );
    viewModel.volume = domainClip.volume;
    viewModel.pan = domainClip.pan;
    viewModel.muted = domainClip.muted;
    viewModel.soloed = domainClip.soloed;
    viewModel.color = domainClip.color;
    viewModel.effects = [...domainClip.effects];
    viewModel.metadata = { ...domainClip.metadata };
    viewModel.automation = { ...domainClip.automation };
    viewModel.createdAt = domainClip.createdAt;
    viewModel.updatedAt = domainClip.updatedAt;
    viewModel.version = domainClip.version;
    if (domainClip.waveformData) {
      viewModel.waveformData = new Float32Array(domainClip.waveformData);
    }
    return viewModel;
  }

  toDomain(): any {
    return {
      id: this.id,
      name: this.name,
      audioUrl: this.audioUrl,
      startTime: this.startTime,
      duration: this.duration,
      position: this.position,
      trackId: this.trackId,
      volume: this.volume,
      pan: this.pan,
      muted: this.muted,
      soloed: this.soloed,
      color: this.color,
      effects: [...this.effects],
      metadata: { ...this.metadata },
      automation: { ...this.automation },
      waveformData: this.waveformData ? Array.from(this.waveformData) : undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }
} 