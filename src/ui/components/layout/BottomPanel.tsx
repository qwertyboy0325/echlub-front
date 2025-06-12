import React, { useState, useRef, useCallback } from 'react';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
}

interface BottomPanelProps {
  height: number;
  activePanel: 'piano-roll' | 'mixer' | 'browser' | 'properties';
  onHeightChange: (height: number) => void;
  onActivePanelChange: (panel: 'piano-roll' | 'mixer' | 'browser' | 'properties') => void;
  onAddClip: () => void;
  selectedClips: string[];
  tracks: Track[];
  onQuantize?: (amount: string) => void;
  onHumanize?: (amount: number) => void;
  onImportFiles?: (files: FileList) => void;
  onPlayNote?: (note: number, velocity: number, duration: number) => void;
  onStopNote?: (note: number) => void;
  // MIDI Note editing
  onAddMidiNote?: (clipId: string, pitch: number, velocity: number, startTime: number, duration: number) => void;
  onDeleteMidiNote?: (clipId: string, noteId: string) => void;
  onUpdateMidiNote?: (clipId: string, noteId: string, updates: { pitch?: number; velocity?: number; startTime?: number; duration?: number }) => void;
  // Current scene state for accessing clips and notes
  sceneState: any;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  height,
  activePanel,
  onHeightChange,
  onActivePanelChange,
  onAddClip,
  selectedClips,
  tracks,
  onQuantize,
  onHumanize,
  onImportFiles,
  onPlayNote,
  onStopNote,
  onAddMidiNote,
  onDeleteMidiNote,
  onUpdateMidiNote,
  sceneState
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(height);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    e.preventDefault();
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = startY - e.clientY;
    const newHeight = Math.max(250, Math.min(400, startHeight + deltaY));
    onHeightChange(newHeight);
  }, [isResizing, startY, startHeight, onHeightChange]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Get the selected MIDI clip
  const selectedMidiClip = selectedClips.length > 0 
    ? sceneState?.clips?.find((clip: any) => selectedClips.includes(clip.id) && clip.type === 'midi')
    : null;

  // Auto-scroll to middle C area when clip changes
  React.useEffect(() => {
    if (selectedMidiClip) {
      const pianoKeys = document.getElementById('pianoKeys');
      const noteGrid = document.getElementById('noteGrid');
      
      // Scroll to C4 area (around MIDI note 60)
      // C4 is at index 27 from top (87 - (60 - 21) = 27)
      const scrollPosition = 27 * 16 - 200; // Center C4 in view
      
      if (pianoKeys) {
        pianoKeys.scrollTop = Math.max(0, scrollPosition);
      }
      if (noteGrid) {
        noteGrid.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, [selectedMidiClip?.id]);

  const renderPianoRoll = () => (
    selectedMidiClip ? (
      <>
        <div style={{
          position: 'relative',
          flex: 1,
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Piano Roll Header */}
          <div style={{
            height: '40px',
            background: '#1e293b',
            borderBottom: '1px solid #475569',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              Piano Roll: {selectedMidiClip.name} ({selectedMidiClip.midiData?.notes?.length || 0} notes)
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <select
                onChange={(e) => onQuantize?.(e.target.value)}
                style={{
                  padding: '4px 8px',
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  fontSize: '12px'
                }}
              >
                <option value="">Quantize</option>
                <option value="1/4">1/4 Note</option>
                <option value="1/8">1/8 Note</option>
                <option value="1/16">1/16 Note</option>
                <option value="1/32">1/32 Note</option>
              </select>
              <button
                onClick={() => onHumanize?.(0.1)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Humanize
              </button>
            </div>
          </div>
          
          {/* Piano Roll Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* Piano Keys - Scrollable */}
            <div 
              id="pianoKeys"
              style={{
                width: '80px',
                background: '#1e293b',
                borderRight: '1px solid #475569',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
              onScroll={(e) => {
                // Sync scroll with note grid
                const noteGrid = document.getElementById('noteGrid');
                if (noteGrid) {
                  noteGrid.scrollTop = e.currentTarget.scrollTop;
                }
              }}
            >
              {/* Piano keys header spacer to align with time ruler */}
              <div style={{
                height: '21px', // 20px content + 1px border to match time ruler exactly
                background: '#1e293b',
                borderBottom: '1px solid #475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#64748b',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}>
                Keys
              </div>
              
              {Array.from({ length: 88 }, (_, i) => {
                const midiNote = 108 - i; // Start from C8 (108) down to A0 (21)
                const noteInOctave = midiNote % 12;
                const isBlackKey = [1, 3, 6, 8, 10].includes(noteInOctave);
                const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteInOctave];
                const octave = Math.floor(midiNote / 12) - 1;
                
                // Match the background colors with the note grid
                let keyBackgroundColor;
                if (isBlackKey) {
                  keyBackgroundColor = i % 2 === 0 ? '#1a202c' : '#1e293b';
                } else {
                  keyBackgroundColor = i % 2 === 0 ? '#334155' : '#3f4f5f';
                }
                
                return (
                  <div
                    key={midiNote}
                    style={{
                      height: '16px', // Total height including border
                      lineHeight: '15px', // Content line height
                      background: keyBackgroundColor,
                      borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '8px',
                      fontSize: '10px',
                      color: isBlackKey ? '#94a3b8' : '#f1f5f9',
                      cursor: 'pointer',
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isBlackKey ? '#475569' : '#64748b';
                    }}
                    onMouseLeave={(e) => {
                      // Reset to alternating color
                      e.currentTarget.style.background = keyBackgroundColor;
                      
                      if (onStopNote) {
                        onStopNote(midiNote);
                      }
                    }}
                    onMouseDown={(e) => {
                      // 🎵 Play note when pressed
                      e.currentTarget.style.background = isBlackKey ? '#60a5fa' : '#3b82f6';
                      console.log(`🎹 Playing note: ${noteName}${octave} (MIDI: ${midiNote})`);
                      
                      if (onPlayNote) {
                        // MIDI note is already calculated correctly
                        const velocity = 80; // Default velocity
                        const duration = 500; // 500ms default duration
                        onPlayNote(midiNote, velocity, duration);
                      }
                    }}
                    onMouseUp={(e) => {
                      // Reset to alternating color
                      e.currentTarget.style.background = keyBackgroundColor;
                      
                      if (onStopNote) {
                        onStopNote(midiNote);
                      }
                    }}
                  >
                    {!isBlackKey && `${noteName}${octave}`}
                  </div>
                );
              })}
            </div>

            {/* Note Grid - Scrollable */}
            <div 
              id="noteGrid"
              style={{
                flex: 1,
                background: '#0f172a',
                position: 'relative',
                overflow: 'auto'
              }}
              onScroll={(e) => {
                // Sync scroll with piano keys
                const pianoKeys = document.getElementById('pianoKeys');
                if (pianoKeys) {
                  pianoKeys.scrollTop = e.currentTarget.scrollTop;
                }
              }}
            >
              {/* Time ruler */}
              <div style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                height: '21px', // Match piano keys header exactly
                background: '#1e293b',
                borderBottom: '1px solid #475569',
                display: 'flex',
                alignItems: 'center',
                zIndex: 20,
                minWidth: `${selectedMidiClip.duration * 128}px`,
                boxSizing: 'border-box'
              }}>
                {Array.from({ length: Math.ceil(selectedMidiClip.duration) }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '128px', // 128px per beat for clip-limited view
                      height: '100%',
                      borderRight: '1px solid #475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#94a3b8',
                      flexShrink: 0
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Grid Background with alternating piano key colors */}
              <div style={{
                position: 'absolute',
                top: '21px', // Start after time ruler (21px including border)
                left: 0,
                width: `${selectedMidiClip.duration * 128}px`,
                height: `${88 * 16}px`, // 88 keys, 16px each (total height including border)
                background: '#0f172a'
              }}>
                {/* Piano key background stripes with alternating colors */}
                {Array.from({ length: 88 }, (_, i) => {
                  const midiNote = 108 - i; // Start from C8 (108) down to A0 (21)
                  const noteInOctave = midiNote % 12;
                  const isBlackKey = [1, 3, 6, 8, 10].includes(noteInOctave);
                  
                  // Create different background colors based on key type and position
                  let backgroundColor;
                  if (isBlackKey) {
                    // Black keys - darker background
                    backgroundColor = i % 2 === 0 ? '#1a202c' : '#1e293b';
                  } else {
                    // White keys - lighter background with subtle alternation
                    backgroundColor = i % 2 === 0 ? '#0f172a' : '#141b26';
                  }
                  
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        top: `${i * 16}px`, // 16px total spacing to match piano keys exactly
                        left: 0,
                        width: '100%',
                        height: '16px', // Total height including border to match piano keys
                        backgroundColor: backgroundColor,
                        borderBottom: '1px solid rgba(71, 85, 105, 0.3)', // Match piano key border exactly
                        boxSizing: 'border-box'
                      }}
                    />
                  );
                })}
                
                {/* Vertical grid lines (beats) */}
                {Array.from({ length: Math.ceil(selectedMidiClip.duration * 4) + 1 }, (_, i) => (
                  <div
                    key={`beat-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${i * 32}px`, // 32px per 16th note (128px per beat / 4)
                      top: 0,
                      width: '1px',
                      height: '100%',
                      background: i % 4 === 0 ? '#475569' : '#334155', // Stronger lines on beats
                      opacity: i % 4 === 0 ? 0.8 : 0.4
                    }}
                  />
                ))}
                
                {/* Quarter beat accent lines */}
                {Array.from({ length: Math.ceil(selectedMidiClip.duration) + 1 }, (_, i) => (
                  <div
                    key={`quarter-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${i * 128}px`, // 128px per beat
                      top: 0,
                      width: '2px',
                      height: '100%',
                      background: '#60a5fa',
                      opacity: 0.6,
                      zIndex: 5
                    }}
                  />
                ))}
              </div>

              {/* MIDI Notes */}
              <div style={{
                position: 'absolute',
                top: '21px', // Start after time ruler (21px including border)
                left: 0,
                width: `${selectedMidiClip.duration * 128}px`,
                height: `${88 * 16}px` // 88 keys * 16px per key
              }}>
                {selectedMidiClip.midiData?.notes?.map((note: any) => {
                  // Convert MIDI note to piano key index
                  // MIDI 108 (C8) should be at top (index 0), MIDI 21 (A0) at bottom (index 87)
                  const noteIndex = 108 - note.pitch;
                  const top = noteIndex * 16; // 16px total spacing to match piano keys
                  const left = note.startTime * 128; // 128px per beat for clip view
                  const width = note.duration * 128;
                  
                  // Determine note color based on pitch and selection
                  const noteInOctave = note.pitch % 12;
                  const isBlackKeyNote = [1, 3, 6, 8, 10].includes(noteInOctave);
                  
                  let noteColor, borderColor, textColor;
                  if (note.isSelected) {
                    noteColor = '#60a5fa'; // Blue for selected
                    borderColor = '#3b82f6';
                    textColor = 'white';
                  } else if (isBlackKeyNote) {
                    // Black key notes - warmer colors
                    noteColor = '#f59e0b'; // Amber
                    borderColor = '#d97706';
                    textColor = 'white';
                  } else {
                    // White key notes - cooler colors
                    noteColor = '#10b981'; // Emerald
                    borderColor = '#059669';
                    textColor = 'white';
                  }
                  
                  return (
                    <div
                      key={note.id}
                      style={{
                        position: 'absolute',
                        top: `${top + 1}px`, // Offset 1px to center within the 16px row
                        left: `${left}px`,
                        width: `${width}px`,
                        height: '14px', // 14px height to fit nicely within 16px row
                        background: `linear-gradient(135deg, ${noteColor}, ${noteColor}dd)`,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: textColor,
                        overflow: 'hidden',
                        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                        zIndex: 15,
                        transition: 'all 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                        console.log(`🎵 Playing MIDI note: ${note.pitch}`);
                        if (onPlayNote) {
                          onPlayNote(note.pitch, note.velocity, 200);
                        }
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (onDeleteMidiNote) {
                          console.log(`🗑️ Deleting MIDI note: ${note.id}`);
                          onDeleteMidiNote(selectedMidiClip.id, note.id);
                        }
                      }}
                      title={`Pitch: ${note.pitch}, Velocity: ${note.velocity}, Start: ${note.startTime}, Duration: ${note.duration}`}
                    >
                      {note.pitch}
                    </div>
                  );
                })}
              </div>

              {/* Click to add notes overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: '21px', // Start after time ruler (21px including border)
                  left: 0,
                  width: `${selectedMidiClip.duration * 128}px`,
                  height: `${88 * 16}px`,
                  zIndex: 10
                }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return; // Only left click
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Calculate note position within the clip
                  const noteIndex = Math.floor(y / 16); // 16px per row
                  const midiNote = 108 - noteIndex; // Convert index back to MIDI note
                  const relativeTime = x / 128; // Time relative to clip start (in beats)
                  const snappedTime = Math.floor(relativeTime * 4) / 4; // Snap to 16th notes
                  const duration = 0.25; // Default 16th note duration
                  const velocity = 80;
                  
                  // Ensure the note is within clip bounds
                  if (midiNote >= 21 && midiNote <= 108 && snappedTime >= 0 && snappedTime + duration <= selectedMidiClip.duration && onAddMidiNote) {
                    console.log(`➕ Adding MIDI note: ${midiNote} at relative time ${snappedTime} (within clip duration ${selectedMidiClip.duration})`);
                    onAddMidiNote(selectedMidiClip.id, midiNote, velocity, snappedTime, duration);
                    
                    // Play preview
                    if (onPlayNote) {
                      onPlayNote(midiNote, velocity, 200);
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Piano Roll Info Bar */}
        <div style={{
          height: '30px',
          background: '#1e293b',
          borderTop: '1px solid #475569',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <span>
            Clip: {selectedMidiClip.name} | Duration: {selectedMidiClip.duration} beats | 
            Notes: {selectedMidiClip.midiData?.notes?.length || 0} | 
            Range: 0 - {selectedMidiClip.duration} beats
          </span>
        </div>
      </>
    ) : (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        Select a MIDI clip to edit notes
      </div>
    )
  );

  const renderMixer = () => (
    <div style={{
      flex: 1,
      background: '#0f172a',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {tracks.length > 0 ? (
        <>
          {/* Master Section */}
          <div style={{
            width: '80px',
            background: '#1e293b',
            borderRight: '1px solid #475569',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 8px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '12px',
              color: '#f1f5f9'
            }}>
              MASTER
            </div>
            
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.8"
                style={{
                  writingMode: 'vertical-lr' as const,
                  width: '200px',
                  height: '20px',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '100px 100px'
                }}
              />
              
              <div style={{
                width: '40px',
                height: '8px',
                background: '#334155',
                borderRadius: '4px',
                position: 'relative',
                marginTop: '80px'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  bottom: '0',
                  width: '80%',
                  background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          </div>
          
          {/* Track Strips */}
          <div style={{
            flex: 1,
            display: 'flex',
            overflowX: 'auto',
            gap: '1px',
            background: '#475569'
          }}>
            {tracks.map((track, index) => (
              <div
                key={track.id}
                style={{
                  width: '80px',
                  minWidth: '80px',
                  background: '#1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '8px'
                }}
              >
                {/* Track Name */}
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: '8px',
                  color: '#f1f5f9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {track.name}
                </div>
                
                {/* EQ Section */}
                <div style={{
                  height: '60px',
                  background: '#334155',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#94a3b8'
                }}>
                  EQ
                </div>
                
                {/* Send Knobs */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '8px'
                }}>
                  {['A', 'B'].map((send) => (
                    <div key={send} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        fontSize: '8px',
                        color: '#64748b',
                        width: '8px'
                      }}>
                        {send}
                      </div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '1px solid #475569',
                        borderRadius: '10px',
                        background: '#334155'
                      }}></div>
                    </div>
                  ))}
                </div>
                
                {/* Fader */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    defaultValue="0.8"
                    style={{
                      writingMode: 'vertical-lr' as const,
                      width: '120px',
                      height: '20px',
                      transform: 'rotate(-90deg)',
                      transformOrigin: '60px 60px'
                    }}
                  />
                  
                  <div style={{
                    width: '40px',
                    height: '6px',
                    background: '#334155',
                    borderRadius: '3px',
                    position: 'relative',
                    marginTop: '40px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      bottom: '0',
                      width: '70%',
                      background: 'linear-gradient(to right, #22c55e, #f59e0b)',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
                
                {/* Pan */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  background: '#334155',
                  margin: '8px auto'
                }}></div>
                
                {/* Mute/Solo */}
                <div style={{
                  display: 'flex',
                  gap: '2px',
                  marginBottom: '8px'
                }}>
                  <button style={{
                    flex: 1,
                    height: '16px',
                    background: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '2px',
                    color: '#94a3b8',
                    fontSize: '8px',
                    cursor: 'pointer'
                  }}>
                    M
                  </button>
                  <button style={{
                    flex: 1,
                    height: '16px',
                    background: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '2px',
                    color: '#94a3b8',
                    fontSize: '8px',
                    cursor: 'pointer'
                  }}>
                    S
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎛️</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>No tracks to mix</div>
          <div style={{ fontSize: '14px' }}>
            Create some tracks to see the mixer
          </div>
        </div>
      )}
    </div>
  );

  const renderBrowser = () => (
    <div style={{
      flex: 1,
      background: '#0f172a',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Categories */}
      <div style={{
        width: '200px',
        background: '#1e293b',
        borderRight: '1px solid #475569',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '40px',
          background: '#334155',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          fontSize: '14px',
          fontWeight: '600',
          borderBottom: '1px solid #475569'
        }}>
          Browser
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {[
            { name: '🎵 Audio Files', count: 0 },
            { name: '🎹 MIDI Files', count: 0 },
            { name: '🔧 Instruments', count: 0 },
            { name: '🎛️ Effects', count: 0 },
            { name: '🥁 Drum Kits', count: 0 },
            { name: '🎼 Loops', count: 0 }
          ].map((category, index) => (
            <div
              key={index}
              style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontSize: '13px',
                color: '#f1f5f9',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(71, 85, 105, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ flex: 1 }}>{category.name}</span>
              <span style={{
                fontSize: '11px',
                color: '#64748b',
                background: '#334155',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {category.count}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#64748b'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>Browser is empty</div>
        <div style={{ fontSize: '14px', textAlign: 'center' }}>
          Import audio files, MIDI files, or<br />
          install plugins to populate the browser
        </div>
        
        <label
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#2563eb',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'inline-block'
          }}
        >
          Import Files
          <input
            type="file"
            multiple
            accept=".wav,.mp3,.midi,.mid,.ogg,.flac"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onImportFiles?.(e.target.files);
              }
            }}
                        style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );

  const renderProperties = () => (
    <div style={{
      flex: 1,
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        height: '40px',
        background: '#1e293b',
        borderBottom: '1px solid #475569',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        Properties
      </div>
      
      {selectedClips.length > 0 ? (
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#f1f5f9'
            }}>
              Clip Properties
            </div>
            
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '4px'
                }}>
                  Name
                </label>
                <input
                  type="text"
                  defaultValue="New Clip"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#f1f5f9',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '4px'
                }}>
                  Color
                </label>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap'
                }}>
                  {[
                    '#ef4444', '#f97316', '#f59e0b', '#22c55e',
                    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
                  ].map((color) => (
                    <div
                      key={color}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: color,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: '2px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '4px'
                }}>
                  Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  defaultValue="0.8"
                  style={{
                    width: '100%',
                    height: '4px',
                    background: '#475569',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>No selection</div>
          <div style={{ fontSize: '14px' }}>
            Select clips or tracks to see properties
          </div>
        </div>
      )}
    </div>
  );

  const panels = {
    'piano-roll': { label: '🎹 Piano Roll', content: renderPianoRoll() },
    'mixer': { label: '🎛️ Mixer', content: renderMixer() },
    'browser': { label: '📁 Browser', content: renderBrowser() },
    'properties': { label: '⚙️ Properties', content: renderProperties() }
  };

  return (
    <div
      ref={panelRef}
      style={{
        height: `${height}px`,
        background: '#1e293b',
        borderTop: '1px solid #475569',
        display: 'flex',
        flexDirection: 'column',
        color: '#f1f5f9'
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: '4px',
          background: isResizing ? '#2563eb' : 'transparent',
          cursor: 'ns-resize',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.background = '#475569';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '2px',
          background: '#64748b',
          borderRadius: '1px'
        }}></div>
      </div>

      {/* Panel Tabs */}
      <div style={{
        height: '40px',
        background: '#334155',
        borderBottom: '1px solid #475569',
        display: 'flex',
        alignItems: 'stretch'
      }}>
        {Object.entries(panels).map(([key, panel]) => (
          <button
            key={key}
            onClick={() => onActivePanelChange(key as typeof activePanel)}
            style={{
              padding: '0 20px',
              background: activePanel === key ? '#2563eb' : 'transparent',
              border: 'none',
              color: activePanel === key ? 'white' : '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              borderRight: '1px solid #475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activePanel !== key) {
                e.currentTarget.style.background = '#475569';
                e.currentTarget.style.color = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (activePanel !== key) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            {panel.label}
          </button>
        ))}
        
        <div style={{ flex: 1 }}></div>
        
        {/* Quick Actions */}
        <button
          onClick={onAddClip}
          disabled={tracks.length === 0}
          style={{
            padding: '0 16px',
            background: tracks.length > 0 ? '#2563eb' : 'transparent',
            border: 'none',
            color: tracks.length > 0 ? 'white' : '#64748b',
            fontSize: '12px',
            cursor: tracks.length > 0 ? 'pointer' : 'not-allowed',
            opacity: tracks.length > 0 ? 1 : 0.5
          }}
          title="Add Clip"
        >
          + Clip
        </button>
      </div>

      {/* Panel Content */}
      {panels[activePanel].content}
    </div>
  );
}; 