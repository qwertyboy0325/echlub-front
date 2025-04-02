import React, { useEffect, useRef, useContext, useState } from 'react';
import * as PIXI from 'pixi.js';
import { PixiStageContext } from './PixiStageContext';

export interface DAWGridViewProps {
  width: number;
  height: number;
  gridSize: number;
  backgroundColor?: number;
  gridColor?: number;
  x?: number;
  y?: number;
}

class GridRenderer extends PIXI.Container {
  private config: DAWGridViewProps;
  private gridContainer: PIXI.Container;

  constructor(config: DAWGridViewProps) {
    super();
    this.config = config;
    
    // 創建網格容器
    this.gridContainer = new PIXI.Container();
    this.addChild(this.gridContainer);

    // 設置位置
    if (config.x !== undefined && config.y !== undefined) {
      this.position.set(config.x, config.y);
    }

    // 繪製內容
    this.drawGrid();
    this.addTimeMarkers();
    this.addBorder();
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.redraw();
  }

  private drawGrid(): void {
    const grid = new PIXI.Graphics();
    this.gridContainer.addChild(grid);

    // 繪製細網格線
    grid.lineStyle(1, this.config.gridColor || 0xffffff, 0.5);

    // 垂直線
    for (let x = 0; x <= this.config.width; x += this.config.gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.config.height);
    }

    // 水平線
    for (let y = 0; y <= this.config.height; y += this.config.gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(this.config.width, y);
    }

    // 繪製粗網格線
    grid.lineStyle(2, this.config.gridColor || 0xffffff, 0.8);

    // 垂直主線
    for (let x = 0; x <= this.config.width; x += this.config.gridSize * 4) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.config.height);
    }

    // 水平主線
    for (let y = 0; y <= this.config.height; y += this.config.gridSize * 4) {
      grid.moveTo(0, y);
      grid.lineTo(this.config.width, y);
    }
  }

  private addTimeMarkers(): void {
    const timeMarkers = new PIXI.Container();
    this.gridContainer.addChild(timeMarkers);

    for (let x = 0; x <= this.config.width; x += this.config.gridSize * 4) {
      const seconds = x / this.config.gridSize;
      const text = new PIXI.Text(`${seconds}s`, {
        fontSize: 12,
        fill: 0xcccccc,
        fontFamily: 'Arial'
      });
      text.x = x + 4;
      text.y = 4;
      timeMarkers.addChild(text);
    }
  }

  private addBorder(): void {
    const border = new PIXI.Graphics();
    border.lineStyle(2, 0xff0000, 1);
    border.drawRect(0, 0, this.config.width, this.config.height);
    this.gridContainer.addChild(border);
  }

  private redraw(): void {
    this.gridContainer.removeChildren();
    this.drawGrid();
    this.addTimeMarkers();
    this.addBorder();
  }

  public destroy(): void {
    this.gridContainer.destroy();
    super.destroy();
  }
}

export const DAWGridView: React.FC<DAWGridViewProps> = (props) => {
  const rendererRef = useRef<GridRenderer | null>(null);
  const { manager } = useContext(PixiStageContext);
  const [isInitialized, setIsInitialized] = useState(false);

  // 創建和清理渲染器
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const createRenderer = async () => {
      if (!manager) {
        console.error('DAWGridView: PixiStageManager not found in context');
        return;
      }

      try {
        // 等待初始化完成
        if (!manager.isReady()) {
          console.log('DAWGridView: Waiting for PixiStageManager to initialize...');
          if (mounted) {
            retryTimeout = setTimeout(createRenderer, 100);
          }
          return;
        }

        console.log('DAWGridView: Creating renderer...');

        // 清理現有的渲染器
        if (rendererRef.current) {
          rendererRef.current.destroy();
          rendererRef.current = null;
        }

        // 創建新的渲染器
        rendererRef.current = new GridRenderer(props);
        manager.getMainContainer().addChild(rendererRef.current);
        setIsInitialized(true);

        console.log('DAWGridView: Renderer created successfully');
      } catch (error) {
        console.error('DAWGridView: Failed to create renderer:', error);
        if (mounted) {
          retryTimeout = setTimeout(createRenderer, 1000);
        }
      }
    };

    createRenderer();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [manager]);

  // 當屬性改變時更新
  useEffect(() => {
    if (!isInitialized || !rendererRef.current) return;

    try {
      // 更新大小
      rendererRef.current.resize(props.width, props.height);
      
      // 更新位置
      if (props.x !== undefined && props.y !== undefined) {
        rendererRef.current.position.set(props.x, props.y);
      }
    } catch (error) {
      console.error('DAWGridView: Failed to update renderer:', error);
    }
  }, [isInitialized, props.width, props.height, props.x, props.y]);

  // 當其他屬性改變時重新創建渲染器
  useEffect(() => {
    if (!isInitialized || !manager || !manager.isReady()) return;

    try {
      // 清理現有的渲染器
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }

      // 創建新的渲染器
      rendererRef.current = new GridRenderer(props);
      manager.getMainContainer().addChild(rendererRef.current);
    } catch (error) {
      console.error('DAWGridView: Failed to recreate renderer:', error);
    }
  }, [isInitialized, manager, props.gridSize, props.gridColor]);

  return null; // 這個組件不渲染任何 DOM 元素
}; 