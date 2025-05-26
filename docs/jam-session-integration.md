# JamSession and Collaboration BC Integration

This document outlines the integration points between the JamSession Bounded Context and the Collaboration BC, defining how these two systems work together to provide a seamless jamming experience.

## Dependency Direction

JamSession BC → Collaboration BC

The JamSession BC explicitly depends on the Collaboration BC, not the other way around. This is a deliberate architectural choice to maintain separation of concerns:

- Collaboration BC manages rooms and peer connections without any knowledge of jam sessions
- JamSession BC extends the collaboration functionality by adding the concept of structured jamming sessions

## Key Integration Points

### 1. Shared Identity Concepts

JamSession BC references these key identities from Collaboration BC:

- **RoomId**: Every JamSession is associated with exactly one Collaboration Room
- **PeerId**: Players in a JamSession are identified by their Peer IDs from Collaboration BC

```typescript
// Example of identity reference in JamSession BC
class Session {
  private readonly _roomId: RoomId; // From Collaboration BC
  private _players: Map<string, PlayerState>; // Keys are PeerId strings from Collaboration BC
  
  // ...
}
```

### 2. Event Subscriptions

JamSession BC subscribes to these Collaboration BC events:

| Collaboration Event | JamSession Response |
|---------------------|---------------------|
| `collab.peer-joined-room` | Detect potential new players that could join the session |
| `collab.peer-left-room` | Check if the peer was a player in a session and mark them as unavailable |
| `collab.room-closed` | Automatically end any active jam sessions in that room |

```typescript
// Example event handler in JamSession BC
class PeerLeftRoomHandler {
  constructor(private sessionRepository: ISessionRepository) {}
  
  async handle(event: CollabPeerLeftRoomEvent): Promise<void> {
    const { roomId, peerId } = event;
    
    // Find sessions in the affected room
    const session = await this.sessionRepository.findByRoomId(
      RoomId.fromString(roomId)
    );
    
    if (session) {
      // Mark player as unavailable in session
      session.markPlayerAsUnavailable(PeerId.fromString(peerId));
      await this.sessionRepository.save(session);
    }
  }
}
```

### 3. Service Dependencies

JamSession services may need to verify information with Collaboration services:

```typescript
class JamSessionService implements IJamSessionService {
  constructor(
    private sessionRepository: ISessionRepository,
    private collaborationService: ICollaborationService // Dependency on Collaboration BC
  ) {}
  
  async createSession(command: CreateJamSessionCommand): Promise<SessionId> {
    // Verify room exists in Collaboration BC
    const roomExists = await this.collaborationService.roomExists(
      RoomId.fromString(command.roomId)
    );
    
    if (!roomExists) {
      throw new Error('Cannot create session: Room does not exist');
    }
    
    // Verify initiator is in the room
    const peerInRoom = await this.collaborationService.isPeerInRoom(
      PeerId.fromString(command.initiatorPeerId),
      RoomId.fromString(command.roomId)
    );
    
    if (!peerInRoom) {
      throw new Error('Cannot create session: Initiator is not in the room');
    }
    
    // Create new session
    const sessionId = SessionId.generate();
    const session = Session.create(
      sessionId,
      RoomId.fromString(command.roomId),
      PeerId.fromString(command.initiatorPeerId)
    );
    
    await this.sessionRepository.save(session);
    return sessionId;
  }
  
  // Additional methods...
}
```

### 4. WebSocket Channel Sharing

Both BCs share the same WebSocket connection but use different message prefixes:

- Collaboration messages: `collab.*`
- JamSession messages: `jam.*`

```typescript
// Example client-side event handling
class SignalHubAdapter {
  // ...
  
  initialize() {
    this.socket.on('message', (message) => {
      const { type, payload } = JSON.parse(message);
      
      if (type.startsWith('collab.')) {
        this.handleCollaborationMessage(type, payload);
      } else if (type.startsWith('jam.')) {
        this.handleJamSessionMessage(type, payload);
      }
    });
  }
  
  private handleCollaborationMessage(type: string, payload: any) {
    // Route to collaboration handlers
    this.collaborationEventEmitter.emit(type, payload);
  }
  
  private handleJamSessionMessage(type: string, payload: any) {
    // Route to jam session handlers
    this.jamSessionEventEmitter.emit(type, payload);
  }
}
```

### 5. User Interface Integration

The JamSession UI components are displayed within the Collaboration room UI:

