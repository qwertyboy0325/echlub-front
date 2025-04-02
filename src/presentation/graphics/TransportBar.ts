import * as PIXI from 'pixi.js';
import { injectable } from 'inversify';

export interface TransportBarConfig {
  width: number;
  height: number;
  backgroundColor?: number;
  bpm?: number;
}

export interface TransportBarCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onBpmChange: (bpm: number) => void;
}

@injectable()
export class TransportBar extends PIXI.Container {
  private config: TransportBarConfig;
  private callbacks: TransportBarCallbacks;
  private background: PIXI.Graphics;
  private isPlaying: boolean = false;
  private isRecording: boolean = false;
  private currentBpm: number = 120;

  // 控制區域的容器
  private controlsContainer: PIXI.Container;
  private timeContainer: PIXI.Container;
  private bpmContainer: PIXI.Container;

  // 控制區域的寬度常量
  private readonly CONTROLS_WIDTH = 120;
  private readonly TIME_WIDTH = 200;
  private readonly BPM_WIDTH = 120;
  private readonly BUTTON_SIZE = 16;
  private readonly BUTTON_SPACING = 10;
  private readonly SECTION_SPACING = 20;

  // 顯示元素
  private timeText!: PIXI.Text;
  private measureText!: PIXI.Text;
  private bpmText!: PIXI.Text;

  constructor(config: TransportBarConfig, callbacks: TransportBarCallbacks) {
    super();
    this.config = config;
    this.callbacks = callbacks;
    this.currentBpm = config.bpm || this.currentBpm;

    // 創建背景
    this.background = new PIXI.Graphics();
    this.drawBackground();
    this.addChild(this.background);

    // 創建容器
    this.controlsContainer = new PIXI.Container();
    this.timeContainer = new PIXI.Container();
    this.bpmContainer = new PIXI.Container();

    this.addChild(this.controlsContainer);
    this.addChild(this.timeContainer);
    this.addChild(this.bpmContainer);

    // 初始化各個區域
    this.createControlsSection();
    this.createTimeSection();
    this.createBPMSection();

    // 繪製分隔線
    this.drawSeparators();

    // 更新布局
    this.updateLayout();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.beginFill(this.config.backgroundColor || 0x2a2a2a);
    this.background.drawRect(0, 0, this.config.width, this.config.height);
    this.background.endFill();
  }

  private createControlsSection(): void {
    // 錄音按鈕
    const recordButton = this.createRecordButton();
    recordButton.position.set(0, 0);
    this.controlsContainer.addChild(recordButton);

    // 停止按鈕
    const stopButton = this.createStopButton();
    stopButton.position.set(this.BUTTON_SIZE + this.BUTTON_SPACING, 0);
    this.controlsContainer.addChild(stopButton);

    // 播放/暫停按鈕
    const playPauseButton = this.createPlayPauseButton();
    playPauseButton.position.set((this.BUTTON_SIZE + this.BUTTON_SPACING) * 2, 0);
    this.controlsContainer.addChild(playPauseButton);
  }

