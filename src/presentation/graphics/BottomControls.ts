import * as PIXI from 'pixi.js';

interface BottomControlsConfig {
  width: number;
  height: number;
}

interface BottomControlsCallbacks {
  onCreateTrack: () => void;
}

export class BottomControls extends PIXI.Container {
  private config: BottomControlsConfig;
  private callbacks: BottomControlsCallbacks;
  private background: PIXI.Graphics;
  private controlsContainer: PIXI.Container;
  private addTrackButton: PIXI.Container;

  constructor(config: BottomControlsConfig, callbacks: BottomControlsCallbacks) {
    super();
    this.config = config;
    this.callbacks = callbacks;

    // 創建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    // 創建控制項容器
    this.controlsContainer = new PIXI.Container();
    this.addChild(this.controlsContainer);

    this.draw();
    this.createAddTrackButton();
  }

  private createAddTrackButton(): void {
    const button = new PIXI.Container();
    
    // 創建按鈕背景
    const background = new PIXI.Graphics();
    background.beginFill(0x444444);
    background.drawRoundedRect(0, 0, 100, 24, 4);
    background.endFill();
    button.addChild(background);

    // 創建按鈕文字
    const text = new PIXI.Text('Add Track', {
      fontSize: 12,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    text.position.set(
      (background.width - text.width) / 2,
      (background.height - text.height) / 2
    );
    button.addChild(text);

    // 設置按鈕位置
    button.position.set(10, (this.config.height - 24) / 2);

    // 添加交互性
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // 添加懸停效果
    button.on('pointerover', () => {
      background.tint = 0x666666;
    });
    button.on('pointerout', () => {
      background.tint = 0xffffff;
    });

    // 添加點擊事件
    button.on('pointerdown', () => {
      console.log('[BottomControls] Add Track button clicked');
      this.callbacks.onCreateTrack();
    });

    this.addTrackButton = button;
    this.controlsContainer.addChild(button);
  }

  private draw(): void {
    this.drawBackground();
    this.drawControls();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.beginFill(0x1a1a1a);
    this.background.drawRect(0, 0, this.config.width, this.config.height);
    this.background.endFill();

    // 添加頂部分隔線
    this.background.lineStyle(1, 0x333333);
    this.background.moveTo(0, 0);
    this.background.lineTo(this.config.width, 0);
  }

  private drawControls(): void {
    this.controlsContainer.removeChildren();

    // 重新添加 Add Track 按鈕
    this.createAddTrackButton();

    // 添加音量控制
    const volumeLabel = new PIXI.Text('Volume', {
      fontSize: 12,
      fill: 0xcccccc,
      fontFamily: 'Arial'
    });
    volumeLabel.position.set(120, (this.config.height - volumeLabel.height) / 2);
    this.controlsContainer.addChild(volumeLabel);

    // 添加聲道控制
    const panLabel = new PIXI.Text('Pan', {
      fontSize: 12,
      fill: 0xcccccc,
      fontFamily: 'Arial'
    });
    panLabel.position.set(210, (this.config.height - panLabel.height) / 2);
    this.controlsContainer.addChild(panLabel);

    // 添加效果控制
    const effectsLabel = new PIXI.Text('Effects', {
      fontSize: 12,
      fill: 0xcccccc,
      fontFamily: 'Arial'
    });
    effectsLabel.position.set(290, (this.config.height - effectsLabel.height) / 2);
    this.controlsContainer.addChild(effectsLabel);
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.draw();
    
    // 更新按鈕位置
    if (this.addTrackButton) {
      this.addTrackButton.position.set(10, (height - 24) / 2);
    }
  }
} 