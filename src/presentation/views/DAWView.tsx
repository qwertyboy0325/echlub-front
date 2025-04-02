import React, { useEffect, useRef } from 'react';
import { container, TYPES } from '../../core/di/container';
import type { DAWRenderer } from '../graphics/DAWRenderer';
import type { DAWRendererConfig } from '../../core/di/container';

interface DAWViewProps {
  width?: number;
  height?: number;
}

export const DAWView: React.FC<DAWViewProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DAWRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 設置 canvas 尺寸
  const setupCanvas = () => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();

    // 設置 canvas 的實際尺寸
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = width || rect.width;
    const displayHeight = height || rect.height;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // 設置 canvas 的顯示尺寸
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    return { width: displayWidth, height: displayHeight };
  };

  useEffect(() => {
    const initRenderer = async () => {
      if (!canvasRef.current || !containerRef.current) {
        console.error('[DAWView] Canvas or container element not found');
        return;
      }

      try {
        // 設置 canvas 尺寸
        const dimensions = setupCanvas();
        if (!dimensions) return;
        
        // 創建配置
        const config: DAWRendererConfig = {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: 0x1a1a1a,
          bpm: 120
        };

        console.log('[DAWView] Initializing renderer with config:', config);

        // 獲取工廠函數並創建渲染器
        const rendererFactory = container.get<(canvas: HTMLCanvasElement, config: DAWRendererConfig) => DAWRenderer>(TYPES.DAWRenderer);
        rendererRef.current = rendererFactory(canvasRef.current, config);

        // 等待渲染器初始化完成
        await rendererRef.current.waitForInit();

        console.log('[DAWView] Renderer initialized successfully');
      } catch (error) {
        console.error('Failed to initialize DAW renderer:', error);
      }
    };

    initRenderer();

    // 清理函數
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [width, height]);

  // 處理窗口大小變化
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current || !rendererRef.current) return;

      const dimensions = setupCanvas();
      if (!dimensions) return;

      rendererRef.current.resize(dimensions.width, dimensions.height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: width || '100%', 
        height: height || '100%', 
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
}; 