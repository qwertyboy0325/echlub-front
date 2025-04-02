import * as PIXI from 'pixi.js';
import { injectable } from 'inversify';

export interface DragConfig {
  onStart?: (target: PIXI.Container, event: PIXI.FederatedPointerEvent) => void;
  onMove?: (target: PIXI.Container, newPosition: PIXI.Point, event: PIXI.FederatedPointerEvent) => void;
  onEnd?: (target: PIXI.Container, event: PIXI.FederatedPointerEvent) => void;
}

@injectable()
export class DragSystem {
  private draggingTarget: PIXI.Container | null = null;
  private dragStartPosition: PIXI.Point | null = null;
  private dragOffset: PIXI.Point | null = null;
  private dragConfig: DragConfig | null = null;

  enableDrag(target: PIXI.Container, config: DragConfig = {}): void {
    target.eventMode = 'static';
    target.cursor = 'pointer';

    target.on('pointerdown', this.handleDragStart);
    target.on('pointermove', this.handleDragMove);
    target.on('pointerup', this.handleDragEnd);
    target.on('pointerupoutside', this.handleDragEnd);

    // 保存配置
    (target as any).__dragConfig = config;
  }

  disableDrag(target: PIXI.Container): void {
    target.cursor = 'default';
    target.eventMode = 'none';

    target.off('pointerdown', this.handleDragStart);
    target.off('pointermove', this.handleDragMove);
    target.off('pointerup', this.handleDragEnd);
    target.off('pointerupoutside', this.handleDragEnd);

    delete (target as any).__dragConfig;
  }

  private handleDragStart = (event: PIXI.FederatedPointerEvent) => {
    const target = event.currentTarget as PIXI.Container;
    this.draggingTarget = target;
    this.dragConfig = (target as any).__dragConfig || {};

    // 記錄起始位置
    this.dragStartPosition = new PIXI.Point(target.x, target.y);
    
    // 計算偏移量
    const localPos = event.getLocalPosition(target.parent);
    this.dragOffset = new PIXI.Point(
      target.x - localPos.x,
      target.y - localPos.y
    );

    // 調用回調
    if (this.dragConfig.onStart) {
      this.dragConfig.onStart(target, event);
    }
  };

  private handleDragMove = (event: PIXI.FederatedPointerEvent) => {
    if (!this.draggingTarget || !this.dragOffset) return;

    const newPosition = event.getLocalPosition(this.draggingTarget.parent);
    newPosition.x += this.dragOffset.x;
    newPosition.y += this.dragOffset.y;

    // 調用回調
    const config = (this.draggingTarget as any).__dragConfig || {};
    if (config.onMove) {
      config.onMove(this.draggingTarget, newPosition, event);
    }

    // 更新位置
    this.draggingTarget.x = newPosition.x;
    this.draggingTarget.y = newPosition.y;
  };

  private handleDragEnd = (event: PIXI.FederatedPointerEvent) => {
    if (!this.draggingTarget) return;

    // 調用回調
    const config = (this.draggingTarget as any).__dragConfig || {};
    if (config.onEnd) {
      config.onEnd(this.draggingTarget, event);
    }

    // 重置狀態
    this.draggingTarget = null;
    this.dragStartPosition = null;
    this.dragOffset = null;
    this.dragConfig = null;
  };
} 