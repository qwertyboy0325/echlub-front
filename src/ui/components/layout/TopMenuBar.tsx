import React from 'react';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
}

interface TopMenuBarProps {
  projectName: string;
  collaborators: Collaborator[];
  onSave: () => void;
  onExport: () => void;
  onSettings: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  projectName,
  collaborators,
  onSave,
  onExport,
  onSettings
}) => {
  return (
    <div style={{
      height: '60px',
      background: '#1e293b',
      borderBottom: '1px solid #475569',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '20px',
      color: '#f1f5f9',
      fontSize: '14px'
    }}>
      {/* Logo */}
      <div style={{
        width: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#2563eb'
      }}>
        🎵
      </div>

      {/* Project Info */}
      <div style={{
        width: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div style={{ fontWeight: '600', fontSize: '14px' }}>
          {projectName}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Last saved: 2 minutes ago
        </div>
      </div>

      {/* Collaborator Avatars */}
      <div style={{
        maxWidth: '300px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {collaborators.length > 0 && (
          <>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '8px' }}>
              {collaborators.length} active
            </span>
            {collaborators.slice(0, 5).map((collaborator) => (
              <div
                key={collaborator.id}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  background: collaborator.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  border: collaborator.isActive ? '2px solid #22c55e' : '2px solid transparent'
                }}
                title={collaborator.name}
              >
                {collaborator.avatar || collaborator.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {collaborators.length > 5 && (
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                padding: '0 8px'
              }}>
                +{collaborators.length - 5} more
              </div>
            )}
          </>
        )}
      </div>

      {/* Central Toolbox */}
      <div style={{
        width: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <button style={{
          background: 'transparent',
          border: '1px solid #475569',
          color: '#f1f5f9',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}>
          Select
        </button>
        <button style={{
          background: 'transparent',
          border: '1px solid #475569',
          color: '#f1f5f9',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}>
          Draw
        </button>
        <button style={{
          background: 'transparent',
          border: '1px solid #475569',
          color: '#f1f5f9',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}>
          Cut
        </button>
        <button style={{
          background: 'transparent',
          border: '1px solid #475569',
          color: '#f1f5f9',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}>
          Erase
        </button>
      </div>

      {/* Right Side Actions */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={onSave}
          style={{
            background: '#2563eb',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Save
        </button>
        
        <button
          onClick={onExport}
          style={{
            background: 'transparent',
            border: '1px solid #475569',
            color: '#f1f5f9',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Export
        </button>

        <button
          onClick={onSettings}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          title="Settings"
        >
          ⚙️
        </button>

        {/* Connection Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#22c55e'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '4px',
            background: '#22c55e'
          }}></div>
          Connected
        </div>
      </div>
    </div>
  );
}; 