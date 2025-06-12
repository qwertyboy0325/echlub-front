import React, { useState, useCallback } from 'react';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  color?: string;
  isMuted?: boolean;
  isSoloed?: boolean;
  isSelected?: boolean;
  volume?: number;
  pan?: number;
  isArmed?: boolean;
}

interface TrackHeadersProps {
  tracks: Track[];
  onCreateTrack: (type: 'audio' | 'midi') => void;
  onDeleteTrack: (trackId: string) => void;
  onTrackSelect: (trackId: string) => void;
  onTrackMute: (trackId: string, muted: boolean) => void;
  onTrackSolo: (trackId: string, soloed: boolean) => void;
  onTrackReorder: (trackIds: string[]) => void;
  onTrackArm?: (trackId: string, armed: boolean) => void;
  onTrackVolumeChange?: (trackId: string, volume: number) => void;
  onTrackPanChange?: (trackId: string, pan: number) => void;
}

const trackColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export const TrackHeaders: React.FC<TrackHeadersProps> = ({
  tracks,
  onCreateTrack,
  onDeleteTrack,
  onTrackSelect,
  onTrackMute,
  onTrackSolo,
  onTrackReorder,
  onTrackArm,
  onTrackVolumeChange,
  onTrackPanChange
}) => {
  const [draggedTrack, setDraggedTrack] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, trackId: string) => {
    setDraggedTrack(trackId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();
    if (!draggedTrack || draggedTrack === dropTargetId) return;

    const trackIds = tracks.map(t => t.id);
    const draggedIndex = trackIds.indexOf(draggedTrack);
    const targetIndex = trackIds.indexOf(dropTargetId);

    if (draggedIndex >= 0 && targetIndex >= 0) {
      const newOrder = [...trackIds];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedTrack);
      onTrackReorder(newOrder);
    }

    setDraggedTrack(null);
  }, [draggedTrack, tracks, onTrackReorder]);

  const getTrackColor = (track: Track, index: number): string => {
    return track.color || trackColors[index % trackColors.length];
  };

  return (
    <div style={{
      width: '200px',
      background: '#1e293b',
      borderRight: '1px solid #475569',
      display: 'flex',
      flexDirection: 'column',
      color: '#f1f5f9'
    }}>
      {/* Header */}
      <div style={{
        height: '50px',
        background: '#334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid #475569'
      }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>
          Tracks ({tracks.length})
        </span>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onCreateTrack('audio')}
            style={{
              width: '24px',
              height: '24px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
            title="Add Audio Track"
          >
            🎵
          </button>
          
          <button
            onClick={() => onCreateTrack('midi')}
            style={{
              width: '24px',
              height: '24px',
              background: '#7c3aed',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
            title="Add MIDI Track"
          >
            🎹
          </button>
        </div>
      </div>

      {/* Track List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {tracks.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎼</div>
            <div>No tracks yet</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Click the buttons above to create your first track
            </div>
          </div>
        ) : (
          tracks.map((track, index) => (
            <div
              key={track.id}
              draggable
              onDragStart={(e) => handleDragStart(e, track.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, track.id)}
              style={{
                height: '80px',
                background: track.isSelected ? '#334155' : 'transparent',
                borderBottom: '1px solid #475569',
                cursor: 'pointer',
                opacity: draggedTrack === track.id ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onClick={() => onTrackSelect(track.id)}
            >
              {/* Track Name Section */}
              <div style={{
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                gap: '6px'
              }}>
                {/* Color Indicator */}
                <div style={{
                  width: '3px',
                  height: '16px',
                  background: getTrackColor(track, index),
                  borderRadius: '2px'
                }}></div>
                
                {/* Track Icon */}
                <div style={{ fontSize: '12px' }}>
                  {track.type === 'audio' ? '🎵' : '🎹'}
                </div>
                
                {/* Track Name */}
                <div style={{
                  flex: 1,
                  fontSize: '12px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {track.name}
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTrack(track.id);
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                  title="Delete Track"
                >
                  ×
                </button>
              </div>
              
              {/* Control Section */}
              <div style={{
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                gap: '4px'
              }}>
                {/* Mute Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackMute(track.id, !track.isMuted);
                  }}
                  style={{
                    width: '24px',
                    height: '20px',
                    background: track.isMuted ? '#ef4444' : 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '3px',
                    color: track.isMuted ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  title="Mute"
                >
                  M
                </button>
                
                {/* Solo Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackSolo(track.id, !track.isSoloed);
                  }}
                  style={{
                    width: '24px',
                    height: '20px',
                    background: track.isSoloed ? '#f59e0b' : 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '3px',
                    color: track.isSoloed ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  title="Solo"
                >
                  S
                </button>
                
                {/* Arm Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackArm?.(track.id, !track.isArmed);
                  }}
                  style={{
                    width: '24px',
                    height: '20px',
                    background: track.isArmed ? '#ef4444' : 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '3px',
                    color: track.isArmed ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  title="Arm for Recording"
                >
                  ●
                </button>
                
                {/* Input/Output */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#64748b'
                }}>
                  {track.type === 'audio' ? 'In 1' : 'Ch 1'}
                </div>
              </div>
              
              {/* Volume/Pan Section */}
              <div style={{
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                gap: '4px'
              }}>
                {/* Volume Slider */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', width: '12px' }}>
                    🔊
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume || 0.8}
                    onChange={(e) => {
                      onTrackVolumeChange?.(track.id, parseFloat(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      height: '2px',
                      background: '#475569',
                      borderRadius: '1px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                
                {/* Pan Knob */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  background: '#334155',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: '2px',
                    height: '8px',
                    background: '#94a3b8',
                    position: 'absolute',
                    top: '2px',
                    left: '9px',
                    borderRadius: '1px',
                    transform: `rotate(${(track.pan || 0) * 90}deg)`,
                    transformOrigin: 'center bottom'
                  }}></div>
                </div>
                
                {/* Level Meter */}
                <div style={{
                  width: '4px',
                  height: '16px',
                  background: '#334155',
                  borderRadius: '2px',
                  position: 'relative',
                  border: '1px solid #475569'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '60%',
                    background: 'linear-gradient(to top, #22c55e, #f59e0b, #ef4444)',
                    borderRadius: '1px'
                  }}></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div style={{
        height: '40px',
        background: '#334155',
        borderTop: '1px solid #475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        <span>Total: {tracks.length}</span>
        <span>
          {tracks.filter(t => t.isMuted).length > 0 && `${tracks.filter(t => t.isMuted).length}M `}
          {tracks.filter(t => t.isSoloed).length > 0 && `${tracks.filter(t => t.isSoloed).length}S`}
        </span>
      </div>

      {/* Custom slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 6px;
          background: #2563eb;
          cursor: pointer;
          border: 1px solid white;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 6px;
          background: #2563eb;
          cursor: pointer;
          border: 1px solid white;
        }
      `}</style>
    </div>
  );
}; 