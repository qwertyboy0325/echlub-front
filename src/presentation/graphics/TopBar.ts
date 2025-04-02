import * as PIXI from 'pixi.js';
import { injectable } from 'inversify';

export interface TopBarConfig {
  width: number;
  height: number;
  backgroundColor?: number;
}

@injectable()
export class TopBar extends PIXI.Container {
  private config: TopBarConfig;
  private background: PIXI.Graphics;
  private projectNameText!: PIXI.Text;
  private saveButton!: PIXI.Container;

  private readonly PADDING = 20;
  private readonly BUTTON_WIDTH = 100;
  private readonly BUTTON_HEIGHT = 30;

  constructor(config: TopBarConfig) {
    super();

    this.config = config;

    // 創建背景
    this.background = new PIXI.Graphics();
    this.drawBackground();
    this.addChild(this.background);

    // 創建項目名稱
    this.createProjectName();

    // 創建保存按鈕
    this.createSaveButton();

    // 更新佈局
    this.updateLayout();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.beginFill(this.config.backgroundColor || 0x2c2c2c);
    this.background.drawRect(0, 0, this.config.width, this.config.height);
    this.background.endFill();
  }

  private createProjectName(): void {
    this.projectNameText = new PIXI.Text('My Project', {
      fontSize: 16,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    this.addChild(this.projectNameText);
  }

  private createSaveButton(): void {
    this.saveButton = new PIXI.Container();

    // 按鈕背景
    const bg = new PIXI.Graphics();
    bg.beginFill(0x3c3c3c);
    bg.drawRoundedRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 4);
    bg.endFill();
    this.saveButton.addChild(bg);

    // 按鈕文字
    const text = new PIXI.Text('Save 🔽', {
      fontSize: 14,
      fill: 0xffffff,
      fontFamily: 'Arial'
    });
    text.position.set(
      (this.BUTTON_WIDTH - text.width) / 2,
      (this.BUTTON_HEIGHT - text.height) / 2
    );
    this.saveButton.addChild(text);

    // 設置交互
    this.saveButton.eventMode = 'static';
    this.saveButton.cursor = 'pointer';
    this.saveButton.on('click', () => {
      // TODO: 實現保存功能
      console.log('Save clicked');
    });

    this.addChild(this.saveButton);
  }

  private updateLayout(): void {
    // 項目名稱位於左側
    this.projectNameText.position.set(
      this.PADDING,
      (this.config.height - this.projectNameText.height) / 2
    );

    // 保存按鈕位於右側
    this.saveButton.position.set(
      this.config.width - this.BUTTON_WIDTH - this.PADDING,
      (this.config.height - this.BUTTON_HEIGHT) / 2
    );
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.drawBackground();
    this.updateLayout();
  }
} 