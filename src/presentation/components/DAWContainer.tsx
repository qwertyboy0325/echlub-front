import React, { useEffect, useState } from 'react';
import { DAWPresenter } from '../presenters/DAWPresenter';
import DAWView from './DAWView';
import { useInjection } from '../../core/di/useInjection';
import { TYPES } from '../../core/di/types';
import { ClipViewModel } from '../models/ClipViewModel';

/**
 * DAW 容器組件
 * 負責管理 DAW 的狀態和生命週期
 */
const DAWContainer: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const presenter = useInjection<DAWPresenter>(TYPES.DAWPresenter);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 更新容器尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // 初始化尺寸
    updateDimensions();

    // 監聽窗口大小變化
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 添加測試音頻片段
  useEffect(() => {
    if (presenter) {
      const testClip = new ClipViewModel(
        'test-audio.mp3',
        0,
        4,
        2,
        'Test Clip',
        undefined,
        '1'
      );
      presenter.addClip(testClip);
    }
  }, [presenter]);

  // 防止右鍵菜單
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden'
      }}
      onContextMenu={handleContextMenu}
    >
      <DAWView
        width={dimensions.width}
        height={dimensions.height}
        presenter={presenter}
      />
    </div>
  );
};

export default DAWContainer; 