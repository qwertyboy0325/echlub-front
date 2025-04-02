import React from 'react';
import { PixiStageManager } from '../graphics/PixiStageManager';

// 定義 Context 的類型
interface PixiStageContextType {
  manager: PixiStageManager | null;
}

// 創建 Context，提供一個默認值
export const PixiStageContext = React.createContext<PixiStageContextType>({
  manager: null
});

// 創建 Provider 組件
export const PixiStageProvider: React.FC<{
  children: React.ReactNode;
  manager: PixiStageManager;
}> = ({ children, manager }) => {
  return (
    <PixiStageContext.Provider value={{ manager }}>
      {children}
    </PixiStageContext.Provider>
  );
}; 