```tsx
// Example React component showing integration
const RoomPage: React.FC = () => {
  const { roomId, isConnected } = useCollaborationContext();
  const { activeSession } = useJamSessionContext();
  
  return (
    <div className="room-page">
      <CollaborationPanel roomId={roomId} />
      
      {isConnected && (
        <div className="jam-session-container">
          {activeSession ? (
            // Show active session UI
            <JamSessionControls sessionId={activeSession.sessionId} />
          ) : (
            // Show option to create a session
            <CreateSessionButton roomId={roomId} />
          )}
        </div>
      )}
    </div>
  );
};
```

## Integration Flows

### Flow 1: Creating a JamSession in a Collaboration Room

1. User joins a Collaboration Room (managed by Collaboration BC)
2. User clicks "Create Jam Session" button
3. JamSession BC:
   - Verifies room exists via Collaboration Service
   - Creates new Session entity associated with the room
   - Publishes `jam.session-created` event
4. UI updates to show Jam Session interface within Room

### Flow 2: Player Leaves Room During Active Jam

1. Player disconnects or leaves Room (managed by Collaboration BC)
2. Collaboration BC publishes `collab.peer-left-room` event
3. JamSession BC:
   - Receives event via subscription
   - Finds affected Session 
   - Marks player as unavailable in Session
   - Publishes `jam.player-left-session` event
4. UI updates to show player has left jam
5. If player was last in session, session automatically ends

### Flow 3: Room Closes During Active Jam

1. Room owner closes Room (managed by Collaboration BC) 
2. Collaboration BC publishes `collab.room-closed` event
3. JamSession BC:
   - Receives event via subscription
   - Finds all Sessions in that room
   - Ends all active Sessions
   - Publishes `jam.session-ended` events
4. UI redirects users, showing session has ended

## Error Handling and Recovery

### Consistency Challenges

Since JamSession BC depends on Collaboration BC, several consistency challenges must be addressed:

1. **Room/Peer Reference Integrity**: A Session might reference a Room or Peer that no longer exists
2. **Connection State Misalignment**: A player might appear in a Session but not be connected to the Room
3. **Event Ordering Issues**: Events from different BCs might arrive out of order

### Recovery Strategies

1. **Heartbeat Verification**:
   - Periodically verify all Session players are still active in their Rooms
   - Mark missing players as unavailable

2. **Reconciliation Mechanism**:
   - On reconnection, verify Session state against Room state
   - Resolve any inconsistencies by prioritizing Room state (source of truth)

3. **State Recovery Endpoint**:
   - Provide a `/rooms/:roomId/sessions/current` REST endpoint
   - Allows clients to get authoritative Session state after reconnection

## Integration Testing

Testing the integration between JamSession BC and Collaboration BC requires:

1. **Unit Tests with Mocks**:
   - Mock Collaboration Service in JamSession tests
   - Verify JamSession responds correctly to simulated Collaboration events

2. **Integration Tests**:
   - Test both BCs together with in-memory implementations
   - Verify end-to-end flows work as expected

3. **End-to-End Tests**:
   - Test with real WebSocket connections
   - Verify UI correctly updates in response to events from both BCs

Example integration test:

```typescript
describe('JamSession and Collaboration Integration', () => {
  let collaborationService: CollaborationService;
  let jamSessionService: JamSessionService;
  let roomId: RoomId;
  let peerId: PeerId;
  
  beforeEach(async () => {
    // Set up services with in-memory repositories
    collaborationService = new CollaborationService(new InMemoryRoomRepository());
    jamSessionService = new JamSessionService(
      new InMemorySessionRepository(),
      collaborationService
    );
    
    // Create test room and peer
    roomId = await collaborationService.createRoom({
      name: 'Test Room',
      ownerId: 'owner-1'
    });
    
    peerId = await collaborationService.joinRoom({
      roomId: roomId.toString(),
      username: 'Test User'
    });
  });
  
  test('should end jam session when room is closed', async () => {
    // Create a jam session
    const sessionId = await jamSessionService.createSession({
      roomId: roomId.toString(),
      initiatorPeerId: peerId.toString()
    });
    
    // Verify session exists
    let session = await jamSessionService.getSessionById(sessionId);
    expect(session).not.toBeNull();
    
    // Close the room
    await collaborationService.closeRoom({
      roomId: roomId.toString()
    });
    
    // Verify session was ended
    session = await jamSessionService.getSessionById(sessionId);
    expect(session?.status).toBe('ended');
  });
}); 