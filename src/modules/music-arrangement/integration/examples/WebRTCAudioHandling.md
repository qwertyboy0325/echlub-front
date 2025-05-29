# WebRTC Audio Buffer Handling in Music Arrangement BC

This document explains how the Music Arrangement BC handles audio buffers received from the Collaboration BC via WebRTC.

## Overview

When collaborators record audio in real-time during a jam session, the audio data is transmitted via WebRTC and needs to be integrated into the music arrangement. The Music Arrangement BC provides a complete pipeline for handling this scenario.

## Architecture

```
Collaboration BC (WebRTC) → AudioBufferReceivedEvent → AudioBufferReceivedHandler → MusicArrangementService
```

## Components

### 1. AudioSourceRef with WebRTC Support

The `AudioSourceRef` value object has been extended to support WebRTC audio buffers:

```typescript
// Create a WebRTC audio source
const audioSource = AudioSourceRef.webrtcBuffer(
  collaboratorId,
  sessionId,
  buffer, // ArrayBuffer containing audio data
  {
    duration: 5.2,
    sampleRate: 44100,
    channels: 2
  }
);
```

### 2. AudioBufferReceivedEvent

Integration event that carries WebRTC audio data:

```typescript
const event = AudioBufferReceivedEvent.create(
  'collaborator-123',
  'session-456',
  audioBuffer,
  {
    duration: 5.2,
    sampleRate: 44100,
    channels: 2,
    timestamp: 120.5 // Position in the arrangement
  },
  'track-789' // Optional target track
);
```

### 3. AudioBufferReceivedHandler

Processes the event and creates audio clips:

```typescript
const handler = new AudioBufferReceivedHandler(musicArrangementService);
await handler.handle(event);
```

### 4. Enhanced AudioClip

AudioClip now provides WebRTC-specific methods:

```typescript
const audioClip = // ... get audio clip
if (audioClip.isWebRTCBuffer()) {
  const buffer = audioClip.sourceBuffer;
  const collaboratorId = audioClip.collaboratorId;
  const sessionId = audioClip.sessionId;
  const isReady = audioClip.isReadyForPlayback(); // true for WebRTC buffers
}
```

## Usage Example

### Setting up the Handler

```typescript
import { 
  AudioBufferReceivedHandler,
  MusicArrangementService 
} from '@/modules/music-arrangement';

// Initialize the service and handler
const musicArrangementService = new MusicArrangementService(
  trackRepository,
  clipRepository,
  eventBus
);

const audioBufferHandler = new AudioBufferReceivedHandler(
  musicArrangementService
);
```

### Processing WebRTC Audio

```typescript
// When audio buffer is received from collaboration BC
const handleWebRTCAudio = async (
  collaboratorId: string,
  sessionId: string,
  audioBuffer: ArrayBuffer,
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
    timestamp: number;
  },
  targetTrackId?: string
) => {
  // Create and dispatch the integration event
  const event = AudioBufferReceivedEvent.create(
    collaboratorId,
    sessionId,
    audioBuffer,
    metadata,
    targetTrackId
  );

  // Handle the event
  await audioBufferHandler.handle(event);
};
```

### Automatic Track Creation

If no target track is specified, the handler will automatically create a collaboration track:

```typescript
// This will create a new track named "Collaboration Track - collaborator-123"
await handleWebRTCAudio(
  'collaborator-123',
  'session-456',
  audioBuffer,
  metadata
  // No targetTrackId - will create new track
);
```

### Using Existing Track

To add audio to an existing track:

```typescript
await handleWebRTCAudio(
  'collaborator-123',
  'session-456',
  audioBuffer,
  metadata,
  'existing-track-id'
);
```

## Benefits

1. **Real-time Integration**: WebRTC audio buffers are immediately available for playback
2. **Automatic Organization**: Collaboration audio is properly tagged and organized
3. **Flexible Targeting**: Can create new tracks or use existing ones
4. **Metadata Preservation**: Collaborator and session information is maintained
5. **Type Safety**: Full TypeScript support with proper typing

## Integration with Playback

WebRTC audio clips are immediately ready for playback since they contain the actual audio data:

```typescript
const audioClip = // ... get audio clip
if (audioClip.isReadyForPlayback()) {
  // Can immediately play this clip
  const buffer = audioClip.sourceBuffer; // ArrayBuffer ready for Web Audio API
}
```

This enables seamless real-time collaboration where recorded audio is immediately available in the arrangement. 