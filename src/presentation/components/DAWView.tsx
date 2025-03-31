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

const TIMELINE_HEIGHT = 30;
const TRACK_HEIGHT = 80;
const TRACK_COUNT = 8;
const PIXELS_PER_SECOND = 100;
const CLIP_HEIGHT = TRACK_HEIGHT - 10;

/**
 * DAW 視圖組件
 * 使用 PixiJS 渲染 DAW 界面
 */
export const DAWView: React.FC<DAWViewProps> = ({ width, height, presenter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const clipsContainerRef = useRef<PIXI.Container | null>(null);
  const isInitializedRef = useRef(false);

  const drawTimeline = () => {
    if (!appRef.current) return;

    const timeline = new PIXI.Container();
    timeline.y = 0;

    // Draw background
    const background = new PIXI.Graphics();
    background.beginFill(0x1a1a1a);
    background.drawRect(0, 0, width, TIMELINE_HEIGHT);
    background.endFill();
    timeline.addChild(background);

    // Draw time markers
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, 0x333333);

    for (let i = 0; i <= width; i += PIXELS_PER_SECOND) {
      const seconds = i / PIXELS_PER_SECOND;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      const timeText = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

      graphics.moveTo(i, 0);
      graphics.lineTo(i, TIMELINE_HEIGHT);

      const text = new PIXI.Text(timeText, {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0x888888
      });
      text.x = i + 2;
      text.y = 2;
      timeline.addChild(text);
    }

    timeline.addChild(graphics);
    appRef.current.stage.addChild(timeline);
  };

  const drawTracks = () => {
    if (!appRef.current) return;

    const tracks = new PIXI.Container();
    tracks.y = TIMELINE_HEIGHT;

    for (let i = 0; i < TRACK_COUNT; i++) {
      const track = new PIXI.Container();
      track.y = i * TRACK_HEIGHT;

      // Draw track background
      const background = new PIXI.Graphics();
      background.beginFill(i % 2 === 0 ? 0x2a2a2a : 0x252525);
      background.drawRect(0, 0, width, TRACK_HEIGHT);
      background.endFill();
      track.addChild(background);

      // Add track label
      const label = new PIXI.Text(`Track ${i + 1}`, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x888888
      });
      label.x = 5;
      label.y = 5;
      track.addChild(label);

      tracks.addChild(track);
    }

    appRef.current.stage.addChild(tracks);
  };

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current || !width || !height || isInitializedRef.current) return;

    console.log('Initializing PixiJS with dimensions:', width, height);

    try {
      const app = new PIXI.Application({
        view: canvasRef.current,
        width,
        height,
        backgroundColor: 0x2c2c2c,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        eventMode: 'static'
      });

      if (canvasRef.current) {
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';
        canvasRef.current.style.display = 'block';
      }

      appRef.current = app;
      isInitializedRef.current = true;

      // Create main container for clips
      const clipsContainer = new PIXI.Container();
      clipsContainer.y = TIMELINE_HEIGHT;
      clipsContainerRef.current = clipsContainer;
      app.stage.addChild(clipsContainer);

      // Draw timeline and tracks
      drawTimeline();
      drawTracks();

      console.log('PixiJS application initialized successfully');

      return () => {
        if (app) {
          app.destroy(true);
        }
      };
    } catch (error) {
      console.error('Failed to initialize PixiJS application:', error);
    }
  }, [width, height]);

  const createClipContainer = (clip: ClipViewModel): DraggableContainer => {
    console.log('Creating clip container:', clip);
    const container = new PIXI.Container() as DraggableContainer;
    container.name = clip.id;
    container.x = clip.position * PIXELS_PER_SECOND;
    container.y = clip.trackId ? parseInt(clip.trackId) * TRACK_HEIGHT : 0;
    container.eventMode = 'static';

    // Create clip background
    const background = new PIXI.Graphics();
    background.beginFill(0x4a90e2);
    background.drawRoundedRect(0, 0, clip.duration * PIXELS_PER_SECOND, CLIP_HEIGHT, 4);
    background.endFill();
    container.addChild(background);

    // Add clip label
    const label = new PIXI.Text(clip.name, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff
    });
    label.x = 5;
    label.y = 5;
    container.addChild(label);

    // Add drag functionality
    container
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);

    return container;
  };

  const onDragStart = (event: PIXI.FederatedPointerEvent): void => {
    const container = event.currentTarget as DraggableContainer;
    container.alpha = 0.5;
    container.dragging = true;
  };

  const onDragEnd = (event: PIXI.FederatedPointerEvent): void => {
    const container = event.currentTarget as DraggableContainer;
    container.alpha = 1;
    container.dragging = false;
    
    const trackIndex = Math.floor(container.y / TRACK_HEIGHT);
    const trackId = trackIndex.toString();
    
    if (presenter && container.name) {
      presenter.updateClip(new ClipViewModel(
        'test-audio.mp3',
        0,
        4,
        container.x / PIXELS_PER_SECOND,
        'Test Clip',
        container.name,
        trackId
      ));
    }
  };

  const onDragMove = (event: PIXI.FederatedPointerEvent): void => {
    const container = event.currentTarget as DraggableContainer;
    if (container.dragging) {
      const newPosition = event.getLocalPosition(container.parent);
      
      const maxX = width - container.width;
      const maxY = (TRACK_COUNT - 1) * TRACK_HEIGHT;
      
      container.x = Math.max(0, Math.min(maxX, newPosition.x));
      container.y = Math.max(0, Math.min(maxY, Math.floor(newPosition.y / TRACK_HEIGHT) * TRACK_HEIGHT));
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none'
      }}
    />
  );
}; 