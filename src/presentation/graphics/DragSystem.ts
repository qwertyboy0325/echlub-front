import * as PIXI from 'pixi.js';
import { DAWScene } from './DAWScene';

export class DragSystem {
  private scene: DAWScene;
  private isDragging: boolean = false;
  private dragTarget: PIXI.Container | null = null;
  private dragStartPosition = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };

  // 事件回調
  public onClipDragStart: ((clipId: string) => void) | null = null;
  public onClipDragMove: ((clipId: string, position: number, trackId: string) => void) | null = null;
  public onClipDragEnd: ((clipId: string, position: number, trackId: string) => void) | null = null;

  constructor(scene: DAWScene) {
    this.scene = scene;
    this.initializeDragSystem();
  }

  private initializeDragSystem(): void {
    const container = this.scene.getContainer();
    
    // 設置容器為可交互
    container.eventMode = 'static';
    container.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000); // 臨時解決方案，後續需要動態更新

    // 註冊事件處理器
    container.addEventListener('pointerdown', this.handleDragStart.bind(this));
    container.addEventListener('pointermove', this.handleDragMove.bind(this));
    container.addEventListener('pointerup', this.handleDragEnd.bind(this));
    container.addEventListener('pointerupoutside', this.handleDragEnd.bind(this));
  }

  private handleDragStart(event: PIXI.FederatedPointerEvent): void {
    const target = event.target as PIXI.Container;
    if (!target || !target.parent || target === this.scene.getContainer()) return;

    this.isDragging = true;
    this.dragTarget = target.parent; // 使用父容器作為拖拽目標
    
    // 記錄起始位置
    this.dragStartPosition.x = this.dragTarget.x;
    this.dragStartPosition.y = this.dragTarget.y;
    
    // 計算偏移量
    const localPos = event.getLocalPosition(this.dragTarget.parent);
    this.dragOffset.x = localPos.x - this.dragTarget.x;
    this.dragOffset.y = localPos.y - this.dragTarget.y;

    // 觸發開始拖拽事件
    if (this.onClipDragStart && this.dragTarget.name) {
      this.onClipDragStart(this.dragTarget.name);
    }
  }

  private handleDragMove(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging || !this.dragTarget) return;

    // 計算新位置
    const container = this.scene.getContainer();
    const localPos = event.getLocalPosition(container);
    const newX = localPos.x - this.dragOffset.x;
    const newY = localPos.y - this.dragOffset.y;

    // 限制移動範圍
    const trackHeight = container.height / 8; // 假設有 8 個軌道
    const snappedY = Math.floor(newY / trackHeight) * trackHeight;
    
    this.dragTarget.x = Math.max(0, newX);
    this.dragTarget.y = Math.max(0, Math.min(snappedY, container.height - trackHeight));

    // 觸發移動事件
    if (this.onClipDragMove && this.dragTarget.name) {
      const trackId = Math.floor(this.dragTarget.y / trackHeight).toString();
      const position = this.dragTarget.x / 100; // 假設 100 像素/秒
      this.onClipDragMove(this.dragTarget.name, position, trackId);
    }
  }

  private handleDragEnd(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging || !this.dragTarget) return;

    // 觸發結束拖拽事件
    if (this.onClipDragEnd && this.dragTarget.name) {
      const trackHeight = this.scene.getContainer().height / 8;
      const trackId = Math.floor(this.dragTarget.y / trackHeight).toString();
      const position = this.dragTarget.x / 100;
      this.onClipDragEnd(this.dragTarget.name, position, trackId);
    }

    // 重置狀態
    this.isDragging = false;
    this.dragTarget = null;
  }

  public dispose(): void {
    const container = this.scene.getContainer();
    container.removeAllListeners();
  }
} 