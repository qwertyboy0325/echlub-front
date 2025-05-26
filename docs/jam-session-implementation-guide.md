# JamSession Implementation Guide

This document provides practical guidance for implementing the JamSession Bounded Context, focusing on key implementation details and development recommendations.

## Implementation Approach

We recommend implementing the JamSession BC in phases:

1. **Core Domain Model** - Implement Session aggregate, PlayerState entity, and value objects
2. **Backend Services** - Implement repositories, services, and command handlers
3. **Integration Layer** - Implement event subscription and publication
4. **Frontend Components** - Implement UI components and state management
5. **End-to-End Testing** - Verify the entire flow works correctly

## Backend Implementation

### 1. Session Aggregate Implementation

The Session aggregate is the heart of the JamSession BC. Implement it with proper encapsulation and invariant enforcement:

```typescript
// Example implementation structure
export class Session {
  // Private properties
  private readonly _sessionId: SessionId;
  private readonly _roomId: RoomId;
  private _status: SessionStatus;
  private _players: Map<string, PlayerState>;
  private _currentRoundNumber: number;
  private _rounds: RoundVO[];
  private _domainEvents: DomainEvent[] = [];
  
  // Constructor is private - use factory methods
  private constructor(sessionId: SessionId, roomId: RoomId) {
    // Initialize properties
  }
  
  // Factory method with clear intent
  public static create(
    sessionId: SessionId, 
    roomId: RoomId, 
    initiatorPeerId: PeerId
  ): Session {
    const session = new Session(sessionId, roomId);
    
    // Record domain event for tracking
    session._domainEvents.push(
      new JamSessionCreated(sessionId.toString(), roomId.toString(), initiatorPeerId.toString())
    );
    
    return session;
  }
  
  // Public methods with domain language
  public addPlayer(peerId: PeerId, username: string): void {
    // Validate preconditions
    if (this._status !== SessionStatus.PENDING) {
      throw new Error('Players can only be added when session is pending');
    }
    
    // Business logic
    const playerState = PlayerState.create(peerId, new Date());
    this._players.set(peerId.toString(), playerState);
  }
  
  // More methods...
  
  // Domain event collection
  public collectDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
  
  // Getters provide controlled read access
  get sessionId(): SessionId { return this._sessionId; }
  get roomId(): RoomId { return this._roomId; }
  // More getters...
}
```

Key implementation considerations:
- Use private properties and controlled access via getters
- Make constructors private and provide factory methods
- Validate invariants before state changes
- Collect domain events rather than directly publishing them
- Use descriptive method names that reflect domain language

### 2. Repository Implementation

Implement the SessionRepository interface with both in-memory and persistent storage options:

```typescript
// In-memory implementation for testing and development
export class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, Session> = new Map();
  
  async findById(sessionId: SessionId): Promise<Session | null> {
    const session = this.sessions.get(sessionId.toString());
    return session || null;
  }
  
  async findByRoomId(roomId: RoomId): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.roomId.equals(roomId)) {
        return session;
      }
    }
    return null;
  }
  
  async save(session: Session): Promise<void> {
    this.sessions.set(session.sessionId.toString(), session);
  }
  
  async delete(sessionId: SessionId): Promise<void> {
    this.sessions.delete(sessionId.toString());
  }
}

// MongoDB implementation example
export class MongoSessionRepository implements ISessionRepository {
  constructor(private db: Db) {}
  
  private get collection(): Collection {
    return this.db.collection('sessions');
  }
  
  async findById(sessionId: SessionId): Promise<Session | null> {
    const doc = await this.collection.findOne({ sessionId: sessionId.toString() });
    return doc ? this.documentToSession(doc) : null;
  }
  
  async save(session: Session): Promise<void> {
    await this.collection.updateOne(
      { sessionId: session.sessionId.toString() },
      { $set: this.sessionToDocument(session) },
      { upsert: true }
    );
  }
  
  // Helper methods for document mapping
  private sessionToDocument(session: Session): any {
    // Transform domain object to database document
  }
  
  private documentToSession(doc: any): Session {
    // Transform database document to domain object
  }
}
```

Key implementation considerations:
- Support both transient (in-memory) and persistent storage options
- Implement clear mapping between domain objects and storage format
- Handle serialization of value objects appropriately
- Consider indexing for performance (e.g., index on roomId)

### 3. Application Service and Command Handlers

