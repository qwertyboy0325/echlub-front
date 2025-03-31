import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { DAWPresenter } from '../presenters/DAWPresenter';
import { ClipViewModel } from '../models/ClipViewModel';

interface DAWViewProps {
  width: number;
  height: number;
  presenter: DAWPresenter | null;
}

interface DraggableContainer extends PIXI.Container {
  dragging?: boolean;
}

/**
 * DAW 視圖組件
 * 使用 PixiJS 渲染 DAW 界面
 */
const DAWView: React.FC<DAWViewProps> = ({ width, height, presenter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const clipsContainerRef = useRef<PIXI.Container | null>(null);
  const isInitializedRef = useRef(false);

  // 初始化 PixiJS 應用
  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return;

    try {
      const app = new PIXI.Application({
        view: canvasRef.current,
        width,
        height,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });
      appRef.current = app;

      // 創建音頻片段容器
      const clipsContainer = new PIXI.Container();
      clipsContainerRef.current = clipsContainer;
      app.stage.addChild(clipsContainer);

      isInitializedRef.current = true;

      return () => {
        try {
          // 清理所有子元素
          if (clipsContainerRef.current) {
            try {
              clipsContainerRef.current.removeChildren();
            } catch (error) {
              console.error('Failed to remove children:', error);
            }
            clipsContainerRef.current = null;
          }

          // 簡單的清理方式
          if (appRef.current) {
            try {
              const app = appRef.current;
              
              // 停止渲染循環
              if (app.ticker) {
                app.ticker.stop();
              }
              
              // 清空舞台上的內容
              if (app.stage) {
                app.stage.removeChildren();
              }
              
              // 取消引用
              appRef.current = null;
            } catch (error) {
              console.error('Error cleaning up app:', error);
            }
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        } finally {
          isInitializedRef.current = false;
        }
      };
    } catch (error) {
      console.error('Failed to initialize PixiJS application:', error);
      return undefined;
    }
  }, [width, height]);

  // 初始化事件處理
  useEffect(() => {
    if (!appRef.current || !isInitializedRef.current || !presenter) return;

    try {
      // 設置事件監聽器
      const onClipAdded = (clip: ClipViewModel) => {
        if (!clipsContainerRef.current) return;
        const clipContainer = createClipContainer(clip);
        clipsContainerRef.current.addChild(clipContainer);
      };

      const onClipRemoved = (clipId: string) => {
        if (!clipsContainerRef.current) return;
        const clipContainer = clipsContainerRef.current.children.find(
          (child: PIXI.DisplayObject) => child.name === clipId
        ) as DraggableContainer;
        if (clipContainer) {
          clipsContainerRef.current.removeChild(clipContainer);
        }
      };

      const onClipUpdated = (clip: ClipViewModel) => {
        if (!clipsContainerRef.current) return;
        const clipContainer = clipsContainerRef.current.children.find(
          (child: PIXI.DisplayObject) => child.name === clip.id
        ) as DraggableContainer;
        if (clipContainer) {
          updateClipContainer(clipContainer, clip);
        }
      };

      // 註冊事件監聽器
      presenter.on('onClipAdded', onClipAdded);
      presenter.on('onClipRemoved', onClipRemoved);
      presenter.on('onClipUpdated', onClipUpdated);

      return () => {
        // 清理事件監聽器
        presenter.off('onClipAdded', onClipAdded);
        presenter.off('onClipRemoved', onClipRemoved);
        presenter.off('onClipUpdated', onClipUpdated);
      };
    } catch (error) {
      console.error('Failed to initialize event handlers:', error);
      return undefined;
    }
  }, [presenter]);

  /**
   * 創建音頻片段容器
   */
  const createClipContainer = (clip: ClipViewModel): DraggableContainer => {
    const container = new PIXI.Container() as DraggableContainer;
    container.name = clip.id;
    container.x = clip.position * 100; // 假設 1 秒 = 100 像素
    container.y = 100; // TODO: 根據軌道位置計算

    // 創建音頻片段背景
    const background = new PIXI.Graphics();
    background.beginFill(0x4a4a4a);
    background.drawRect(0, 0, clip.duration * 100, 80);
    background.endFill();
    container.addChild(background);

    // 創建音頻片段名稱文本
    const text = new PIXI.Text(clip.name, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff
    });
    text.x = 5;
    text.y = 5;
    container.addChild(text);

    // 添加拖拽功能
    container.interactive = true;
    container.buttonMode = true;
    container.on('pointerdown', onDragStart);
    container.on('pointerup', onDragEnd);
    container.on('pointerupoutside', onDragEnd);
    container.on('pointermove', onDragMove);

    return container;
  };

  /**
   * 更新音頻片段容器
   */
  const updateClipContainer = (container: DraggableContainer, clip: ClipViewModel): void => {
    container.x = clip.position * 100;
    // TODO: 更新其他視覺屬性
  };

  /**
   * 拖拽相關事件處理
   */
  const onDragStart = (event: any): void => {
    const container = event.currentTarget as DraggableContainer;
    container.alpha = 0.5;
    container.dragging = true;
  };

  const onDragEnd = (event: any): void => {
    const container = event.currentTarget as DraggableContainer;
    container.alpha = 1;
    container.dragging = false;
    
    // 發送更新事件到 Presenter
    if (presenter) {
      presenter.updateClip(new ClipViewModel(
        'test-audio-url', // TODO: 從某處獲取正確的 URL
        0, // TODO: 從某處獲取正確的開始時間
        4, // TODO: 從某處獲取正確的持續時間
        container.x / 100, // 轉換回時間單位
        container.name // 使用容器名稱作為片段 ID
      ));
    }
  };

  const onDragMove = (event: any): void => {
    const container = event.currentTarget as DraggableContainer;
    if (container.dragging) {
      const newPosition = container.x + event.movementX;
      container.x = newPosition;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block'
      }}
    />
  );
};

export default DAWView; 