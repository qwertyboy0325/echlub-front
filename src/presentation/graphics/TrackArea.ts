import * as PIXI from 'pixi.js';

interface TrackAreaConfig {
  width: number;
  height: number;
}

interface Track {
  id: string;
  name: string;
  clips: Clip[];
}

interface Clip {
  id: string;
  startTime: number;
  duration: number;
  color: number;
}

export class TrackArea extends PIXI.Container {
  private config: TrackAreaConfig;
  private background: PIXI.Graphics;
  private tracksContainer: PIXI.Container;
  private readonly TRACK_HEIGHT = 100;
  private readonly TRACK_GAP = 2;
  private tracks: Track[] = [];

  constructor(config: TrackAreaConfig) {
    super();
    this.config = config;

    // 創建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    // 創建軌道容器
    this.tracksContainer = new PIXI.Container();
    this.addChild(this.tracksContainer);

    this.draw();
  }

  private draw(): void {
    this.drawBackground();
    this.drawTracks();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.beginFill(0x1a1a1a);
    this.background.drawRect(0, 0, this.config.width, this.config.height);
    this.background.endFill();
  }

  private drawTracks(): void {
    this.tracksContainer.removeChildren();

    this.tracks.forEach((track, index) => {
      const trackContainer = new PIXI.Container();
      
      // 繪製軌道背景
      const background = new PIXI.Graphics();
      background.beginFill(0x2a2a2a);
      background.drawRect(0, 0, this.config.width, this.TRACK_HEIGHT);
      background.endFill();
      trackContainer.addChild(background);

      // 添加軌道名稱
      const trackName = new PIXI.Text(track.name, {
        fontSize: 12,
        fill: 0xcccccc,
        fontFamily: 'Arial'
      });
      trackName.position.set(10, 10);
      trackContainer.addChild(trackName);

      // 繪製片段
      track.clips.forEach(clip => {
        const clipGraphics = new PIXI.Graphics();
        clipGraphics.beginFill(clip.color);
        clipGraphics.drawRect(
          clip.startTime * 100, // 假設 100 像素/秒
          20, // 從軌道頂部留出一些空間
          clip.duration * 100,
          this.TRACK_HEIGHT - 40
        );
        clipGraphics.endFill();
        trackContainer.addChild(clipGraphics);
      });

      // 設置軌道位置
      trackContainer.position.set(0, index * (this.TRACK_HEIGHT + this.TRACK_GAP));
      this.tracksContainer.addChild(trackContainer);
    });
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.draw();
  }

  public getTrackHeight(): number {
    return this.TRACK_HEIGHT;
  }

  public getTrackGap(): number {
    return this.TRACK_GAP;
  }

  public updateTracks(tracks: Track[]): void {
    this.tracks = tracks;
    this.draw();
  }

  public addClip(trackId: string, clip: Clip): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips.push(clip);
      this.draw();
    }
  }

  public updateClip(trackId: string, clip: Clip): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      const clipIndex = track.clips.findIndex(c => c.id === clip.id);
      if (clipIndex !== -1) {
        track.clips[clipIndex] = clip;
        this.draw();
      }
    }
  }

  public removeClip(trackId: string, clipId: string): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips = track.clips.filter(c => c.id !== clipId);
      this.draw();
    }
  }
} 