Implement the application service and command handlers to orchestrate domain operations:

```typescript
// Session service implementation
export class JamSessionService implements IJamSessionService {
  constructor(
    private sessionRepository: ISessionRepository,
    private collaborationService: ICollaborationService,
    private eventBus: IEventBus
  ) {}
  
  async createSession(command: CreateJamSessionCommand): Promise<SessionId> {
    // Verify room exists
    const roomExists = await this.collaborationService.roomExists(
      RoomId.fromString(command.roomId)
    );
    
    if (!roomExists) {
      throw new Error('Cannot create session: Room does not exist');
    }
    
    // Create session
    const sessionId = SessionId.generate();
    const session = Session.create(
      sessionId,
      RoomId.fromString(command.roomId),
      PeerId.fromString(command.initiatorPeerId)
    );
    
    // Save session
    await this.sessionRepository.save(session);
    
    // Publish domain events
    for (const event of session.collectDomainEvents()) {
      await this.eventBus.publish(event.eventType, event);
    }
    
    return sessionId;
  }
  
  // Other methods...
}

// Command handler for setting player role
export class SetPlayerRoleCommandHandler {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus
  ) {}
  
  async handle(command: SetPlayerRoleCommand): Promise<void> {
    // Find session
    const session = await this.sessionRepository.findById(
      SessionId.fromString(command.sessionId)
    );
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Get role instance
    const role = RoleRegistry.getRole(command.roleId);
    
    if (!role) {
      throw new Error('Invalid role ID');
    }
    
    // Apply domain operation
    session.setPlayerRole(
      PeerId.fromString(command.peerId),
      role
    );
    
    // Save session
    await this.sessionRepository.save(session);
    
    // Publish domain events
    for (const event of session.collectDomainEvents()) {
      await this.eventBus.publish(event.eventType, event);
    }
  }
}
```

Key implementation considerations:
- Perform authorization checks before domain operations
- Validate input commands
- Handle domain errors appropriately
- Publish domain events after successful operations
- Keep handlers focused on single responsibilities

### 4. Event Subscription and Integration

Implement event subscription to handle Collaboration BC events:

```typescript
// PeerLeftRoomEventHandler
export class PeerLeftRoomHandler {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus
  ) {}
  
  async handle(event: CollabPeerLeftRoomEvent): Promise<void> {
    // Find sessions in the affected room
    const session = await this.sessionRepository.findByRoomId(
      RoomId.fromString(event.roomId)
    );
    
    if (!session) {
      return; // No sessions in this room
    }
    
    // Mark player as unavailable
    session.markPlayerAsUnavailable(
      PeerId.fromString(event.peerId)
    );
    
    // Save session
    await this.sessionRepository.save(session);
    
    // Publish domain events
    for (const event of session.collectDomainEvents()) {
      await this.eventBus.publish(event.eventType, event);
    }
  }
}

// Event subscription setup
export function setupEventSubscriptions(
  eventBus: IEventBus,
  handlers: {
    peerLeftRoomHandler: PeerLeftRoomHandler;
    roomClosedHandler: RoomClosedHandler;
    // Other handlers...
  }
): void {
  eventBus.subscribe('collab.peer-left-room', (event) => {
    handlers.peerLeftRoomHandler.handle(event);
  });
  
  eventBus.subscribe('collab.room-closed', (event) => {
    handlers.roomClosedHandler.handle(event);
  });
  
  // Other subscriptions...
}
```

Key implementation considerations:
- Create specific handlers for each event type
- Use dependency injection for handlers
- Centralize subscription setup
- Handle errors in event processing
- Consider idempotency (events may be processed multiple times)

## Frontend Implementation

### 1. Session App Service

Create a client-side service to manage jam session state:

