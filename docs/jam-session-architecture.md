# JamSession Bounded Context - Architecture Documentation

## Overview

The JamSession Bounded Context (BC) manages the life cycle and workflow of jam sessions within collaboration rooms. It transforms peers within a room into players with specific roles, manages player readiness, controls round timing, and drives UI behaviors across frontend and other BCs through `jam.*` Integration Events.

JamSession BC relies on and extends the functionality provided by the Collaboration BC, which manages the underlying room and peer connections.

## Core Responsibilities

1. **Jam Session Lifecycle Management**
   - Create and end jam sessions within existing Collaboration rooms
   - Maintain session state and transitions

2. **Player Management**
   - Transform Collaboration BC's Peers into Players with roles
   - Assign and manage player roles
   - Track player readiness states

3. **Round Timing Control**
   - Start and manage the overall jam session
   - Control the timing of individual rounds
   - Ensure synchronization across all clients

4. **Event Broadcasting**
   - Publish `jam.*` Integration Events for cross-module/cross-client synchronization
   - Subscribe to relevant `collab.*` events to maintain consistency

5. **High Availability Design**
   - Support reconnection scenarios
   - Handle disconnection with graceful degradation
   - Base recovery on the persistence of the underlying Room

## Frontend/Backend Responsibility Split

### Frontend (Client)

**Presentation Layer**
- SessionPage with components:
  - RoleSelector
  - ReadyButton
  - CountdownTimer
  - RoundDisplay
- SignalHubAdapter: subscribes to 'collab.*' and 'jam.*' events

**Application Layer**
- CommandHandlers for user interactions:
  - CreateJamSessionInRoom
  - JoinJamSessionAsPlayer
  - SetPlayerRole
  - TogglePlayerReady
  - StartJamSession
  - StartNextRound
  - EndCurrentRound
- SessionAppService for state management
- IntegrationBridge to publish/subscribe to events

**Domain Layer**
- Session Aggregate
- PlayerState Entity
- Value Objects: RoleVO, RoundVO
- Domain Events: PlayerRoleSet, SessionStarted, RoundStarted, etc.

**Infrastructure Layer**
- SignalHubAdapter for WebSocket communication
- WebRTCAdapter for audio data transmission
- TimerAdapter and HealthMonitorAdapter
- LocalCacheAdapter for state persistence

### Backend (Server)

**Presentation Layer**
- WebSocketGateway for real-time communication
- REST Controller for CRUD operations on sessions

**Application Layer**
- CommandHandlers corresponding to client commands
- SessionService (may interact with CollaborationService)
- EventBusAdapter for event distribution

**Domain Layer**
- Same model as Frontend for behavioral consistency
- Domain Events aligned with Frontend
- Domain Services and Specifications:
  - AllPlayersReadySpec
  - CountdownService

**Infrastructure Layer**
- WebSocketAdapter for real-time communication
- EventBusAdapter for Kafka/Redis integration
- WebSocketBridge to convert events to WebSocket messages
- SessionRepository for data access
- TimerScheduler for timed events

## Domain Model

### Session Aggregate

**Core of the JamSession BC**
- Properties:
  - sessionId: unique identifier
  - roomId: reference to Collaboration BC's Room
  - status: pending | inProgress | ended
  - players: Map<peerId, PlayerState>
  - currentRoundNumber: number
  - rounds: RoundVO[]
- Invariants:
  - Session status transitions must follow defined flow
  - Session cannot start without at least one player
  - Session lifecycle is tied to the underlying Room

### PlayerState Entity

**Represents a peer's state within a JamSession**
- Properties:
  - peerId: reference to Collaboration BC's Peer
  - role?: RoleVO
  - isReady: boolean
  - joinedAt: Timestamp
- Behaviors:
  - setRole(role)
  - setReady(isReady)
- Invariants:
  - Role can only be changed in pending state
  - Player must have a role to be marked as ready

### Value Objects

**RoleVO**
- Properties:
  - id: string
  - name: string
  - color: string
- Invariants:
  - Specific limited roles (e.g., drummer) can only be held by one player

**RoundVO**
- Properties:
  - roundNumber: number
  - startedAt: Timestamp
  - durationSeconds: number
  - endedAt?: Timestamp
- Behaviors:
  - isOver()
- Invariants:
  - When completed, startedAt < endedAt

## Event System

### Domain Events (Internal to JamSession BC)

**Player-specific Events**
- PlayerRoleSet(sessionId, peerId, role: RoleVO)
- PlayerReadyToggled(sessionId, peerId, isReady: boolean)

**Session-level Events**
- JamSessionCreated(sessionId, roomId, initiatorPeerId)
- JamSessionStarted(sessionId, startTime, initialPlayers[])
- JamSessionEnded(sessionId, endTime)

**Round-level Events**
- NextRoundStarted(sessionId, roundNumber, startTime, durationSeconds)
- CurrentRoundEnded(sessionId, roundNumber, endTime)

**Special Events**
- PlayerUnavailableInSession(sessionId, peerId)

### Integration Events (Cross-BC Communication)

