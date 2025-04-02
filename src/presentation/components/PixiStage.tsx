import React, { useEffect, useRef, useState } from 'react';
import { PixiStageManager } from '../graphics/PixiStageManager';
import { PixiStageProvider } from './PixiStageContext';

interface PixiStageProps {
  backgroundColor?: number;
  className?: string;
  style?: React.CSSProperties;
  onStageCreated?: (manager: PixiStageManager) => void;
  children?: React.ReactNode;
}

export const PixiStage: React.FC<PixiStageProps> = ({
  backgroundColor = 0x000000,
  className,
  style,
  onStageCreated,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<PixiStageManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let initializeTimeout: NodeJS.Timeout;

    const initStage = async () => {
      if (!containerRef.current) {
        console.error('Container ref is not available');
        return;
      }

      try {
        // 創建舞台管理器
        const manager = new PixiStageManager(containerRef.current, {
          backgroundColor
        });
        managerRef.current = manager;

        // 等待初始化完成
        await manager.waitForInit();

        // 確保組件仍然掛載
        if (mounted) {
          console.log('PIXI Stage initialized');
          setIsInitialized(true);
          
          // 通知父組件舞台已創建
          if (onStageCreated) {
            onStageCreated(manager);
          }
        }
      } catch (error) {
        console.error('Failed to initialize PIXI stage:', error);
        // 如果初始化失敗，稍後重試
        if (mounted) {
          initializeTimeout = setTimeout(initStage, 1000);
        }
      }
    };

    initStage();

    // 清理函數
    return () => {
      mounted = false;
      if (initializeTimeout) {
        clearTimeout(initializeTimeout);
      }
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [backgroundColor, onStageCreated]);

  // 確保只有在完全初始化後才渲染子組件
  const isReady = managerRef.current && isInitialized && managerRef.current.isReady();

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }} 
    >
      {isReady && managerRef.current && (
        <PixiStageProvider manager={managerRef.current}>
          {children}
        </PixiStageProvider>
      )}
    </div>
  );
};

// 導出管理器類型以供其他組件使用
export type { PixiStageManager }; 