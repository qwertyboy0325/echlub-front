# JamSession Bounded Context

## 📖 Overview

The JamSession Bounded Context (BC) manages the lifecycle and workflow of collaborative music jam sessions within EchLub. It transforms peers within a collaboration room into players with specific roles, manages player readiness, controls round timing, and drives UI behaviors across frontend and other BCs through `jam.*` Integration Events.

### Key Features

- 🎵 **Session Lifecycle Management** - Create, start, and end jam sessions
- 👥 **Player Role Management** - Assign instruments and roles to participants  
- ⏱️ **Round Timing Control** - Structured timing for jam rounds
- 🔄 **Real-time Synchronization** - Cross-client state synchronization
- 🎯 **Event-Driven Architecture** - Comprehensive event system
- 🔗 **Cross-BC Integration** - Seamless integration with Collaboration BC

## 🏗️ Architecture

### Domain-Driven Design (DDD)

The module follows DDD principles with clear bounded contexts:

```
jam-session/
├── domain/           # Core business logic
│   ├── aggregates/   # Session, Round
│   ├── entities/     # PlayerState
│   ├── value-objects/# SessionId, RoleVO, RoundVO
│   └── events/       # Domain events
├── application/      # Use cases and orchestration
│   ├── commands/     # CQRS commands
│   ├── handlers/     # Command handlers
│   └── services/     # Application services
├── infrastructure/   # External concerns
│   ├── repositories/ # Data persistence
│   ├── messaging/    # Event bus
│   └── timing/       # Timer scheduling
└── integration/      # Cross-BC communication
    ├── events/       # Integration events
    └── handlers/     # External event handlers
```

### Core Domain Model

```typescript
// Session Aggregate - Root of the jam session
class Session {
  private _sessionId: SessionId;
  private _roomId: RoomId;        // From Collaboration BC
  private _status: SessionStatus; // pending | inProgress | ended
  private _players: Map<string, PlayerState>;
  private _currentRoundNumber: number;
  private _rounds: RoundVO[];
}

// Player State Entity
class PlayerState {
  private _peerId: PeerId;        // From Collaboration BC
  private _role: RoleVO | null;   // Instrument role
  private _isReady: boolean;      // Ready for session
  private _joinedAt: Date;
}
```

## 🚀 Quick Start

### 1. Basic Session Creation

```typescript
import { JamSessionService } from './application/services/JamSessionAppService';
import { CreateJamSessionCommand } from './application/commands';

// Create a new jam session in an existing room
const jamService = container.get<JamSessionService>(JamSessionTypes.JamSessionService);

const sessionId = await jamService.createSession(
  new CreateJamSessionCommand(
    'room-123',           // Existing collaboration room ID
    'peer-456'            // Initiator peer ID
  )
);

console.log(`Jam session created: ${sessionId}`);
```

### 2. Player Management

```typescript
// Join the session as a player
await jamService.joinSession(
  new JoinJamSessionCommand(sessionId.toString(), 'peer-789')
);

// Set player role
await jamService.setPlayerRole(
  new SetPlayerRoleCommand(
    sessionId.toString(),
    'peer-789',
    'drummer'             // Available roles: drummer, guitarist, bassist, vocalist
  )
);

// Mark player as ready
await jamService.setPlayerReady(
  new TogglePlayerReadyCommand(
    sessionId.toString(),
    'peer-789',
    true
  )
);
```

### 3. Session Flow Control

```typescript
// Start the jam session (when all players are ready)
await jamService.startSession(
  new StartJamSessionCommand(sessionId.toString(), 'peer-456')
);

// Start a new round
await jamService.startNextRound(
  new StartNextRoundCommand(
    sessionId.toString(),
    60  // Duration in seconds
  )
);

// End current round
await jamService.endCurrentRound(
  new EndCurrentRoundCommand(sessionId.toString())
);

// End the entire session
await jamService.endSession(
  new EndJamSessionCommand(sessionId.toString(), 'peer-456')
);
```

## 📡 Event System

### Domain Events (Internal)

