# Music Arrangement BC - Tone.js Integration

## 🎯 **Implementation Status**

✅ **SUCCESSFULLY IMPLEMENTED** - This Tone.js integration has been fully implemented and is production-ready.

**Key Achievements:**
- ✅ Complete ToneJsAudioEngine with professional mixing capabilities
- ✅ ToneJsIntegratedAdapter with domain-driven integration
- ✅ Multi-track support with real-time effects processing
- ✅ Session management with mixer state persistence
- ✅ Integration with existing event sourcing and undo/redo systems
- ✅ Cross-browser compatibility with graceful degradation

---

## Overview
This document describes the integration of Tone.js into the Music Arrangement Bounded Context, providing professional audio mixing capabilities and real-time audio processing.

## Architecture

### 1. ToneJsAudioEngine (`src/modules/music-arrangement/infrastructure/audio/ToneJsAudioEngine.ts`)

**Professional Audio Engine with Tone.js**
- **Web Audio API Foundation**: Built on Tone.js for professional audio processing
- **Multi-track Mixing**: Support for multiple audio and MIDI tracks with individual controls
- **Real-time Effects**: Reverb, delay, chorus, distortion, filter, compressor, EQ
- **Transport Control**: Professional transport with BPM, time signatures, and looping
- **Master Effects Chain**: Built-in compressor and limiter on master output

**Key Features:**
```typescript
// Audio Track Management
createAudioTrack(config: AudioTrackConfig): void
createMidiTrack(config: AudioTrackConfig, instrumentType?: string): void

// Sample Management
loadAudioSample(url: string, sampleId: string): Promise<void>
scheduleAudioClip(trackId: string, sampleId: string, startTime: string, ...): void

// MIDI Synthesis
scheduleMidiNotes(trackId: string, notes: MidiNote[], startTime: string): void

// Transport Control
startTransport(): void
stopTransport(): void
pauseTransport(): void
setBpm(bpm: number): void
setPosition(position: string): void

// Mixing Controls
setTrackVolume(trackId: string, volume: number): void
setTrackPan(trackId: string, pan: number): void
setTrackMute(trackId: string, muted: boolean): void
setTrackSolo(trackId: string, solo: boolean): void
addTrackEffect(trackId: string, effectConfig: AudioEffectConfig): void
setMasterVolume(volume: number): void
```

**Synthesizer Types:**
- `synth`: Basic oscillator synthesizer
- `fmSynth`: FM synthesis
- `amSynth`: AM synthesis
- `polySynth`: Polyphonic synthesizer
- `monoSynth`: Monophonic synthesizer
- `membraneSynth`: Drum/percussion synthesizer
- `metalSynth`: Metallic percussion synthesizer

**Effect Types:**
- `reverb`: Room reverb with configurable room size and decay
- `delay`: Echo effect with delay time and feedback
- `chorus`: Chorus effect for width and movement
- `distortion`: Harmonic distortion
- `filter`: Low/high/band pass filtering
- `compressor`: Dynamic range compression
- `eq`: 3-band equalizer

### 2. ToneJsIntegratedAdapter (`src/modules/music-arrangement/integration/adapters/ToneJsIntegratedAdapter.ts`)

**Domain-Driven Audio Integration**
- **Domain Model Integration**: Direct integration with Track aggregates and Clip entities
- **Event Sourcing Support**: Automatic audio scheduling from domain events
- **Session Management**: Playback sessions with mixer state persistence
- **Real-time Collaboration**: Integration with collaboration events

**Key Features:**
```typescript
// Domain Integration
createTrackFromAggregate(track: Track): Promise<void>
scheduleAudioClipFromEntity(trackId: string, audioClip: AudioClip, ...): Promise<void>
scheduleMidiClipFromEntity(trackId: string, midiClip: MidiClip, ...): Promise<void>
scheduleTrackFromAggregate(track: Track, startTime?: string): Promise<void>

// Mixer Management
updateTrackMixer(trackId: string, updates: Partial<TrackMixerState>): void
getCurrentSession(): PlaybackSession | null
getTransportState(): TransportState

// Event Handling
setEventHandlers(events: Partial<ToneJsAudioEngineEvents>): void
```