```typescript
// SessionAppService
export class SessionAppService {
  private _currentSession: SessionDto | null = null;
  private _eventEmitter = new EventEmitter();
  
  constructor(private signalHub: SignalHubAdapter) {
    // Subscribe to relevant events
    this.signalHub.on('jam.session-created', this.onSessionCreated.bind(this));
    this.signalHub.on('jam.player-role-set', this.onPlayerRoleSet.bind(this));
    this.signalHub.on('jam.player-ready', this.onPlayerReady.bind(this));
    this.signalHub.on('jam.session-started', this.onSessionStarted.bind(this));
    this.signalHub.on('jam.round-started', this.onRoundStarted.bind(this));
    this.signalHub.on('jam.round-ended', this.onRoundEnded.bind(this));
    this.signalHub.on('jam.session-ended', this.onSessionEnded.bind(this));
    this.signalHub.on('jam.player-left-session', this.onPlayerLeft.bind(this));
    this.signalHub.on('jam.countdown-tick', this.onCountdownTick.bind(this));
  }
  
  // Command methods
  async createSession(roomId: string): Promise<void> {
    await this.signalHub.send('jam.create-session', {
      roomId,
      initiatorPeerId: this.signalHub.peerId
    });
  }
  
  async setRole(sessionId: string, roleId: string): Promise<void> {
    await this.signalHub.send('jam.set-player-role', {
      sessionId,
      peerId: this.signalHub.peerId,
      roleId
    });
  }
  
  // More command methods...
  
  // Event handlers
  private onSessionCreated(event: any): void {
    // Update state
    this._currentSession = {
      sessionId: event.sessionId,
      roomId: event.roomId,
      status: 'pending',
      currentRoundNumber: 0,
      rounds: [],
      players: []
    };
    
    // Notify listeners
    this._eventEmitter.emit('sessionUpdated', this._currentSession);
  }
  
  // More event handlers...
  
  // Public getters and subscription methods
  get currentSession(): SessionDto | null {
    return this._currentSession;
  }
  
  onSessionUpdate(callback: (session: SessionDto | null) => void): () => void {
    this._eventEmitter.on('sessionUpdated', callback);
    return () => this._eventEmitter.off('sessionUpdated', callback);
  }
}
```

Key implementation considerations:
- Use event emitter for local state notifications
- Keep local state synchronized with server events
- Provide methods to dispatch commands to the server
- Handle command failures
- Support clean unsubscription from events

### 2. React Components

Implement React components for the UI:

```tsx
// SessionPage component
const SessionPage: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { currentSession } = useJamSession();
  
  if (!currentSession) {
    return (
      <div className="session-page">
        <CreateSessionButton roomId={roomId} />
      </div>
    );
  }
  
  return (
    <div className="session-page">
      {currentSession.status === 'pending' && (
        <PreparationPhase session={currentSession} />
      )}
      
      {currentSession.status === 'inProgress' && (
        <ActiveJamPhase session={currentSession} />
      )}
      
      {currentSession.status === 'ended' && (
        <EndedSessionPage session={currentSession} />
      )}
    </div>
  );
};

// Role selection component
const RoleSelector: React.FC<{ session: SessionDto }> = ({ session }) => {
  const { setRole } = useJamSession();
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Find current player
  const currentPlayer = session.players.find(
    p => p.peerId === useSignalHub().peerId
  );
  
  // Get available roles
  const roles = useAvailableRoles(session);
  
  const handleRoleSelect = async (roleId: string) => {
    setSelectedRole(roleId);
    await setRole(session.sessionId, roleId);
  };
  
  return (
    <div className="role-selector">
      <h3>Select Your Role</h3>
      
      <div className="role-list">
        {roles.map(role => (
          <RoleCard
            key={role.id}
            role={role}
            selected={currentPlayer?.role?.id === role.id}
            disabled={isRoleTaken(session, role.id)}
            onClick={() => handleRoleSelect(role.id)}
          />
        ))}
      </div>
    </div>
  );
};

// More components...
```

Key implementation considerations:
- Use React Hooks for state management
- Create custom hooks for jam session functionality
- Split UI into logical components
- Handle loading and error states
- Provide clear user feedback

### 3. Custom Hooks

Create custom hooks to simplify component logic:

