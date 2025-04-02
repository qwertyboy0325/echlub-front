import React, { useEffect, useRef, useState } from 'react';
import { DAWRenderer } from '../graphics/DAWRenderer';

interface DAWViewProps {
  className?: string;
  style?: React.CSSProperties;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onBpmChange?: (bpm: number) => void;
}

export const DAWView: React.FC<DAWViewProps> = ({
  className,
  style,
  onPlay,
  onPause,
  onStop,
  onBpmChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DAWRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化渲染器
  useEffect(() => {
    let mounted = true;

    const initRenderer = async () => {
      if (!canvasRef.current) return;

      try {
        // 創建渲染器
        const renderer = new DAWRenderer(canvasRef.current, {
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0x1e1e1e
        });

        // 等待初始化完成
        await renderer.waitForInit();

        if (!mounted) {
          renderer.destroy();
          return;
        }

        // 設置事件處理
        if (onPlay) renderer.on('play', onPlay);
        if (onPause) renderer.on('pause', onPause);
        if (onStop) renderer.on('stop', onStop);
        if (onBpmChange) renderer.on('bpmChange', onBpmChange);

        rendererRef.current = renderer;
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize DAW renderer:', error);
      }
    };

    initRenderer();

    // 處理窗口大小變化
    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      
      // 移除事件監聽
      if (rendererRef.current) {
        if (onPlay) rendererRef.current.off('play', onPlay);
        if (onPause) rendererRef.current.off('pause', onPause);
        if (onStop) rendererRef.current.off('stop', onStop);
        if (onBpmChange) rendererRef.current.off('bpmChange', onBpmChange);
        
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [onPlay, onPause, onStop, onBpmChange]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        ...style
      }}
    />
  );
}; 