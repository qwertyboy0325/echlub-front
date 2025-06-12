import React, { useState, useCallback } from 'react';

interface TimeSignature {
  numerator: number;
  denominator: number;
}

interface TransportControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  tempo: number;
  timeSignature: TimeSignature;
  masterVolume: number;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onTempoChange: (tempo: number) => void;
  onTimeSignatureChange: (timeSignature: TimeSignature) => void;
  onMasterVolumeChange: (volume: number) => void;
  onPositionChange: (time: number) => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  isRecording,
  currentTime,
  tempo,
  timeSignature,
  masterVolume,
  onPlay,
  onStop,
  onRecord,
  onTempoChange,
  onTimeSignatureChange,
  onMasterVolumeChange,
  onPositionChange
}) => {
  const [isLooping, setIsLooping] = useState(false);
  const [showTempoInput, setShowTempoInput] = useState(false);
  const [tempTempo, setTempTempo] = useState(tempo.toString());

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTempoSubmit = useCallback(() => {
    const newTempo = parseFloat(tempTempo);
    if (!isNaN(newTempo) && newTempo >= 60 && newTempo <= 200) {
      onTempoChange(newTempo);
    } else {
      setTempTempo(tempo.toString());
    }
    setShowTempoInput(false);
  }, [tempTempo, tempo, onTempoChange]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMasterVolumeChange(parseFloat(e.target.value));
  }, [onMasterVolumeChange]);

  return (
    <div style={{
      height: '80px',
      background: '#1e293b',
      borderBottom: '1px solid #475569',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '24px',
      color: '#f1f5f9'
    }}>
      {/* Playback Controls */}
      <div style={{
        width: '200px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={onStop}
          style={{
            width: '40px',
            height: '40px',
            background: 'transparent',
            border: '2px solid #475569',
            borderRadius: '8px',
            color: '#f1f5f9',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}
          title="Stop"
        >
          ⏹
        </button>

        <button
          onClick={onPlay}
          style={{
            width: '48px',
            height: '48px',
            background: isPlaying ? '#ef4444' : '#22c55e',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: isPlaying ? '0 0 12px rgba(239, 68, 68, 0.3)' : '0 0 12px rgba(34, 197, 94, 0.3)'
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={onRecord}
          style={{
            width: '40px',
            height: '40px',
            background: isRecording ? '#ef4444' : 'transparent',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            color: isRecording ? 'white' : '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            boxShadow: isRecording ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
          }}
          title="Record"
        >
          ●
        </button>

        <button
          onClick={() => setIsLooping(!isLooping)}
          style={{
            width: '40px',
            height: '40px',
            background: isLooping ? '#2563eb' : 'transparent',
            border: '2px solid #475569',
            borderRadius: '8px',
            color: isLooping ? 'white' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          title="Loop"
        >
          🔁
        </button>
      </div>

      {/* Position Display */}
      <div style={{
        width: '150px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px'
      }}>
        <div style={{
          fontSize: '20px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#e2e8f0'
        }}>
          {formatTime(currentTime)}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          Position
        </div>
      </div>

      {/* Tempo Control */}
      <div style={{
        width: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
        {showTempoInput ? (
          <input
            type="number"
            value={tempTempo}
            onChange={(e) => setTempTempo(e.target.value)}
            onBlur={handleTempoSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTempoSubmit();
              if (e.key === 'Escape') {
                setTempTempo(tempo.toString());
                setShowTempoInput(false);
              }
            }}
            min="60"
            max="200"
            style={{
              width: '60px',
              padding: '4px',
              background: '#334155',
              border: '1px solid #2563eb',
              borderRadius: '4px',
              color: '#f1f5f9',
              fontSize: '18px',
              textAlign: 'center',
              fontFamily: 'monospace'
            }}
            autoFocus
          />
        ) : (
          <div
            onClick={() => setShowTempoInput(true)}
            style={{
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#e2e8f0',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.borderColor = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            title="Click to edit tempo"
          >
            {tempo}
          </div>
        )}
        <div style={{
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          BPM
        </div>
      </div>

      {/* Time Signature */}
      <div style={{
        width: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
        <div style={{
          fontSize: '18px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#e2e8f0'
        }}>
          {timeSignature.numerator}/{timeSignature.denominator}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          Time Sig
        </div>
      </div>

      {/* Master Volume */}
      <div style={{
        width: '120px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginLeft: 'auto'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#94a3b8',
          minWidth: '16px'
        }}>
          🔊
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={handleVolumeChange}
          style={{
            flex: 1,
            height: '4px',
            background: '#475569',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{
          fontSize: '12px',
          color: '#94a3b8',
          minWidth: '30px',
          textAlign: 'right',
          fontFamily: 'monospace'
        }}>
          {Math.round(masterVolume * 100)}%
        </div>
      </div>

      {/* Recording Status */}
      <div style={{
        width: '150px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isRecording && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '4px',
            color: '#ef4444',
            fontSize: '12px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '4px',
              background: '#ef4444',
              animation: 'pulse 2s infinite'
            }}></div>
            REC
          </div>
        )}
        
        {isLooping && (
          <div style={{
            padding: '4px 8px',
            background: 'rgba(37, 99, 235, 0.1)',
            borderRadius: '4px',
            color: '#2563eb',
            fontSize: '12px'
          }}>
            LOOP
          </div>
        )}
      </div>

      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 8px;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 8px;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}; 