```tsx
// useJamSession hook
export function useJamSession() {
  // Get the session app service from context
  const sessionService = useContext(JamSessionContext);
  
  // Local state for the current session
  const [session, setSession] = useState<SessionDto | null>(
    sessionService.currentSession
  );
  
  // Subscribe to session updates
  useEffect(() => {
    const unsubscribe = sessionService.onSessionUpdate(setSession);
    return unsubscribe;
  }, [sessionService]);
  
  // Wrapped command methods
  const createSession = useCallback(
    (roomId: string) => sessionService.createSession(roomId),
    [sessionService]
  );
  
  const setRole = useCallback(
    (sessionId: string, roleId: string) => sessionService.setRole(sessionId, roleId),
    [sessionService]
  );
  
  // More wrapped methods...
  
  return {
    currentSession: session,
    createSession,
    setRole,
    // More methods...
  };
}

// useRoundTimer hook
export function useRoundTimer(session: SessionDto | null) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  
  // Get current round
  const currentRound = useMemo(() => {
    if (!session || session.status !== 'inProgress') {
      return null;
    }
    
    const activeRounds = session.rounds.filter(r => !r.endedAt);
    return activeRounds.length > 0 ? activeRounds[0] : null;
  }, [session]);
  
  // Subscribe to countdown ticks
  useEffect(() => {
    if (!currentRound) {
      setRemainingSeconds(0);
      return;
    }
    
    const tickHandler = (payload: any) => {
      if (payload.roundNumber === currentRound.roundNumber) {
        setRemainingSeconds(payload.remainingSeconds);
      }
    };
    
    // Subscribe to countdown tick events
    const signalHub = useSignalHub();
    signalHub.on('jam.countdown-tick', tickHandler);
    
    return () => {
      signalHub.off('jam.countdown-tick', tickHandler);
    };
  }, [currentRound]);
  
  return {
    currentRound,
    remainingSeconds,
    isActive: !!currentRound && remainingSeconds > 0
  };
}
```

Key implementation considerations:
- Encapsulate complex logic in hooks
- Manage subscriptions with proper cleanup
- Use React's built-in hooks effectively
- Memoize computed values
- Wrap callback methods consistently

## API and WebSocket Protocol

### WebSocket Message Format

Define a consistent format for WebSocket messages:

```typescript
// Message format
interface WebSocketMessage {
  type: string;        // e.g., "jam.player-role-set"
  payload: any;        // Event-specific data
  meta?: {             // Optional metadata
    eventId: string;   // For deduplication
    timestamp: string; // ISO timestamp
    senderId?: string; // ID of the sender (for debugging)
  };
}

// Example outgoing message
const message: WebSocketMessage = {
  type: 'jam.set-player-role',
  payload: {
    sessionId: '123',
    peerId: 'peer-456',
    roleId: 'drummer'
  },
  meta: {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    senderId: 'peer-456'
  }
};

// Send through WebSocket
webSocket.send(JSON.stringify(message));
```

### REST API Endpoints

Implement these key REST endpoints:

1. **Session Management**:
   - `POST /rooms/:roomId/sessions` - Create a new session
   - `GET /rooms/:roomId/sessions/current` - Get current session in room
   - `GET /sessions/:sessionId` - Get session by ID

2. **Session Recovery**:
   - `GET /sessions/:sessionId/state` - Get full session state
   - `PUT /sessions/:sessionId/players/:peerId/reconnect` - Mark player as reconnected

## Testing Strategy

### Unit Testing

Test individual components in isolation:

```typescript
// Session aggregate test
describe('Session Aggregate', () => {
  let sessionId: SessionId;
  let roomId: RoomId;
  let ownerId: PeerId;
  
  beforeEach(() => {
    sessionId = SessionId.generate();
    roomId = RoomId.fromString('room-1');
    ownerId = PeerId.fromString('peer-1');
  });
  
  test('should create a new session', () => {
    const session = Session.create(sessionId, roomId, ownerId);
    
    expect(session.sessionId).toBe(sessionId);
    expect(session.roomId).toBe(roomId);
    expect(session.status).toBe(SessionStatus.PENDING);
    expect(session.playerCount).toBe(0);
    
    const events = session.collectDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(JamSessionCreated);
  });
  
  test('should not allow starting session without players', () => {
    const session = Session.create(sessionId, roomId, ownerId);
    
    expect(() => {
      session.startJamSession();
    }).toThrow('Cannot start session with no players');
  });
  
  // More tests...
});
```

### Integration Testing

Test interactions between components:

```typescript
describe('JamSessionService Integration', () => {
  let sessionService: JamSessionService;
  let sessionRepository: InMemorySessionRepository;
  let collaborationService: MockCollaborationService;
  let eventBus: MockEventBus;
  
  beforeEach(() => {
    sessionRepository = new InMemorySessionRepository();
    collaborationService = new MockCollaborationService();
    eventBus = new MockEventBus();
    
    sessionService = new JamSessionService(
      sessionRepository,
      collaborationService,
      eventBus
    );
    
    // Set up mock collaboration service
    collaborationService.mockRoomExists.mockResolvedValue(true);
    collaborationService.mockIsPeerInRoom.mockResolvedValue(true);
  });
  
  test('should create a session and publish events', async () => {
    const command = new CreateJamSessionCommand('room-1', 'peer-1');
    
    const sessionId = await sessionService.createSession(command);
    
    // Verify session was saved
    const savedSession = await sessionRepository.findById(sessionId);
    expect(savedSession).not.toBeNull();
    
    // Verify event was published
    expect(eventBus.publishedEvents.length).toBe(1);
    expect(eventBus.publishedEvents[0].eventType).toBe('jam.session-created');
  });
  
  // More tests...
});
```

