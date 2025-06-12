import React from 'react';

interface StatusBarProps {
  isReady: boolean;
  isConnected: boolean;
  trackCount: number;
  clipCount: number;
  selectedCount: number;
  currentTime: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isReady,
  isConnected,
  trackCount,
  clipCount,
  selectedCount,
  currentTime
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        icon: '🟢',
        text: 'Connected',
        color: '#22c55e'
      };
    } else {
      return {
        icon: '🔴',
        text: 'Disconnected',
        color: '#ef4444'
      };
    }
  };

  const getRendererStatus = () => {
    if (isReady) {
      return {
        icon: '✅',
        text: 'Ready',
        color: '#22c55e'
      };
    } else {
      return {
        icon: '🔄',
        text: 'Initializing',
        color: '#f59e0b'
      };
    }
  };

  const connectionStatus = getConnectionStatus();
  const rendererStatus = getRendererStatus();

  return (
    <div style={{
      height: '30px',
      background: '#1e293b',
      borderTop: '1px solid #475569',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      fontSize: '12px',
      color: '#94a3b8',
      gap: '16px'
    }}>
      {/* Left Side - System Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Renderer Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: rendererStatus.color
        }}>
          <span>{rendererStatus.icon}</span>
          <span>{rendererStatus.text}</span>
          {isReady && (
            <span style={{ color: '#64748b' }}>
              - EchLub DAW Interface
            </span>
          )}
        </div>

        {/* Separator */}
        <div style={{
          width: '1px',
          height: '16px',
          background: '#475569'
        }}></div>

        {/* Engine Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#64748b'
        }}>
          <span>PIXI.js Renderer</span>
          <span>•</span>
          <span>StrictMode Compatible</span>
          {isReady && (
            <>
              <span>•</span>
              <span style={{ color: '#2563eb' }}>Active</span>
            </>
          )}
        </div>
      </div>

      {/* Center - Statistics */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ color: '#64748b' }}>Tracks:</span>
          <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{trackCount}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ color: '#64748b' }}>Clips:</span>
          <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{clipCount}</span>
        </div>

        {selectedCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ color: '#64748b' }}>Selected:</span>
            <span style={{ color: '#2563eb', fontWeight: '500' }}>{selectedCount}</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ color: '#64748b' }}>Time:</span>
          <span style={{ 
            color: '#f1f5f9', 
            fontWeight: '500',
            fontFamily: 'monospace'
          }}>
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Right Side - Connection and Performance */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Performance Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#64748b'
        }}>
          <span>CPU:</span>
          <div style={{
            width: '40px',
            height: '4px',
            background: '#334155',
            borderRadius: '2px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              bottom: '0',
              width: '35%',
              background: '#22c55e',
              borderRadius: '2px'
            }}></div>
          </div>
          <span style={{ minWidth: '24px', textAlign: 'right' }}>35%</span>
        </div>

        {/* Memory Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#64748b'
        }}>
          <span>RAM:</span>
          <div style={{
            width: '40px',
            height: '4px',
            background: '#334155',
            borderRadius: '2px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              bottom: '0',
              width: '60%',
              background: '#f59e0b',
              borderRadius: '2px'
            }}></div>
          </div>
          <span style={{ minWidth: '32px', textAlign: 'right' }}>512MB</span>
        </div>

        {/* Separator */}
        <div style={{
          width: '1px',
          height: '16px',
          background: '#475569'
        }}></div>

        {/* Connection Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px',
          color: connectionStatus.color
        }}>
          <span>{connectionStatus.icon}</span>
          <span>{connectionStatus.text}</span>
        </div>

        {/* Latency */}
        {isConnected && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#64748b'
          }}>
            <span>Latency:</span>
            <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>12ms</span>
          </div>
        )}

        {/* Sample Rate */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#64748b'
        }}>
          <span>48kHz</span>
          <span>•</span>
          <span>24bit</span>
        </div>
      </div>
    </div>
  );
}; 