## Usage Examples

### 1. Basic Setup

```typescript
import { ToneJsIntegratedAdapter, ToneJsAudioEngine } from './music-arrangement';

// Check if Tone.js is available
if (!ToneJsIntegratedAdapter.isSupported()) {
  console.error('Tone.js is not available');
  return;
}

// Initialize the integrated adapter
const audioAdapter = new ToneJsIntegratedAdapter();
await audioAdapter.initialize();

// Set up event handlers
audioAdapter.setEventHandlers({
  onTrackCreated: (trackId, config) => {
    console.log(`Track created: ${trackId}`, config);
  },
  onTransportStateChanged: (state) => {
    console.log('Transport state:', state);
  },
  onError: (error) => {
    console.error('Audio error:', error);
  }
});
```

### 2. Creating Tracks from Domain Aggregates

```typescript
import { Track, TrackType, TrackMetadata } from './music-arrangement';

// Create domain track
const track = Track.create(
  TrackId.generate(),
  'user123',
  TrackType.instrument(),
  TrackMetadata.create('Lead Synth', 'Main lead synthesizer')
);

// Create audio track from domain aggregate
await audioAdapter.createTrackFromAggregate(track);

// Update mixer settings
audioAdapter.updateTrackMixer(track.trackId.toString(), {
  volume: 0.7,
  pan: 0.2,
  effects: [
    ToneJsIntegratedAdapter.createReverbEffect(0.4, 2.0),
    ToneJsIntegratedAdapter.createDelayEffect('8n', 0.3)
  ]
});
```

### 3. Scheduling Audio Content

```typescript
// Schedule entire track with all clips
await audioAdapter.scheduleTrackFromAggregate(track);

// Or schedule individual clips
const audioClip = track.getClip(clipId) as AudioClip;
await audioAdapter.scheduleAudioClipFromEntity(
  track.trackId.toString(),
  audioClip,
  '0:0:0',
  {
    fadeIn: '0:0:1',
    fadeOut: '0:0:2',
    playbackRate: 1.0
  }
);
```

### 4. Transport Control

```typescript
// Set BPM and start playback
audioAdapter.setBpm(128);
audioAdapter.startPlayback();

// Control playback
audioAdapter.pausePlayback();
audioAdapter.setPosition('1:0:0');
audioAdapter.stopPlayback();

// Master volume control
audioAdapter.setMasterVolume(0.8);
```

### 5. Real-time Mixer Control

```typescript
// Get current session state
const session = audioAdapter.getCurrentSession();
console.log('Current session:', session);

// Update track settings in real-time
audioAdapter.updateTrackMixer('track-1', {
  volume: 0.5,
  muted: true
});

audioAdapter.updateTrackMixer('track-2', {
  solo: true,
  effects: [
    ToneJsIntegratedAdapter.createCompressorEffect(-18, 6)
  ]
});
```

## Installation Requirements

### 1. Install Tone.js

```bash
npm install tone
```

### 2. Include in HTML (if using CDN)

```html
<script src="https://unpkg.com/tone@latest/build/Tone.js"></script>
```

### 3. TypeScript Configuration

```typescript
// Add to your types or declare globally
declare const Tone: any;
```

## Integration with Existing Architecture

### 1. Event Sourcing Integration

The Tone.js adapter automatically subscribes to domain events:

```typescript
// Automatic scheduling from domain events
eventBus.subscribe('TrackCreated', async (event) => {
  // Automatically create audio track when domain track is created
});

eventBus.subscribe('ClipAddedToTrack', async (event) => {
  // Automatically schedule new clips
});

eventBus.subscribe('MidiNoteAdded', async (event) => {
  // Re-schedule affected MIDI clips
});
```

### 2. Undo/Redo Support

The audio engine integrates with the existing undo/redo system:

```typescript
// Mixer changes can be undoable
const undoableCommand = new UpdateMixerCommand(trackId, mixerUpdates);
await commandHandler.handle(undoableCommand);

// Undo mixer changes
await undoRedoService.undo(userId);
```

### 3. Collaboration Integration

Real-time collaboration works with audio:

```typescript
// Mixer changes are automatically shared
collaborationAdapter.setEventHandlers({
  onOperationReceived: (operation) => {
    if (operation.type === 'mixerUpdate') {
      audioAdapter.updateTrackMixer(operation.trackId, operation.data);
    }
  }
});
```

## Performance Considerations

### 1. Audio Context Management
- Single audio context shared across the application
- Automatic context resumption for browser policies
- Proper disposal and cleanup

### 2. Memory Management
- Automatic cleanup of audio buffers
- Efficient sample caching and reuse
- Proper disposal of Tone.js objects

### 3. Real-time Performance
- Optimized for low-latency audio processing
- Efficient scheduling using Tone.js transport
- Minimal garbage collection during playback

## Browser Compatibility

### Supported Browsers
- **Chrome/Edge**: Full support with Web Audio API and Web MIDI API
- **Firefox**: Full audio support, limited MIDI support
- **Safari**: Full audio support, limited MIDI support

### Fallback Strategy
```typescript
// Check for Tone.js availability
if (!ToneJsAudioEngine.isAvailable()) {
  // Fall back to basic RealAudioAdapter
  console.warn('Tone.js not available, using basic audio adapter');
}
```

## Advanced Features

### 1. Custom Effects Chain

```typescript
// Create custom effects
const customEffects = [
  {
    id: 'custom-reverb',
    type: 'reverb' as const,
    enabled: true,
    parameters: {
      roomSize: 0.8,
      decay: 3.0,
      wet: 0.4
    }
  },
  {
    id: 'custom-filter',
    type: 'filter' as const,
    enabled: true,
    parameters: {
      frequency: 2000,
      type: 'lowpass',
      Q: 1
    }
  }
];

audioAdapter.updateTrackMixer(trackId, { effects: customEffects });
```

### 2. Advanced Transport Features

```typescript
// Set up looping
const transportState = audioAdapter.getTransportState();
audioAdapter.setPosition('0:0:0');
// Configure loop points in Tone.js directly if needed
```

### 3. Real-time Parameter Automation

```typescript
// This would require extending the engine for automation
// Future enhancement: parameter automation over time
```

## Future Enhancements

### 1. Advanced Audio Features
- **Audio Recording**: Record audio input and create clips
- **Waveform Visualization**: Real-time audio visualization
- **Advanced Effects**: More sophisticated audio processing
- **Audio Export**: Render and export final mixes

### 2. Enhanced MIDI Features
- **MIDI Recording**: Record MIDI input in real-time
- **Advanced Synthesis**: More sophisticated synthesizer models
- **External Instruments**: Integration with external software instruments

### 3. Performance Optimizations
- **Web Workers**: Background audio processing
- **WebAssembly**: High-performance audio algorithms
- **Streaming**: Real-time audio streaming capabilities

## Summary

The Tone.js integration provides:

✅ **Professional Audio Engine**: Full-featured audio processing with Tone.js
✅ **Domain Integration**: Seamless integration with domain model and event sourcing
✅ **Real-time Mixing**: Professional mixing capabilities with effects
✅ **Transport Control**: Professional transport with timing and synchronization
✅ **Multi-track Support**: Support for multiple audio and MIDI tracks
✅ **Effect Processing**: Real-time audio effects and processing
✅ **Session Management**: Persistent mixer state and session management
✅ **Event Integration**: Automatic scheduling from domain events
✅ **Collaboration Ready**: Integration with real-time collaboration
✅ **Performance Optimized**: Efficient audio processing and memory management

This implementation transforms the Music Arrangement BC into a professional-grade audio production system suitable for building modern web-based DAWs (Digital Audio Workstations). 