```typescript
// Player events
PlayerRoleSet(sessionId, peerId, role)
PlayerReadyToggled(sessionId, peerId, isReady)

// Session events  
JamSessionCreated(sessionId, roomId, initiatorPeerId)
JamSessionStarted(sessionId, startTime, players)
JamSessionEnded(sessionId, endTime)

// Round events
NextRoundStarted(sessionId, roundNumber, startTime, duration)
CurrentRoundEnded(sessionId, roundNumber, endTime)
```

### Integration Events (Cross-BC)

```typescript
// Published to other modules and clients
'jam.session-created'     // New session available
'jam.player-role-set'     // Player role assignment
'jam.player-ready'        // Player readiness toggle
'jam.session-started'     // Session formally started
'jam.round-started'       // New round begins
'jam.round-ended'         // Current round ends
'jam.session-ended'       // Session ends
'jam.player-left-session' // Player unavailable
```

### Event Subscription Example

```typescript
import { EventBus } from '@core/event-bus';

// Subscribe to jam session events
eventBus.subscribe('jam.session-started', (event) => {
  console.log(`Session ${event.sessionId} started with ${event.initialPlayers.length} players`);
});

eventBus.subscribe('jam.round-started', (event) => {
  console.log(`Round ${event.roundNumber} started, duration: ${event.durationSeconds}s`);
});
```

## 🎮 Frontend Integration

### React Component Example

```tsx
import React from 'react';
import { useJamSession } from './hooks/useJamSession';

const JamSessionComponent: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { 
    currentSession, 
    createSession, 
    setRole, 
    setReady, 
    startSession 
  } = useJamSession();

  if (!currentSession) {
    return (
      <button onClick={() => createSession(roomId)}>
        Create Jam Session
      </button>
    );
  }

  return (
    <div className="jam-session">
      <h3>Jam Session - {currentSession.status}</h3>
      
      {/* Role Selection */}
      <RoleSelector 
        session={currentSession}
        onRoleSelect={(roleId) => setRole(currentSession.sessionId, roleId)}
      />
      
      {/* Ready Button */}
      <ReadyButton
        session={currentSession}
        onToggleReady={(isReady) => setReady(currentSession.sessionId, isReady)}
      />
      
      {/* Session Controls */}
      {currentSession.status === 'pending' && (
        <button onClick={() => startSession(currentSession.sessionId)}>
          Start Jam Session
        </button>
      )}
      
      {/* Round Display */}
      {currentSession.status === 'inProgress' && (
        <RoundDisplay session={currentSession} />
      )}
    </div>
  );
};
```

### Custom Hook Example

```typescript
import { useState, useEffect } from 'react';
import { useEventBus } from '@core/event-bus';

export function useJamSession() {
  const [currentSession, setCurrentSession] = useState<SessionDto | null>(null);
  const eventBus = useEventBus();

  useEffect(() => {
    // Subscribe to session events
    const unsubscribes = [
      eventBus.subscribe('jam.session-created', handleSessionCreated),
      eventBus.subscribe('jam.session-started', handleSessionStarted),
      eventBus.subscribe('jam.player-role-set', handlePlayerRoleSet),
      eventBus.subscribe('jam.round-started', handleRoundStarted),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const createSession = async (roomId: string) => {
    // Implementation
  };

  const setRole = async (sessionId: string, roleId: string) => {
    // Implementation  
  };

  return {
    currentSession,
    createSession,
    setRole,
    setReady,
    startSession
  };
}
```

## 🔧 Configuration

### Dependency Injection Setup

```typescript
import { Container } from 'inversify';
import { JamSessionModule } from './di/JamSessionModule';

// Register the jam session module
const container = new Container();
container.load(JamSessionModule);

// Get services
const jamService = container.get<JamSessionService>(JamSessionTypes.JamSessionService);
const eventBus = container.get<EventBus>(JamSessionTypes.EventBus);
```

### Available Roles Configuration

