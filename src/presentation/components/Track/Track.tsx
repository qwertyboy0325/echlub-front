import React, { useCallback } from 'react';
import { TrackViewModel } from '../../models/TrackViewModel';
import { VolumeSlider } from '../controls/VolumeSlider';
import { PanKnob } from '../controls/PanKnob';
import { Button } from '../common/Button';
import './Track.css';

interface TrackProps {
  track: TrackViewModel;
  onVolumeChange: (trackId: string, volume: number) => void;
  onPanChange: (trackId: string, pan: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  onDelete: (trackId: string) => void;
}

export const Track: React.FC<TrackProps> = ({
  track,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onDelete
}) => {
  const handleVolumeChange = useCallback(
    (volume: number) => onVolumeChange(track.id, volume),
    [track.id, onVolumeChange]
  );

  const handlePanChange = useCallback(
    (pan: number) => onPanChange(track.id, pan),
    [track.id, onPanChange]
  );

  const handleMuteClick = useCallback(
    () => onMuteToggle(track.id),
    [track.id, onMuteToggle]
  );

  const handleSoloClick = useCallback(
    () => onSoloToggle(track.id),
    [track.id, onSoloToggle]
  );

  const handleDeleteClick = useCallback(
    () => onDelete(track.id),
    [track.id, onDelete]
  );

  return (
    <div className={`track ${track.selected ? 'selected' : ''}`}>
      <div className="track-header">
        <span className="track-name">{track.name}</span>
        <div className="track-controls">
          <Button
            className={`mute-button ${track.muted ? 'active' : ''}`}
            onClick={handleMuteClick}
          >
            M
          </Button>
          <Button
            className={`solo-button ${track.soloed ? 'active' : ''}`}
            onClick={handleSoloClick}
          >
            S
          </Button>
          <Button
            className="delete-button"
            onClick={handleDeleteClick}
          >
            X
          </Button>
        </div>
      </div>
      <div className="track-body">
        <VolumeSlider
          value={track.volume}
          onChange={handleVolumeChange}
        />
        <PanKnob
          value={track.pan}
          onChange={handlePanChange}
        />
      </div>
    </div>
  );
}; 