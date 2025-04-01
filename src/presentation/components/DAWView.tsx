import React, { useEffect, useRef, useCallback } from 'react';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../core/di/types';
import { DAWPresenter } from '../presenters/DAWPresenter';
import { RenderEngine } from '../graphics/RenderEngine';
import { DAWScene } from '../graphics/DAWScene';
import { DragSystem } from '../graphics/DragSystem';
import { ClipViewModel } from '../models/ClipViewModel';

interface DAWViewProps {
  width: number;
  height: number;
  presenter: DAWPresenter;
}

export const DAWView: React.FC<DAWViewProps> = ({ width, height, presenter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderEngineRef = useRef<RenderEngine | null>(null);
  const dawSceneRef = useRef<DAWScene | null>(null);
  const dragSystemRef = useRef<DragSystem | null>(null);

  const initializeEngine = useCallback(() => {
    if (!canvasRef.current) return;

    // 初始化渲染引擎
    const renderEngine = new RenderEngine({
      view: canvasRef.current,
      width,
      height,
      backgroundColor: 0x1e1e1e,
      antialias: true
    });

    // 初始化場景
    const dawScene = new DAWScene(renderEngine, {
      width,
      height,
      trackCount: 8,
      pixelsPerSecond: 100
    });

    // 初始化拖拽系統
    const dragSystem = new DragSystem(dawScene);

    // 設置拖拽事件處理
    dragSystem.onClipDragStart = (clipId: string) => {
      console.debug('[DAWView] Clip drag start:', clipId);
    };

    dragSystem.onClipDragMove = (clipId: string, position: number, trackId: string) => {
      presenter.moveClip(clipId, position, trackId);
    };

    dragSystem.onClipDragEnd = (clipId: string, position: number, trackId: string) => {
      presenter.moveClip(clipId, position, trackId);
    };

    // 保存引用
    renderEngineRef.current = renderEngine;
    dawSceneRef.current = dawScene;
    dragSystemRef.current = dragSystem;

    // 初始化視圖
    updateView(presenter.getClips());
  }, [width, height, presenter]);

  const updateView = useCallback((clips: ClipViewModel[]) => {
    if (!dawSceneRef.current) return;
    dawSceneRef.current.updateClips(clips);
  }, []);

  // 處理組件掛載和卸載
  useEffect(() => {
    // 等待 DOM 更新後初始化
    requestAnimationFrame(() => {
      initializeEngine();
    });

    return () => {
      // 清理資源
      if (renderEngineRef.current) {
        renderEngineRef.current.dispose();
      }
      if (dragSystemRef.current) {
        dragSystemRef.current.dispose();
      }
      if (dawSceneRef.current) {
        dawSceneRef.current.dispose();
      }
    };
  }, [initializeEngine]);

  // 處理尺寸變化
  useEffect(() => {
    if (!renderEngineRef.current || !dawSceneRef.current) return;
    renderEngineRef.current.resize(width, height);
    dawSceneRef.current.resize(width, height);
  }, [width, height]);

  // 處理音頻文件拖放
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      const audioUrl = URL.createObjectURL(file);
      const position = 0; // 這裡可以根據拖放位置計算實際位置
      const duration = 0; // 這裡需要獲取音頻文件的實際時長
      const trackId = '1'; // 這裡需要獲取實際的軌道 ID
      presenter.addClip(audioUrl, position, duration, trackId);
    }
  }, [presenter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div 
      style={{ 
        width, 
        height, 
        position: 'relative',
        backgroundColor: '#1e1e1e'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}; 