```typescript
// Default roles provided by RoleRegistry
const availableRoles = [
  { id: 'drummer', name: 'Drummer', color: '#FF6B6B', isUnique: true },
  { id: 'guitarist', name: 'Guitarist', color: '#4ECDC4', isUnique: false },
  { id: 'bassist', name: 'Bassist', color: '#45B7D1', isUnique: true },
  { id: 'vocalist', name: 'Vocalist', color: '#96CEB4', isUnique: false },
  { id: 'keyboardist', name: 'Keyboardist', color: '#FFEAA7', isUnique: true }
];
```

## 🧪 Testing

### Unit Test Example

```typescript
describe('Session Aggregate', () => {
  test('should create a new session', () => {
    const sessionId = SessionId.generate();
    const roomId = RoomId.fromString('room-1');
    const ownerId = PeerId.fromString('peer-1');
    
    const session = Session.create(sessionId, roomId, ownerId);
    
    expect(session.sessionId).toBe(sessionId);
    expect(session.status).toBe(SessionStatus.PENDING);
    
    const events = session.collectDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(JamSessionCreated);
  });
});
```

### Integration Test Example

```typescript
describe('JamSession Integration', () => {
  test('complete jam session flow', async () => {
    // Create session
    const sessionId = await jamService.createSession(
      new CreateJamSessionCommand('room-1', 'peer-1')
    );
    
    // Add players and set roles
    await jamService.joinSession(
      new JoinJamSessionCommand(sessionId.toString(), 'peer-2')
    );
    
    await jamService.setPlayerRole(
      new SetPlayerRoleCommand(sessionId.toString(), 'peer-1', 'drummer')
    );
    
    // Mark ready and start
    await jamService.setPlayerReady(
      new TogglePlayerReadyCommand(sessionId.toString(), 'peer-1', true)
    );
    
    await jamService.startSession(
      new StartJamSessionCommand(sessionId.toString(), 'peer-1')
    );
    
    // Verify session state
    const session = await jamService.getSessionById(sessionId);
    expect(session?.status).toBe('inProgress');
  });
});
```

## 🔗 Integration with Collaboration BC

The JamSession BC depends on and extends the Collaboration BC:

```typescript
// Listens to collaboration events
eventBus.subscribe('collab.peer-left-room', async (event) => {
  // Find affected sessions and mark player as unavailable
  const session = await sessionRepository.findByRoomId(event.roomId);
  if (session) {
    session.markPlayerAsUnavailable(event.peerId);
    await sessionRepository.save(session);
  }
});

// Validates room existence before creating sessions
const roomExists = await collaborationService.roomExists(roomId);
if (!roomExists) {
  throw new Error('Cannot create session: Room does not exist');
}
```

## 📊 Performance Considerations

- **Event Batching**: Non-critical events are batched for efficiency
- **State Caching**: Active sessions are cached in memory
- **WebSocket Optimization**: Critical messages (timing) are prioritized
- **Database Indexing**: Sessions indexed by roomId and peerId

## 🔒 Security & Validation

- **Authorization**: Peer must be in room to join session
- **Input Validation**: All commands validated before processing
- **Rate Limiting**: Commands rate-limited to prevent abuse
- **State Validation**: Business invariants enforced in domain layer

## 🚀 Future Enhancements

- **Session Recording**: Record and playback jam sessions
- **Advanced Roles**: Custom role definitions and templates
- **Dynamic Rounds**: Adaptive round duration based on activity
- **Performance Metrics**: Track participation and jam quality

## 📚 Related Documentation

- [Architecture Documentation](./docs/jam-session-architecture.md)
- [Core Types Reference](./docs/jam-session-core-types.md)
- [Implementation Guide](./docs/jam-session-implementation-guide.md)
- [Integration Guide](./docs/jam-session-integration.md)

## 🤝 Contributing

1. Follow DDD principles and maintain bounded context boundaries
2. Ensure all domain events reflect business significance
3. Write comprehensive tests for new features
4. Update documentation for API changes
5. Follow the established naming conventions

## 📄 License

This module is part of the EchLub project and follows the same licensing terms. 