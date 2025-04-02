import React, { useCallback, useRef, useEffect, useState } from 'react';
import './PanKnob.css';

interface PanKnobProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export const PanKnob: React.FC<PanKnobProps> = ({
  value,
  onChange,
  size = 40
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  // 將 -1 到 1 的值轉換為角度（-150 到 150 度）
  const valueToAngle = (val: number): number => {
    return val * 150;
  };

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(event.clientY);
    setStartValue(value);
  }, [value]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = startY - event.clientY;
    const sensitivity = 0.005;
    const newValue = Math.max(-1, Math.min(1, startValue + deltaY * sensitivity));
    onChange(newValue);
  }, [isDragging, startY, startValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 將 -1 到 1 的值轉換為顯示文本
  const getDisplayValue = (val: number): string => {
    if (val === 0) return 'C';
    return val < 0 ? `L${Math.abs(val * 100).toFixed(0)}` : `R${(val * 100).toFixed(0)}`;
  };

  return (
    <div className="pan-knob" style={{ width: size, height: size }}>
      <div
        ref={knobRef}
        className="knob"
        style={{
          transform: `rotate(${valueToAngle(value)}deg)`,
          width: size,
          height: size
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="indicator" />
      </div>
      <div className="value-display">{getDisplayValue(value)}</div>
    </div>
  );
}; 