| Integration Event | Domain Event Source | Consumers | Description |
|-------------------|---------------------|-----------|-------------|
| jam.session-created | JamSessionCreated | UI, other BCs | New session ready in a room |
| jam.player-role-set | PlayerRoleSet | UI, CollaborationBridge | Player role assignment |
| jam.player-ready | PlayerReadyToggled | UI, CollaborationBridge | Player readiness toggle |
| jam.session-started | JamSessionStarted | UI, MusicArrangement BC | Session formally started |
| jam.round-started | NextRoundStarted | UI, MusicArrangement BC | New round begins |
| jam.round-ended | CurrentRoundEnded | UI, MusicArrangement BC | Current round ends |
| jam.session-ended | JamSessionEnded | UI, CollaborationBridge, MusicArrangement BC | Session ends |
| jam.player-left-session | PlayerUnavailableInSession | UI | Player no longer in session |

## Integration Layer Design

### Backend Integration

**EventBusAdapter**
- publish(topic, event) → Kafka/Redis
- subscribe(topic, handler) for collab.* events

**WebSocketBridge**
- Subscribes to jam.* topics
- Broadcasts to specific rooms

**Event Publishing Flow**
1. CommandHandler → Domain (Session Aggregate) → collectDomainEvents()
2. EventBusAdapter.publish(jam.* prefixed topic, payload)
3. WebSocketBridge → consumeEvent() → gateway.broadcastToRoom()

**Event Subscription Flow (for collab.* events)**
1. SessionService subscribes to relevant collab.* events
2. On event receipt, finds affected Sessions
3. Updates Session state, potentially triggering jam.* events

### Frontend Integration

**OutboundPublisher**
- sessionAppService.sendCommand() → SignalHubAdapter.send()

**IntegrationBridge**
- SignalHubAdapter.on('jam.*', handler)
- SignalHubAdapter.on('collab.*', handler)

**UI Command Flow**
1. UI action → SessionAppService.dispatchCommand()
2. Command serialized and sent via SignalHubAdapter
3. Backend processes and broadcasts changes
4. All clients receive updates via jam.* events

## End-to-End Message Sequence

Using the StartNextRound command as an example:

1. Host frontend sends "jam.start-next-round" to backend
2. Backend processes command in StartNextRoundCmdHandler
3. Session Aggregate produces NextRoundStarted domain event
4. Backend schedules round end timer
5. Backend publishes jam.round-started integration event
6. WebSocketGateway broadcasts to all room clients
7. All clients update UI to show round started
8. TimerScheduler sends countdown ticks directly via WebSocket
9. When round time expires, backend triggers round end
10. Backend publishes jam.round-ended integration event
11. All clients update UI to show round ended

## Directory Structure

### Backend (JamSession BC)

```
jam-session-bc/
├─ presentation/
│   ├─ JamSessionController.ts
│   └─ JamWebSocketGatewayHandlers.ts
├─ application/
│   ├─ commands/
│   │   ├─ CreateJamSessionCommand.ts
│   │   ├─ SetPlayerRoleCommand.ts
│   │   └─ StartNextRoundCommand.ts
│   ├─ handlers/
│   │   ├─ CreateJamSessionHandler.ts
│   │   ├─ SetPlayerRoleHandler.ts
│   │   └─ StartNextRoundHandler.ts
│   ├─ event-handlers/
│   │   └─ PeerLeftRoomHandler.ts
│   └─ SessionService.ts
├─ domain/
│   ├─ aggregates/
│   │   └─ Session.ts
│   ├─ entities/
│   │   └─ PlayerState.ts
│   ├─ value-objects/
│   │   ├─ RoleVO.ts
│   │   └─ RoundVO.ts
│   ├─ events/
│   │   └─ jam-session-events.ts
│   ├─ specs/
│   │   └─ AllPlayersReadySpec.ts
│   └─ services/
│       └─ CountdownService.ts
└─ infrastructure/
    ├─ persistence/
    │   ├─ SessionRepository.ts
    │   └─ InMemorySessionRepository.ts
    ├─ messaging/
    │   ├─ JamEventBusAdapter.ts
    │   └─ JamWebSocketBridge.ts
    └─ timing/
        └─ JamTimerScheduler.ts
```

### Frontend (JamSession Client)

```
jam-session-client/
├─ presentation/
│   ├─ SessionPage.tsx
│   ├─ RoleSelector.tsx
│   ├─ ReadyButton.tsx
│   ├─ CountdownTimer.tsx
│   └─ RoundDisplay.tsx
├─ application/
│   ├─ commands/
│   ├─ SessionAppService.ts
│   └─ JamIntegrationBridge.ts
└─ infrastructure/
    └─ JamSignalHubAdapter.ts
```

## Key Design Principles

1. **Single Source of Truth**: Backend JamSession BC maintains authoritative state
2. **Clear Dependencies**: JamSession BC explicitly depends on Collaboration BC
3. **Broadcast Only When Necessary**: Only publish integration events for cross-module/client synchronization
4. **Idempotence and Deduplication**: All events include eventId and timestamp for deduplication
5. **Recoverability**: Frontend can restore state after reconnection via REST API

## Development Guidelines

1. Maintain strict bounded context boundaries
2. Ensure domain events reflect business significance, not technical operations
3. Use value objects for immutable concepts
4. Validate invariants in the domain layer
5. Keep presentation logic separate from domain logic
6. Design for resilience with reconnection strategies
7. Implement proper error handling for edge cases
8. Optimize for real-time synchronization performance
9. Follow consistent naming conventions across all layers
10. Document all public interfaces and events 