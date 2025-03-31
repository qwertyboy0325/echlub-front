import React, { useEffect, useRef, useState } from 'react';
import { container } from '../../core/di/container';
import { TYPES } from '../../core/di/types';
import { DAWPresenter } from '../presenters/DAWPresenter';
import { ClipViewModel } from '../models/ClipViewModel';
import DAWView from '../components/DAWView';

/**
 * DAW 容器組件
 * 負責管理 DAW 的狀態和生命週期
 */
const DAWContainer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const presenterRef = useRef<DAWPresenter | null>(null);
    const isInitializedRef = useRef(false);

    // 初始化 Presenter
    useEffect(() => {
        if (isInitializedRef.current) return;

        try {
            presenterRef.current = container.get<DAWPresenter>(TYPES.DAWPresenter);
            isInitializedRef.current = true;

            return () => {
                if (presenterRef.current) {
                    presenterRef.current.dispose();
                    presenterRef.current = null;
                }
                isInitializedRef.current = false;
            };
        } catch (error) {
            console.error('Failed to initialize DAW presenter:', error);
            return undefined;
        }
    }, []);

    // 處理尺寸更新
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        // 初始更新
        updateDimensions();

        // 監聽視窗大小變化
        window.addEventListener('resize', updateDimensions);

        return () => {
            window.removeEventListener('resize', updateDimensions);
        };
    }, []);

    // 添加測試片段
    useEffect(() => {
        if (!presenterRef.current || !isInitializedRef.current) return;

        try {
            const testClip = new ClipViewModel(
                'test-audio-url',
                0,  // startTime
                4,  // duration
                0,  // position
                'Test Clip'  // name
            );
            presenterRef.current.addClip(testClip);
        } catch (error) {
            console.error('Failed to add test clip:', error);
        }
    }, []);

    // 防止右鍵選單
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100vh',
                backgroundColor: '#1a1a1a',
                position: 'relative',
                overflow: 'hidden'
            }}
            onContextMenu={handleContextMenu}
        >
            <DAWView 
                width={dimensions.width} 
                height={dimensions.height}
                presenter={presenterRef.current}
            />
        </div>
    );
};

export default DAWContainer; 