  private createTimeSection(): void {
    const timeText = new PIXI.Text('00:00.000', {
      fontSize: 14,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    this.timeContainer.addChild(timeText);
  }

  private createBPMSection(): void {
    const bpmLabel = new PIXI.Text('BPM', {
      fontSize: 14,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    this.bpmContainer.addChild(bpmLabel);

    const bpmText = new PIXI.Text(this.currentBpm.toString(), {
      fontSize: 14,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    bpmText.position.set(40, 0);
    this.bpmContainer.addChild(bpmText);
  }

  private drawSeparators(): void {
    const separators = new PIXI.Graphics();
    separators.lineStyle(1, 0x3c3c3c);

    // 控制區域和時間區域之間的分隔線
    separators.moveTo(this.CONTROLS_WIDTH, 0);
    separators.lineTo(this.CONTROLS_WIDTH, this.config.height);

    // 時間區域和 BPM 區域之間的分隔線
    separators.moveTo(this.CONTROLS_WIDTH + this.TIME_WIDTH, 0);
    separators.lineTo(this.CONTROLS_WIDTH + this.TIME_WIDTH, this.config.height);

    this.addChild(separators);
  }

  private updateLayout(): void {
    // 設置各個區域的位置
    this.controlsContainer.position.set(
      this.SECTION_SPACING,
      (this.config.height - this.BUTTON_SIZE) / 2
    );

    this.timeContainer.position.set(
      this.CONTROLS_WIDTH + this.SECTION_SPACING,
      (this.config.height - this.timeContainer.height) / 2
    );

    this.bpmContainer.position.set(
      this.CONTROLS_WIDTH + this.TIME_WIDTH + this.SECTION_SPACING,
      (this.config.height - this.bpmContainer.height) / 2
    );
  }

  private createRecordButton(): PIXI.Graphics {
    const recordButton = new PIXI.Graphics();
    
    // 外圈（白色圓圈）
    recordButton.lineStyle(1, 0xffffff);
    recordButton.beginFill(this.isRecording ? 0xff0000 : 0x2c2c2c);
    recordButton.drawCircle(this.BUTTON_SIZE/2, this.BUTTON_SIZE/2, this.BUTTON_SIZE/2 - 1);
    recordButton.endFill();

    // 內圈（紅點）
    recordButton.beginFill(this.isRecording ? 0xff3333 : 0xff0000);
    recordButton.drawCircle(this.BUTTON_SIZE/2, this.BUTTON_SIZE/2, this.BUTTON_SIZE/3);
    recordButton.endFill();

    recordButton.eventMode = 'static';
    recordButton.cursor = 'pointer';
    recordButton.on('click', () => {
      this.isRecording = !this.isRecording;
      this.drawRecordButton(recordButton);
      this.callbacks.onRecord();
    });
    return recordButton;
  }

  private createStopButton(): PIXI.Graphics {
    const stopButton = new PIXI.Graphics();
    stopButton.beginFill(0xffffff);
    stopButton.drawRect(0, 0, this.BUTTON_SIZE, this.BUTTON_SIZE);
    stopButton.endFill();
    stopButton.eventMode = 'static';
    stopButton.cursor = 'pointer';
    stopButton.on('click', () => {
      if (this.isPlaying || this.isRecording) {
        this.isPlaying = false;
        this.isRecording = false;
        const playPauseButton = this.controlsContainer.getChildAt(2) as PIXI.Graphics;
        const recordButton = this.controlsContainer.getChildAt(0) as PIXI.Graphics;
        this.drawPlayPauseButton(playPauseButton);
        this.drawRecordButton(recordButton);
      }
      this.callbacks.onStop();
    });
    return stopButton;
  }

  private createPlayPauseButton(): PIXI.Graphics {
    const playPauseButton = new PIXI.Graphics();
    playPauseButton.beginFill(0xffffff);
    
    if (this.isPlaying) {
      // 暫停圖標（兩個矩形）
      playPauseButton.drawRect(0, 0, 6, 16);
      playPauseButton.drawRect(12, 0, 6, 16);
    } else {
      // 播放圖標（三角形）
      playPauseButton.moveTo(0, 0);
      playPauseButton.lineTo(18, 8);
      playPauseButton.lineTo(0, 16);
      playPauseButton.closePath();
    }
    
    playPauseButton.endFill();
    playPauseButton.eventMode = 'static';
    playPauseButton.cursor = 'pointer';
    playPauseButton.on('click', () => {
      if (this.isPlaying) {
        this.callbacks.onPause();
      } else {
        this.callbacks.onPlay();
      }
      this.isPlaying = !this.isPlaying;
      this.drawPlayPauseButton(playPauseButton);
    });
    return playPauseButton;
  }

  private drawPlayPauseButton(graphics: PIXI.Graphics): void {
    graphics.clear();
    graphics.beginFill(0xffffff);
    
    if (this.isPlaying) {
      // 暫停圖標（兩個矩形）
      graphics.drawRect(0, 0, 6, 16);
      graphics.drawRect(12, 0, 6, 16);
    } else {
      // 播放圖標（三角形）
      graphics.moveTo(0, 0);
      graphics.lineTo(18, 8);
      graphics.lineTo(0, 16);
      graphics.closePath();
    }
    
    graphics.endFill();
  }

  private drawRecordButton(graphics: PIXI.Graphics): void {
    graphics.clear();
    
    // 外圈（白色圓圈）
    graphics.lineStyle(1, 0xffffff);
    graphics.beginFill(this.isRecording ? 0xff0000 : 0x2c2c2c);
    graphics.drawCircle(this.BUTTON_SIZE/2, this.BUTTON_SIZE/2, this.BUTTON_SIZE/2 - 1);
    graphics.endFill();

    // 內圈（紅點）
    graphics.beginFill(this.isRecording ? 0xff3333 : 0xff0000);
    graphics.drawCircle(this.BUTTON_SIZE/2, this.BUTTON_SIZE/2, this.BUTTON_SIZE/3);
    graphics.endFill();
  }

  public updateTime(time: number): void {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  public updateMeasure(measure: number, beat: number, tick: number): void {
    this.measureText.text = `${measure}.${beat}.${tick.toString().padStart(3, '0')}`;
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.drawBackground();
    this.updateLayout();
  }

  public play(): void {
    this.isPlaying = true;
    // 更新播放按鈕狀態
    const playButton = this.controlsContainer.getChildAt(2) as PIXI.Graphics;
    this.drawPlayPauseButton(playButton);
  }

  public pause(): void {
    this.isPlaying = false;
    // 更新播放按鈕狀態
    const playButton = this.controlsContainer.getChildAt(2) as PIXI.Graphics;
    this.drawPlayPauseButton(playButton);
  }

  public record(): void {
    this.isRecording = true;
    const recordButton = this.controlsContainer.getChildAt(0) as PIXI.Graphics;
    this.drawRecordButton(recordButton);
  }

  public stop(): void {
    this.isPlaying = false;
    this.isRecording = false;
    const playButton = this.controlsContainer.getChildAt(2) as PIXI.Graphics;
    const recordButton = this.controlsContainer.getChildAt(0) as PIXI.Graphics;
    this.drawPlayPauseButton(playButton);
    this.drawRecordButton(recordButton);
  }
} 