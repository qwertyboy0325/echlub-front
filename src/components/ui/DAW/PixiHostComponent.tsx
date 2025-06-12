import React, { useRef, useEffect, useCallback } from 'react';
import { PixiRenderer } from './PixiRenderer';
import { 
  DAWSceneState, 
  DAWInteractionEvent, 
  PixiRendererOptions 
} from './types';

interface PixiHostComponentProps {
  className?: string;
  style?: React.CSSProperties;
  onInteraction: (event: DAWInteractionEvent) => void;
  sceneState: DAWSceneState;
  rendererOptions?: Partial<PixiRendererOptions>;
}

export const PixiHostComponent: React.FC<PixiHostComponentProps> = ({
  className,
  style,
  onInteraction,
  sceneState,
  rendererOptions = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new PixiRenderer(
      {
        canvas: canvasRef.current,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      },
      {
        enableDebugMode: false,
        maxFPS: 60,
        enableWaveformCaching: true,
        enableCollaboratorCursors: true,
        ...rendererOptions
      }
    );

    renderer.onInteraction(onInteraction);
    rendererRef.current = renderer;

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [onInteraction, rendererOptions]);

  // Update scene when state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.renderScene(sceneState);
    }
  }, [sceneState]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        rendererRef.current.resize(width, height);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial resize
    handleResize();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ 
        ...style, 
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%' 
        }}
      />
    </div>
  );
}; 