### End-to-End Testing

Test complete flows:

```typescript
describe('JamSession E2E', () => {
  let frontendA: TestClient;
  let frontendB: TestClient;
  let backend: TestServer;
  
  beforeAll(async () => {
    backend = await startTestServer();
    frontendA = await createTestClient('user-a');
    frontendB = await createTestClient('user-b');
  });
  
  afterAll(async () => {
    await frontendA.disconnect();
    await frontendB.disconnect();
    await backend.stop();
  });
  
  test('should support complete jam session flow', async () => {
    // User A creates room
    const roomId = await frontendA.createRoom('Test Room');
    
    // User B joins room
    await frontendB.joinRoom(roomId);
    
    // User A creates jam session
    const sessionId = await frontendA.createJamSession(roomId);
    
    // Verify both users see the session
    expect(frontendA.getCurrentSession()?.sessionId).toBe(sessionId);
    expect(frontendB.getCurrentSession()?.sessionId).toBe(sessionId);
    
    // User A selects role
    await frontendA.selectRole(sessionId, 'drummer');
    
    // User B selects role
    await frontendB.selectRole(sessionId, 'guitarist');
    
    // Both users mark ready
    await frontendA.setReady(sessionId, true);
    await frontendB.setReady(sessionId, true);
    
    // User A starts session
    await frontendA.startSession(sessionId);
    
    // Verify session status updated for both
    expect(frontendA.getCurrentSession()?.status).toBe('inProgress');
    expect(frontendB.getCurrentSession()?.status).toBe('inProgress');
    
    // User A starts round
    await frontendA.startNextRound(sessionId);
    
    // Verify both see the round
    expect(frontendA.getCurrentRound()?.roundNumber).toBe(1);
    expect(frontendB.getCurrentRound()?.roundNumber).toBe(1);
    
    // Wait for countdown ticks
    await waitForCountdownTicks();
    
    // End session
    await frontendA.endSession(sessionId);
    
    // Verify session ended for both
    expect(frontendA.getCurrentSession()?.status).toBe('ended');
    expect(frontendB.getCurrentSession()?.status).toBe('ended');
  });
});
```

## Performance Considerations

1. **WebSocket Optimization**:
   - Batch non-critical updates
   - Compress larger payloads
   - Prioritize critical messages (e.g., round timing)

2. **Event Processing**:
   - Process events asynchronously when possible
   - Use dedicated worker threads for CPU-intensive tasks

3. **State Synchronization**:
   - Use incremental updates instead of full state when possible
   - Consider WebRTC data channels for player-to-player state (bypassing server)

4. **Database Performance**:
   - Index frequently queried fields
   - Use caching for active sessions
   - Consider event sourcing for scalability

## Security Considerations

1. **Authorization**:
   - Verify peer is in room before allowing session actions
   - Restrict session creation and administration to room owner

2. **Input Validation**:
   - Validate all command inputs before processing
   - Sanitize user inputs for XSS prevention

3. **Rate Limiting**:
   - Implement rate limiting for commands to prevent abuse
   - Add backoff for reconnection attempts

4. **Data Privacy**:
   - Only expose session data to room members
   - Consider data retention policies

## Development Workflow Recommendations

1. Start with domain model implementation and tests
2. Implement server-side infrastructure
3. Create minimal UI components for core flows
4. Test basic interactions end-to-end
5. Implement additional features iteratively
6. Refine UX and optimize performance

## Future Enhancements

1. **Session Recording**:
   - Record jam sessions for playback
   - Export recordings to standard formats

2. **Role Templates**:
   - Predefined role sets for different jam types
   - Custom role definitions

3. **Advanced Round Types**:
   - Different round structures (e.g., call and response)
   - Dynamic duration adjustment

4. **Performance Metrics**:
   - Track player participation
   - Provide feedback on jam quality 