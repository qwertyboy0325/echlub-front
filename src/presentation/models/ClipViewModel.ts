import { v4 as uuidv4 } from 'uuid';

/**
 * 音頻片段的視圖模型
 */
export class ClipViewModel {
  public readonly id: string;
  public name: string;
  public audioUrl: string;
  public startTime: number;
  public duration: number;
  public position: number;
  public volume: number;
  public pan: number;
  public muted: boolean;
  public soloed: boolean;
  public effects: any[];
  public automation: any[];
  public createdAt: Date;
  public updatedAt: Date;
  public version: number;
  public trackId: string;

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
    this.volume = 1;
    this.pan = 0;
    this.muted = false;
    this.soloed = false;
    this.effects = [];
    this.automation = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
    this.trackId = trackId;
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
    viewModel.effects = [...domainClip.effects];
    viewModel.automation = [...domainClip.automation];
    viewModel.createdAt = domainClip.createdAt;
    viewModel.updatedAt = domainClip.updatedAt;
    viewModel.version = domainClip.version;
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
      volume: this.volume,
      pan: this.pan,
      muted: this.muted,
      soloed: this.soloed,
      effects: [...this.effects],
      automation: [...this.automation],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      trackId: this.trackId
    };
  }
} 