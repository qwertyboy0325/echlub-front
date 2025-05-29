# 🎵 EchLub Frontend

A modern, modular music collaboration platform built with **Clean Architecture** principles, featuring real-time collaboration, advanced music arrangement capabilities, and comprehensive bounded context separation.

## 🚧 Development Status

**⚠️ UI Layer In Development**: The user interface layer is currently under active development. The core business logic modules are complete and fully tested.

## 🏗️ Architecture Overview

This project implements a **Domain-Driven Design (DDD)** approach with **Clean Architecture**, featuring:

- **🎯 Bounded Contexts**: Each domain is isolated in its own module
- **📦 Dependency Injection**: Full IoC container implementation with Inversify
- **🔄 Event Sourcing**: Complete audit trail with event replay capabilities
- **⚡ CQRS Pattern**: Command/Query separation for optimal performance
- **🎮 Command Pattern**: All operations executed through mediators
- **🔙 Undo/Redo System**: User-scoped operation history with batch operations

## 📋 Core Modules

### 🎼 Music Arrangement BC
**Location**: `src/modules/music-arrangement/`

The heart of the music creation system, providing comprehensive Digital Audio Workstation (DAW) functionality.

**Key Features**:
- ✅ **Complete Event Sourcing** - All operations recorded as events
- ✅ **Undo/Redo System** - User-scoped with batch operations
- ✅ **Tone.js Integration** - Full audio engine with MIDI playback
- ✅ **Real-time Collaboration** - WebRTC audio buffer processing
- ✅ **Track Management** - Audio, MIDI, and Bus tracks
- ✅ **Clip System** - Audio and MIDI clips with time-based operations
- ✅ **MIDI Processing** - Note editing, quantization, transposition
- ✅ **Audio Engine** - Professional audio routing and effects

**Architecture**:
```
├── application/          # Use cases and services
│   ├── commands/        # Command definitions
│   ├── handlers/        # Command/Query handlers
│   ├── services/        # Application services
│   └── mediator/        # CQRS mediator
├── domain/              # Core business logic
│   ├── aggregates/      # Track aggregate
│   ├── entities/        # Clips, MIDI notes
│   ├── events/          # Domain events
│   └── value-objects/   # Time ranges, IDs, metadata
├── infrastructure/      # External concerns
│   ├── audio/          # Tone.js integration
│   ├── events/         # Event store implementation
│   └── repositories/   # Data persistence
└── integration/         # Cross-module adapters
```

### 🤝 Collaboration BC
**Location**: `src/modules/collaboration/`

Real-time multi-user collaboration system with WebRTC peer-to-peer connections.

**Key Features**:
- ✅ **Room Management** - Create, join, leave rooms
- ✅ **WebRTC Signaling** - P2P connection establishment
- ✅ **Real-time Sync** - Audio buffer sharing
- ✅ **Connection Resilience** - Automatic reconnection
- ✅ **User Management** - Peer discovery and state sync

### 🎯 Jam Session BC
**Location**: `src/modules/jam-session/`

Structured music collaboration with rounds, roles, and session management.

**Key Features**:
- ✅ **Session Lifecycle** - Create, start, end sessions
- ✅ **Round Management** - Timed collaboration rounds
- ✅ **Role Assignment** - Player roles and responsibilities
- ✅ **State Synchronization** - Real-time session state

### 👤 Identity BC
**Location**: `src/modules/identity/`

User authentication and profile management.

**Key Features**:
- ✅ **User Registration/Login** - Secure authentication
- ✅ **Profile Management** - User data and preferences
- ✅ **Password Management** - Secure password operations

### 🎚️ Track BC
**Location**: `src/modules/track/`

Track-specific operations and metadata management.

**Key Features**:
- ✅ **Track Types** - Audio, Instrument, Bus tracks
- ✅ **Plugin Management** - Audio effects and instruments
- ✅ **Routing System** - Audio signal routing
- ✅ **Clip Management** - Track-clip relationships

## 🛠️ Technology Stack

### Core Technologies
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React** - UI framework (in development)
- **Tone.js** - Web Audio API abstraction

### Architecture & Patterns
- **Inversify** - Dependency injection container
- **Jest** - Testing framework with 65%+ coverage
- **ESLint** - Code quality and consistency
- **Clean Architecture** - Layered architecture pattern

### Audio & Collaboration
- **WebRTC** - Peer-to-peer communication
- **Web Audio API** - Low-level audio processing
- **Socket.io** - Real-time signaling (planned)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd echlub-front

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:ci         # CI-optimized tests

# Full CI Pipeline
npm run ci              # Type check + lint + test + build
```

## 📊 Test Coverage

Current test coverage: **65%+** across all modules

- **Music Arrangement BC**: Comprehensive unit and integration tests
- **Collaboration BC**: E2E collaboration flow tests
- **Jam Session BC**: Session lifecycle and state management tests
- **Identity BC**: Authentication and user management tests
- **Track BC**: Track operations and plugin management tests

## 🏛️ Clean Architecture Principles

### Dependency Rule
Dependencies point inward only:
```
UI Layer → Application Layer → Domain Layer
Infrastructure Layer → Application Layer
```

### Layer Responsibilities

**Domain Layer** (Core Business Logic)
- Entities, Value Objects, Aggregates
- Domain Events and Business Rules
- No external dependencies

**Application Layer** (Use Cases)
- Commands, Queries, Handlers
- Application Services and DTOs
- Orchestrates domain operations

**Infrastructure Layer** (External Concerns)
- Database, File System, Web APIs
- Framework-specific implementations
- Adapters for external services

**UI Layer** (Presentation) - *In Development*
- React components and hooks
- State management
- User interaction handling

## 🔧 Module Integration

Each bounded context exposes a clean interface through:

1. **Service Layer** - Main entry point for external access
2. **DTOs** - Data transfer objects for cross-boundary communication
3. **Event Bus** - Domain event publishing/subscribing
4. **Dependency Injection** - Proper IoC container setup

Example integration:
```typescript
// Get music arrangement service
const musicService = container.get<MusicArrangementService>(
  MusicArrangementTypes.MusicArrangementService
);

// Create a track
const trackId = await musicService.createTrack({
  ownerId: 'user123',
  type: 'instrument',
  name: 'Piano Track'
});
```

## 🎯 Roadmap

### Phase 1: Core Architecture ✅
- [x] Bounded context separation
- [x] Clean architecture implementation
- [x] Event sourcing system
- [x] Dependency injection setup

### Phase 2: Music Engine ✅
- [x] Music Arrangement BC
- [x] Audio engine integration
- [x] MIDI processing
- [x] Undo/redo system

### Phase 3: Collaboration ✅
- [x] Real-time collaboration
- [x] WebRTC integration
- [x] Session management
- [x] User management

### Phase 4: UI Development 🚧
- [ ] React component library
- [ ] DAW interface
- [ ] Collaboration UI
- [ ] User management interface

### Phase 5: Advanced Features 📋
- [ ] Plugin system
- [ ] Advanced audio effects
- [ ] Cloud synchronization
- [ ] Mobile support

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Maintain bounded context isolation
3. Write comprehensive tests
4. Use TypeScript strictly
5. Follow existing code patterns

## 📄 License

[License information to be added]

## 🔗 Related Documentation

- [Music Arrangement BC Documentation](src/modules/music-arrangement/README.md)
- [Collaboration BC Documentation](src/modules/collaboration/README.md)
- [Architecture Decision Records](docs/)
- [API Documentation](docs/api/)

---

**Built with ❤️ using Clean Architecture and Domain-Driven Design**
