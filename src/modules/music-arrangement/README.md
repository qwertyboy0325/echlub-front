# Music Arrangement BC (Bounded Context)

## 🏗️ Clean Architecture with Command Pattern

This module implements the Music Arrangement Bounded Context following **Clean Architecture** principles with **Command/Query Responsibility Segregation (CQRS)** pattern. All operations go through the **Mediator** pattern to ensure proper separation of concerns.

### 🔒 Architecture Principles

1. **Single Entry Point**: Only `MusicArrangementService` is exposed to external layers
2. **Command Pattern**: All operations use Commands/Queries through Mediator
3. **DTO Pattern**: Only simple data types and DTOs cross boundaries
4. **Domain Isolation**: Domain objects never leave the application layer
5. **Dependency Inversion**: All dependencies point inward

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Command Pattern Flow](#command-pattern-flow)
- [API Reference](#api-reference)
- [DTOs](#dtos)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🚀 Quick Start

### Basic Setup

```typescript
import { container } from '@/modules/music-arrangement';
import { 
  MusicArrangementService, 
  type TrackInfoDTO,
  type ClipInfoDTO,
  type TimeRangeDTO 
} from '@/modules/music-arrangement';

// Get the service from DI container
const service = container.get<MusicArrangementService>(
  MusicArrangementTypes.MusicArrangementService
);
```

### Create a Track

```typescript
// ✅ Correct: Using simple data types
const trackId = await service.createTrack(
  'user123',           // ownerId: string
  'instrument',        // type: string
  'Lead Synth'         // name: string
);

console.log(`Created track: ${trackId}`);
```

### Add MIDI Clip and Notes

```typescript
// Create MIDI clip
const clipId = await service.createMidiClip(
  trackId,
  { startTime: 0, endTime: 4 },  // timeRange: TimeRangeDTO
  { type: 'synth', name: 'Lead' }, // instrument: InstrumentDTO
  'Main Melody'                   // name: string
);

// Add MIDI note
const noteId = await service.addMidiNote(
  trackId,
  clipId,
  60,                            // pitch: number (C4)
  100,                           // velocity: number
  { startTime: 0, endTime: 1 }   // timeRange: TimeRangeDTO
);
```

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    External Layers                          │
│  (UI Components, API Controllers, Other Modules)           │
└─────────────────────┬───────────────────────────────────────┘
                      │ Only DTOs and simple types
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Application Layer                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           MusicArrangementService                   │   │
│  │  (Single Entry Point - Clean Architecture)         │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │ Commands/Queries                  │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Mediator                               │   │
│  │  (Command/Query Dispatcher)                         │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                   │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │         Command/Query Handlers                      │   │
│  │  • CreateTrackCommandHandler                        │   │
│  │  • AddMidiNoteCommandHandler                        │   │
│  │  • GetTrackByIdQueryHandler                         │   │
│  │  • ...                                              │   │
│  └─────────────────────┬───────────────────────────────┘   │
└────────────────────────┼───────────────────────────────────┘
                         │ Domain operations
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Domain Layer                              │
│  • Track (Aggregate Root)                                  │
│  • AudioClip, MidiClip (Entities)                         │
│  • TrackId, ClipId (Value Objects)                        │
│  • Domain Events                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ Repository interfaces
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                         │
│  • InMemoryTrackRepository                                 │
│  • InMemoryClipRepository                                  │
│  • EventStore                                              │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Command Pattern Flow

### Command Execution Flow

```
User Request
     │
     ▼
MusicArrangementService
     │ (converts simple types to domain objects)
     ▼
Mediator.send(Command)
     │
     ▼
CommandHandler.handle()
     │ (domain operations)
     ▼
Domain Layer (Track, Clip, etc.)
     │
     ▼
Repository.save()
     │
     ▼
Infrastructure Layer
```

### Query Execution Flow

```
User Request
     │
     ▼
MusicArrangementService
     │
     ▼
Mediator.query(Query)
     │
     ▼
QueryHandler.handle()
     │
     ▼
Repository.find()
     │ (domain objects)
     ▼
MusicArrangementService
     │ (converts to DTOs)
     ▼
User receives DTOs
```

## 📚 API Reference

### Track Operations

#### `createTrack(ownerId: string, type: string, name: string): Promise<string>`
Creates a new track using CreateTrackCommand.

**Parameters:**
- `ownerId`: User/peer identifier
- `type`: Track type ('instrument' | 'audio' | 'master')
- `name`: Track display name

**Returns:** Track ID as string

**Example:**
```typescript
const trackId = await service.createTrack('user123', 'instrument', 'Bass Line');
```

#### `getTrackInfo(trackId: string): Promise<TrackInfoDTO | null>`
Retrieves track information using GetTrackByIdQuery.

#### `deleteTrack(trackId: string): Promise<void>`
⚠️ **Not yet implemented** - Would use DeleteTrackCommand

### Clip Operations

#### `createAudioClip(trackId, timeRange, audioSource, name): Promise<string>`
Creates audio clip using CreateAudioClipCommand.

#### `createMidiClip(trackId, timeRange, instrument, name): Promise<string>`
Creates MIDI clip using CreateMidiClipCommand.

#### `getClipsInTrack(trackId: string): Promise<ClipInfoDTO[]>`
Gets all clips in track using GetTrackWithClipsQuery.

### MIDI Operations

#### `addMidiNote(trackId, clipId, pitch, velocity, timeRange): Promise<string>`
Adds MIDI note using AddMidiNoteCommand.

#### `quantizeMidiClip(trackId, clipId, quantizeValue): Promise<void>`
Quantizes MIDI clip using QuantizeMidiClipCommand.

#### `transposeMidiClip(trackId, clipId, semitones): Promise<void>`
Transposes MIDI clip using TransposeMidiClipCommand.

## 📦 DTOs

### TrackInfoDTO
```typescript
interface TrackInfoDTO {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  clipCount: number;
}
```

### ClipInfoDTO
```typescript
interface ClipInfoDTO {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime: number;
  duration: number;
}
```

### TimeRangeDTO
```typescript
interface TimeRangeDTO {
  startTime: number;
  endTime: number;
}
```

### InstrumentDTO
```typescript
interface InstrumentDTO {
  type: string;
  name: string;
}
```

## 🚨 Error Handling

All domain errors are converted to simple error messages:

```typescript
try {
  const trackId = await service.createTrack('user123', 'invalid-type', 'Test');
} catch (error) {
  // Error format: "ERROR_CODE: Error message"
  console.error(error.message); // "INVALID_TRACK_TYPE: Invalid track type: invalid-type"
}
```

## 📖 Examples

### Complete Workflow Example

```typescript
import { container } from '@/modules/music-arrangement';
import { MusicArrangementService } from '@/modules/music-arrangement';

async function createMusicArrangement() {
  const service = container.get<MusicArrangementService>(
    MusicArrangementTypes.MusicArrangementService
  );

  try {
    // 1. Create track using Command Pattern
    const trackId = await service.createTrack(
      'producer123',
      'instrument', 
      'Lead Synth'
    );

    // 2. Create MIDI clip using Command Pattern
    const clipId = await service.createMidiClip(
      trackId,
      { startTime: 0, endTime: 8 },
      { type: 'synth', name: 'Analog Lead' },
      'Main Melody'
    );

    // 3. Add MIDI notes using Command Pattern
    const notes = [
      { pitch: 60, start: 0, end: 1 },    // C4
      { pitch: 64, start: 1, end: 2 },    // E4
      { pitch: 67, start: 2, end: 3 },    // G4
    ];

    for (const note of notes) {
      await service.addMidiNote(
        trackId,
        clipId,
        note.pitch,
        100,
        { startTime: note.start, endTime: note.end }
      );
    }

    // 4. Quantize the clip using Command Pattern
    await service.quantizeMidiClip(trackId, clipId, '1/16');

    // 5. Get track info using Query Pattern
    const trackInfo = await service.getTrackInfo(trackId);
    console.log('Track created:', trackInfo);

    // 6. Get all clips using Query Pattern
    const clips = await service.getClipsInTrack(trackId);
    console.log('Clips:', clips);

  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### System Monitoring Example

```typescript
async function monitorSystem() {
  const service = container.get<MusicArrangementService>(
    MusicArrangementTypes.MusicArrangementService
  );

  // Get system statistics
  const stats = await service.getSystemStats();
  console.log('System Stats:', stats);

  // Validate track state
  const validation = await service.validateTrackState(trackId);
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
  }

  // Get debug information
  const debug = await service.getDebugInfo(trackId);
  console.log('Debug Info:', debug);
}
```

## 🔧 Advanced Usage

### Custom Error Handling

```typescript
async function handleErrors() {
  try {
    await service.createTrack('', 'instrument', 'Test');
  } catch (error) {
    if (error.message.includes('INVALID_OWNER_ID')) {
      // Handle specific error
      console.log('Please provide a valid owner ID');
    } else {
      // Handle general error
      console.error('Unexpected error:', error.message);
    }
  }
}
```

### Batch Operations

```typescript
async function batchOperations() {
  const service = container.get<MusicArrangementService>(
    MusicArrangementTypes.MusicArrangementService
  );

  // Create multiple tracks
  const trackPromises = ['Lead', 'Bass', 'Drums'].map(name =>
    service.createTrack('user123', 'instrument', name)
  );
  
  const trackIds = await Promise.all(trackPromises);
  console.log('Created tracks:', trackIds);
}
```

## ❌ What NOT to Do

```typescript
// ❌ WRONG: Don't import domain types
import { Track, TrackType } from '@/modules/music-arrangement/domain';

// ❌ WRONG: Don't create domain objects directly
const track = Track.create(trackId, ownerId, trackType, metadata);

// ❌ WRONG: Don't access repositories directly
const trackRepo = container.get(MusicArrangementTypes.TrackRepository);

// ❌ WRONG: Don't use Command/Query objects directly
const command = new CreateTrackCommand(ownerId, trackType, metadata);

// ✅ CORRECT: Only use MusicArrangementService
const service = container.get<MusicArrangementService>(
  MusicArrangementTypes.MusicArrangementService
);
const trackId = await service.createTrack('user123', 'instrument', 'Lead');
```

## 🎯 Key Benefits

1. **Clean Architecture Compliance**: Strict dependency rules enforced
2. **Command Pattern**: All operations are traceable and auditable
3. **Type Safety**: Full TypeScript support with proper DTOs
4. **Testability**: Easy to mock and test individual components
5. **Maintainability**: Clear separation of concerns
6. **Scalability**: Easy to add new commands/queries
7. **Domain Isolation**: Business logic protected from external changes

## 🔄 Command/Query Reference

### Available Commands
- `CreateTrackCommand` - Creates new track
- `CreateAudioClipCommand` - Creates audio clip
- `CreateMidiClipCommand` - Creates MIDI clip
- `AddMidiNoteCommand` - Adds MIDI note
- `QuantizeMidiClipCommand` - Quantizes MIDI clip
- `TransposeMidiClipCommand` - Transposes MIDI clip

### Available Queries
- `GetTrackByIdQuery` - Gets track by ID
- `GetTrackWithClipsQuery` - Gets track with all clips
- `GetTracksByOwnerQuery` - Gets tracks by owner

### Future Commands/Queries
- `DeleteTrackCommand` - Delete track
- `GetSystemStatsQuery` - System statistics
- `GetClipsInTimeRangeQuery` - Clips in time range

---

**Note**: This module strictly follows Clean Architecture principles. All operations must go through the `MusicArrangementService` using the Command/Query pattern via Mediator. Direct access to domain objects or repositories is not allowed.

## 🎯 Overview

The Music Arrangement Bounded Context manages tracks and clips in a digital audio workstation (DAW) environment. This module implements **event sourcing**, **undo/redo capabilities**, and **real-time collaboration** features using Domain-Driven Design (DDD) principles.

**✅ Clean Architecture Compliant** - Users can ONLY access through Application Layer

**Current Status**: ✅ **Phase 1 Complete** - Core Architecture Established

## 🏗️ Clean Architecture Design

### 🎯 **Strict Layer Separation**

**用戶只能通過 Application Layer 操作** - 嚴格遵循Clean Architecture原則：

```
┌─────────────────────────────────────┐
│           Presentation              │  ← 用戶界面
├─────────────────────────────────────┤
│         Application Layer           │  ← ✅ 用戶只能訪問這一層
│  - MusicArrangementService          │     (唯一入口點)
│  - DTOs for data transfer           │     (簡單數據類型)
│  - Clean API with strings/numbers   │
├─────────────────────────────────────┤
│          Domain Layer               │  ← ❌ 用戶不能直接訪問
│  - Track Aggregate                  │     (完全隱藏)
│  - Value Objects                    │
│  - Domain Events                    │
├─────────────────────────────────────┤
│       Infrastructure Layer          │  ← ❌ 用戶不能直接訪問
│  - EventStore                       │     (完全隱藏)
│  - Repositories                     │
│  - External Adapters                │
└─────────────────────────────────────┘
```

### 🔒 **API Design Principles**

- **✅ Single Entry Point**: `MusicArrangementService` 是唯一對外API
- **✅ Simple Data Types**: 只使用 `string`, `number`, `plain objects`
- **✅ DTO Pattern**: 返回 `TrackInfoDTO`, `ClipInfoDTO` 等DTOs
- **✅ No Domain Leakage**: 不暴露 `Track`, `TrackId` 等domain types
- **✅ Dependency Injection**: 通過DI容器管理依賴

## 🎼 Usage Examples

### 🚀 **Getting Started**
```typescript
import { 
  MusicArrangementService, 
  MusicArrangementContainer,
  MusicArrangementTypes,
  type TrackInfoDTO,
  type ClipInfoDTO 
} from '@/modules/music-arrangement';

// ✅ 正確：通過DI容器獲取service
const container = new MusicArrangementContainer();
await container.initialize();

const service = container.get<MusicArrangementService>(
  MusicArrangementTypes.MusicArrangementService
);
```

### 🎵 **Creating Tracks and Clips**
```typescript
// Create instrument track with simple data types
const trackId = await service.createTrack(
  'user123',      // ownerId: string
  'instrument',   // type: string  
  'Lead Synth'    // name: string
);

// Add MIDI clip with plain objects
const clipId = await service.createMidiClip(
  trackId,
  { startTime: 0, endTime: 8000 }, // TimeRangeDTO
  { type: 'synth', name: 'analog-synth' }, // InstrumentDTO
  'Main Melody'   // name: string
);

// Add audio clip
const audioClipId = await service.createAudioClip(
  trackId,
  { startTime: 8000, endTime: 16000 },
  { url: '/audio/sample.wav', name: 'Drum Loop' },
  'Drums'
);
```

### 🎹 **MIDI Operations**
```typescript
// Add MIDI notes with simple parameters
const noteId = await service.addMidiNote(
  trackId,
  clipId,
  60,  // pitch: number (C4)
  100, // velocity: number
  { startTime: 0, endTime: 1000 } // timeRange: TimeRangeDTO
);

// Quantize to 16th notes
await service.quantizeMidiClip(
  trackId,
  clipId,
  'sixteenth' // quantizeValue: string
);

// Transpose up one octave
await service.transposeMidiClip(
  trackId,
  clipId,
  12 // semitones: number
);
```

### 📊 **Querying Data**
```typescript
// Get track information as DTO
const trackInfo: TrackInfoDTO = await service.getTrackInfo(trackId);
console.log('Track:', trackInfo.name, 'Type:', trackInfo.type);
console.log('Clips:', trackInfo.clipCount);

// Get clips in track
const clips: ClipInfoDTO[] = await service.getClipsInTrack(trackId);
clips.forEach(clip => {
  console.log(`Clip: ${clip.name}, Duration: ${clip.duration}ms`);
});

// Get system statistics
const stats = await service.getSystemStats();
console.log(`System: ${stats.trackCount} tracks, ${stats.clipCount} clips`);
```

### ⚠️ **Error Handling**
```typescript
try {
  await service.addMidiNote(trackId, clipId, 60, 100, { startTime: 0, endTime: 1000 });
} catch (error) {
  // ✅ 正確：錯誤處理不依賴domain types
  if (error.message.includes('TRACK_NOT_FOUND')) {
    console.log('Track does not exist');
  } else if (error.message.includes('CLIP_NOT_FOUND')) {
    console.log('Clip not found in track');
  } else if (error.message.includes('INVALID_TIME_RANGE')) {
    console.log('Invalid time range specified');
  }
}
```

### 🔍 **System Monitoring**
```typescript
// Get track status
const status = await service.getTrackStatus(trackId);
console.log(`Track "${status.name}" has ${status.clipCount} clips`);

// Validate track state
const validation = await service.validateTrackState(trackId);
if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
}

// Get debug information
const debugInfo = await service.getDebugInfo(trackId);
console.log(`Track version: ${debugInfo.version}`);
```

## 📋 **Available DTOs**

### 🎵 **TrackInfoDTO**
```typescript
interface TrackInfoDTO {
  id: string;
  name: string;
  type: string;        // 'audio' | 'instrument' | 'bus'
  ownerId: string;
  clipCount: number;
}
```

### 🎬 **ClipInfoDTO**
```typescript
interface ClipInfoDTO {
  id: string;
  name: string;
  type: string;        // 'audio' | 'midi'
  startTime: number;   // milliseconds
  endTime: number;     // milliseconds
  duration: number;    // milliseconds
}
```

### ⏱️ **TimeRangeDTO**
```typescript
interface TimeRangeDTO {
  startTime: number;   // milliseconds
  endTime: number;     // milliseconds
}
```

### 🎛️ **InstrumentDTO**
```typescript
interface InstrumentDTO {
  type: string;        // 'synth' | 'sampler' | 'drum'
  name: string;        // instrument name
}
```

## 🏗️ **Internal Architecture** (Hidden from Users)

### Domain Layer (❌ Not Accessible)
- **Track Aggregate** - Event-sourced track management
- **Value Objects** - TrackId, ClipId, TimeRangeVO, etc.
- **Entities** - AudioClip, MidiClip, MidiNote
- **Domain Events** - TrackCreated, ClipAdded, etc.
- **Domain Services** - Business logic operations

### Infrastructure Layer (❌ Not Accessible)
- **EventStore** - Event sourcing persistence
- **Repositories** - Data access abstractions
- **Adapters** - External system integrations
- **Event Bus** - Domain event publishing

## ✅ **Completed Features (Phase 1)**

### 🎯 **Clean Architecture Implementation**
- ✅ **Single Entry Point** - MusicArrangementService only
- ✅ **DTO Pattern** - All data transfer through DTOs
- ✅ **Simple API** - Only strings, numbers, plain objects
- ✅ **Domain Isolation** - No domain types exposed
- ✅ **Dependency Injection** - Proper DI container setup

### 🔄 **Event Sourcing Foundation**
- ✅ **Complete Track Aggregate** with pure event-driven state changes
- ✅ **Separated Domain Events** into dedicated files
- ✅ **EventStore Interface** with optimistic concurrency control
- ✅ **InMemoryEventStore** with snapshot support and versioning
- ✅ **Standardized Error Handling** with `DomainError` throughout

### 🎵 **Music Features**
- ✅ **Track Management** - Create, query, delete tracks
- ✅ **Clip Operations** - Audio and MIDI clip management
- ✅ **MIDI Operations** - Note addition, quantization, transposition
- ✅ **Time Management** - Precise timing with TimeRangeVO

## 🚧 **Planned Features (Future Phases)**

### Phase 2: Essential Features
- 🔄 **UndoRedoService** - Complete undo/redo with command tracking
- 🗄️ **EventSourcedRepository** - Persistent event storage
- 🎯 **Enhanced Command Pattern** - Command handling with context
- 📝 **Query Optimization** - Efficient data retrieval patterns

### Phase 3: Integration & Polish
- 🔊 **Real Audio Engine** - Web Audio API integration
- 🌐 **Real Collaboration** - WebSocket and operational transformation
- 📡 **Production Event Bus** - Reliable event distribution
- 🎛️ **Professional Audio Engine** - Advanced audio processing

### Phase 4: Advanced Features
- 🎚️ **Audio Effects** - Real-time audio processing
- 🎹 **MIDI Controllers** - Hardware integration
- ☁️ **Cloud Sync** - Multi-device synchronization
- 🤖 **AI Features** - Smart composition assistance

## 📊 **Architecture Benefits**

### ✅ **Clean Architecture Compliance**
- **Dependency Rule Enforced** ✅ - 用戶只能訪問Application Layer
- **Domain Layer Isolation** ✅ - Domain objects不直接暴露給用戶
- **Infrastructure Abstraction** ✅ - Infrastructure細節完全隱藏
- **DTO Pattern** ✅ - 使用DTOs進行數據傳輸，不暴露domain objects

### ✅ **Event Sourcing Ready**
- Complete audit trail of all changes
- Time-travel debugging capabilities
- Foundation for undo/redo functionality
- Replay events for testing and debugging

### ✅ **Domain-Driven Design**
- Clear bounded context boundaries
- Rich domain model with business logic
- Separation of concerns across layers
- Type-safe operations throughout

### ✅ **Production Quality**
- Comprehensive error handling
- Optimistic concurrency control
- Memory-efficient event storage
- Performance-optimized operations

## 🧪 **Testing**

```bash
# Run unit tests
npm test src/modules/music-arrangement

# Run integration tests  
npm test:integration src/modules/music-arrangement

# Run event sourcing tests
npm test src/modules/music-arrangement/domain/aggregates
```

## 📚 **Dependencies**

- **`@core`** - Core framework classes and interfaces
- **`inversify`** - Dependency injection container
- **TypeScript** - Type safety and modern JavaScript
- **Tone.js** - Audio processing (future integration)
- **Web MIDI API** - MIDI hardware support (future)
- **WebRTC** - Real-time collaboration (future)

## 🔮 **Future Roadmap**

### Phase 2: Essential Features (Next)
1. **UndoRedoService** - Complete undo/redo with command tracking
2. **EventSourcedRepository** - Persistent event storage
3. **Command Pattern** - Enhanced command handling with context
4. **Query Optimization** - Efficient data retrieval patterns

### Phase 3: Integration & Polish
1. **Real Audio Engine** - Web Audio API integration
2. **MIDI Hardware** - Web MIDI API support  
3. **Collaboration** - Real-time operational transformation
4. **Performance** - Audio buffer optimization

### Phase 4: Advanced Features
1. **Audio Effects** - Real-time audio processing
2. **MIDI Controllers** - Hardware integration
3. **Cloud Sync** - Multi-device synchronization
4. **AI Features** - Smart composition assistance

## 📋 **Design Validation**

### ✅ **Clean Architecture Compliance**
- **Dependency Rule Enforced** ✅ - 用戶只能訪問Application Layer
- **Domain Layer Isolation** ✅ - Domain objects不直接暴露給用戶
- **Infrastructure Abstraction** ✅ - Infrastructure細節完全隱藏
- **DTO Pattern** ✅ - 使用DTOs進行數據傳輸，不暴露domain objects

### ✅ **Event Sourcing Compliance**
- Pure event-driven state changes ✅
- Complete event replay capability ✅  
- Optimistic concurrency control ✅
- Snapshot support for performance ✅

### ✅ **DDD Best Practices**
- Rich domain model with business logic ✅
- Clear aggregate boundaries ✅
- Proper entity vs value object usage ✅
- Repository pattern for aggregates only ✅
- Application Services as use case coordinators ✅

### ✅ **API Design Principles**
- **Single Entry Point** ✅ - MusicArrangementService作為唯一API
- **Simple Data Types** ✅ - 使用strings, numbers, plain objects
- **No Domain Leakage** ✅ - 不暴露domain types給用戶
- **Consistent Error Handling** ✅ - 統一的錯誤碼和訊息格式

---

**Status**: Phase 1 Complete ✅ | **Architecture**: Clean Architecture Compliant ✅ | **Next**: Phase 2 Implementation 🚧

*This README reflects the actual implementation state after Clean Architecture compliance fixes. The module now properly isolates domain logic and provides a clean, simple API for users.* 