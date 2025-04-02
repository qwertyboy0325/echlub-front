import React, { useCallback } from 'react';
import './VolumeSlider.css';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  value,
  onChange,
  min = -60,
  max = 6,
  step = 0.1
}) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.target.value);
      onChange(newValue);
    },
    [onChange]
  );

  // 將 dB 值轉換為百分比顯示
  const getDisplayValue = (db: number): string => {
    if (db <= -60) return '-∞';
    return db.toFixed(1);
  };

  return (
    <div className="volume-slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="slider"
      />
      <div className="volume-value">{getDisplayValue(value)} dB</div>
    </div>
  );
}; 