# JamSession Core Types and Interfaces

This document defines the core types and interfaces for the JamSession Bounded Context, providing a shared vocabulary for implementation.

## Domain Types

### Session Aggregate

```typescript
enum SessionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  ENDED = 'ended'
}

class Session {
  private readonly _sessionId: SessionId;
  private readonly _roomId: RoomId; // From Collaboration BC
  private _status: SessionStatus;
  private _players: Map<string, PlayerState>; // Key is peerId
  private _currentRoundNumber: number;
  private _rounds: RoundVO[];
  private _domainEvents: DomainEvent[] = [];
  
  // Constructor
  private constructor(sessionId: SessionId, roomId: RoomId) {
    this._sessionId = sessionId;
    this._roomId = roomId;
    this._status = SessionStatus.PENDING;
    this._players = new Map();
    this._currentRoundNumber = 0;
    this._rounds = [];
  }
  
  // Factory method
  public static create(sessionId: SessionId, roomId: RoomId, initiatorPeerId: PeerId): Session {
    const session = new Session(sessionId, roomId);
    
    // Add domain event
    session._domainEvents.push(new JamSessionCreated(
      session.sessionId.toString(),
      roomId.toString(),
      initiatorPeerId.toString()
    ));
    
    return session;
  }
  
  // Player management
  public addPlayer(peerId: PeerId, username: string): void {
    if (this._status !== SessionStatus.PENDING) {
      throw new Error('Players can only be added when session is pending');
    }
    
    const playerState = PlayerState.create(peerId, new Date());
    this._players.set(peerId.toString(), playerState);
  }
  
  public setPlayerRole(peerId: PeerId, role: RoleVO): void {
    if (this._status !== SessionStatus.PENDING) {
      throw new Error('Roles can only be set when session is pending');
    }
    
    const playerState = this._players.get(peerId.toString());
    if (!playerState) {
      throw new Error('Player not found in session');
    }
    
    // Check if role is already taken
    if (this.isRoleTaken(role) && !playerState.hasRole(role)) {
      throw new Error('This role is already taken by another player');
    }
    
    playerState.setRole(role);
    
    // Add domain event
    this._domainEvents.push(new PlayerRoleSet(
      this._sessionId.toString(),
      peerId.toString(),
      role
    ));
  }
  
  public setPlayerReady(peerId: PeerId, isReady: boolean): void {
    const playerState = this._players.get(peerId.toString());
    if (!playerState) {
      throw new Error('Player not found in session');
    }
    
    if (isReady && !playerState.hasRole()) {
      throw new Error('Player must have a role before being ready');
    }
    
    playerState.setReady(isReady);
    
    // Add domain event
    this._domainEvents.push(new PlayerReadyToggled(
      this._sessionId.toString(),
      peerId.toString(),
      isReady
    ));
  }
  
  // Session flow control
  public startJamSession(): void {
    if (this._status !== SessionStatus.PENDING) {
      throw new Error('Session can only be started from pending state');
    }
    
    if (this._players.size === 0) {
      throw new Error('Cannot start session with no players');
    }
    
    if (!this.areAllPlayersReady()) {
      throw new Error('All players must be ready to start the session');
    }
    
    this._status = SessionStatus.IN_PROGRESS;
    const startTime = new Date();
    
    // Add domain event
    this._domainEvents.push(new JamSessionStarted(
      this._sessionId.toString(),
      startTime,
      Array.from(this._players.values())
    ));
  }
  
  public startNextRound(durationSeconds: number): void {
    if (this._status !== SessionStatus.IN_PROGRESS) {
      throw new Error('Can only start rounds when session is in progress');
    }
    
    this._currentRoundNumber++;
    const startTime = new Date();
    const roundVO = new RoundVO(this._currentRoundNumber, startTime, durationSeconds);
    this._rounds.push(roundVO);
    
    // Add domain event
    this._domainEvents.push(new NextRoundStarted(
      this._sessionId.toString(),
      this._currentRoundNumber,
      startTime,
      durationSeconds
    ));
  }
  
  public endCurrentRound(): void {
    if (this._status !== SessionStatus.IN_PROGRESS) {
      throw new Error('Can only end rounds when session is in progress');
    }
    
    if (this._rounds.length === 0 || this._currentRoundNumber === 0) {
      throw new Error('No active round to end');
    }
    
    const currentRound = this._rounds[this._rounds.length - 1];
    if (currentRound.isOver()) {
      throw new Error('Current round is already over');
    }
    
    const endTime = new Date();
    currentRound.end(endTime);
    
    // Add domain event
    this._domainEvents.push(new CurrentRoundEnded(
      this._sessionId.toString(),
      this._currentRoundNumber,
      endTime
    ));
  }
  
  public endJamSession(): void {
    if (this._status === SessionStatus.ENDED) {
      throw new Error('Session is already ended');
    }
    
    // If there's an active round, end it
    if (this._status === SessionStatus.IN_PROGRESS && 
        this._rounds.length > 0 && 
        !this._rounds[this._rounds.length - 1].isOver()) {
      this.endCurrentRound();
    }
    
    this._status = SessionStatus.ENDED;
    const endTime = new Date();
    
    // Add domain event
    this._domainEvents.push(new JamSessionEnded(
      this._sessionId.toString(),
      endTime
    ));
  }
  
  public markPlayerAsUnavailable(peerId: PeerId): void {
    const playerState = this._players.get(peerId.toString());
    if (!playerState) {
      return; // Player not in session, nothing to do
    }
    
    // Remove the player from the session
    this._players.delete(peerId.toString());
    
    // Add domain event
    this._domainEvents.push(new PlayerUnavailableInSession(
      this._sessionId.toString(),
      peerId.toString()
    ));
    
    // If no players left or host left, end the session
    if (this._players.size === 0) {
      this.endJamSession();
    }
  }
  
  // Helper methods
  private isRoleTaken(role: RoleVO): boolean {
    if (!role.isUnique()) {
      return false; // Non-unique roles can be taken by multiple players
    }
    
    for (const player of this._players.values()) {
      if (player.hasRole(role)) {
        return true;
      }
    }
    return false;
  }
  
  private areAllPlayersReady(): boolean {
    for (const player of this._players.values()) {
      if (!player.isReady) {
        return false;
      }
    }
    return true;
  }
  
  // Event collection
  public collectDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
  
  // Getters
  get sessionId(): SessionId { return this._sessionId; }
  get roomId(): RoomId { return this._roomId; }
  get status(): SessionStatus { return this._status; }
  get players(): Map<string, PlayerState> { return new Map(this._players); }
  get currentRoundNumber(): number { return this._currentRoundNumber; }
  get rounds(): RoundVO[] { return [...this._rounds]; }
  get playerCount(): number { return this._players.size; }
}
```

### PlayerState Entity

```typescript
class PlayerState {
  private readonly _peerId: PeerId;
  private _role: RoleVO | null;
  private _isReady: boolean;
  private readonly _joinedAt: Date;
  
  private constructor(peerId: PeerId, joinedAt: Date) {
    this._peerId = peerId;
    this._role = null;
    this._isReady = false;
    this._joinedAt = joinedAt;
  }
  
  public static create(peerId: PeerId, joinedAt: Date): PlayerState {
    return new PlayerState(peerId, joinedAt);
  }
  
  public setRole(role: RoleVO): void {
    this._role = role;
  }
  
  public setReady(isReady: boolean): void {
    this._isReady = isReady;
  }
  
  public hasRole(specificRole?: RoleVO): boolean {
    if (!this._role) {
      return false;
    }
    
    if (specificRole) {
      return this._role.equals(specificRole);
    }
    
    return true;
  }
  
  get peerId(): PeerId { return this._peerId; }
  get role(): RoleVO | null { return this._role; }
  get isReady(): boolean { return this._isReady; }
  get joinedAt(): Date { return new Date(this._joinedAt); }
}
```

### Value Objects

```typescript
class SessionId {
  private readonly id: string;
  
  private constructor(id: string) {
    this.id = id;
  }
  
  public static generate(): SessionId {
    const uuid = crypto.randomUUID();
    return new SessionId(uuid);
  }
  
  public static fromString(id: string): SessionId {
    if (!id) {
      throw new Error('SessionId cannot be empty');
    }
    return new SessionId(id);
  }
  
  public toString(): string {
    return this.id;
  }
  
  public equals(other: SessionId): boolean {
    return this.id === other.id;
  }
}

class RoleVO {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _color: string;
  private readonly _isUnique: boolean;
  
  constructor(id: string, name: string, color: string, isUnique: boolean = true) {
    this._id = id;
    this._name = name;
    this._color = color;
    this._isUnique = isUnique;
  }
  
  public equals(other: RoleVO): boolean {
    return this._id === other._id;
  }
  
  public isUnique(): boolean {
    return this._isUnique;
  }
  
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get color(): string { return this._color; }
}

class RoundVO {
  private readonly _roundNumber: number;
  private readonly _startedAt: Date;
  private readonly _durationSeconds: number;
  private _endedAt: Date | null;
  
  constructor(roundNumber: number, startedAt: Date, durationSeconds: number) {
    this._roundNumber = roundNumber;
    this._startedAt = startedAt;
    this._durationSeconds = durationSeconds;
    this._endedAt = null;
  }
  
  public end(endedAt: Date): void {
    if (this._endedAt) {
      throw new Error('Round is already ended');
    }
    
    if (endedAt < this._startedAt) {
      throw new Error('End time cannot be before start time');
    }
    
    this._endedAt = endedAt;
  }
  
  public isOver(): boolean {
    return this._endedAt !== null;
  }
  
  get roundNumber(): number { return this._roundNumber; }
  get startedAt(): Date { return new Date(this._startedAt); }
  get durationSeconds(): number { return this._durationSeconds; }
  get endedAt(): Date | null { return this._endedAt ? new Date(this._endedAt) : null; }
}
```

## Domain Events

```typescript
abstract class DomainEvent {
  public readonly eventType: string;
  public readonly occurredOn: Date;
  
  constructor(eventType: string) {
    this.eventType = eventType;
    this.occurredOn = new Date();
  }
}

// Player-specific events
class PlayerRoleSet extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly role: RoleVO
  ) {
    super('jam.player-role-set');
  }
}

class PlayerReadyToggled extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly isReady: boolean
  ) {
    super('jam.player-ready');
  }
}

// Session-level events
class JamSessionCreated extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roomId: string,
    public readonly initiatorPeerId: string
  ) {
    super('jam.session-created');
  }
}

class JamSessionStarted extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly startTime: Date,
    public readonly initialPlayers: PlayerState[]
  ) {
    super('jam.session-started');
  }
}

class JamSessionEnded extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly endTime: Date
  ) {
    super('jam.session-ended');
  }
}

// Round-level events
class NextRoundStarted extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundNumber: number,
    public readonly startTime: Date,
    public readonly durationSeconds: number
  ) {
    super('jam.round-started');
  }
}

class CurrentRoundEnded extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundNumber: number,
    public readonly endTime: Date
  ) {
    super('jam.round-ended');
  }
}

// Special events
class PlayerUnavailableInSession extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string
  ) {
    super('jam.player-left-session');
  }
}
```

## Repository Interfaces

```typescript
interface ISessionRepository {
  findById(sessionId: SessionId): Promise<Session | null>;
  findByRoomId(roomId: RoomId): Promise<Session | null>;
  findByPeerId(peerId: PeerId): Promise<Session | null>;
  save(session: Session): Promise<void>;
  delete(sessionId: SessionId): Promise<void>;
}
```

## Application Commands

```typescript
// Command types
interface Command {
  readonly type: string;
}

class CreateJamSessionCommand implements Command {
  readonly type = 'jam.create-session';
  
  constructor(
    public readonly roomId: string,
    public readonly initiatorPeerId: string
  ) {}
}

class JoinJamSessionAsPlayerCommand implements Command {
  readonly type = 'jam.join-session';
  
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string
  ) {}
}

class SetPlayerRoleCommand implements Command {
  readonly type = 'jam.set-player-role';
  
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly roleId: string
  ) {}
}

class TogglePlayerReadyCommand implements Command {
  readonly type = 'jam.toggle-player-ready';
  
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly isReady: boolean
  ) {}
}

class StartJamSessionCommand implements Command {
  readonly type = 'jam.start-session';
  
  constructor(
    public readonly sessionId: string,
    public readonly initiatorPeerId: string
  ) {}
}

class StartNextRoundCommand implements Command {
  readonly type = 'jam.start-next-round';
  
  constructor(
    public readonly sessionId: string,
    public readonly durationSeconds: number = 60
  ) {}
}

class EndCurrentRoundCommand implements Command {
  readonly type = 'jam.end-current-round';
  
  constructor(
    public readonly sessionId: string
  ) {}
}

class EndJamSessionCommand implements Command {
  readonly type = 'jam.end-session';
  
  constructor(
    public readonly sessionId: string,
    public readonly initiatorPeerId: string
  ) {}
}
```

## Service Interfaces

```typescript
interface IJamSessionService {
  createSession(command: CreateJamSessionCommand): Promise<SessionId>;
  joinSession(command: JoinJamSessionAsPlayerCommand): Promise<void>;
  setPlayerRole(command: SetPlayerRoleCommand): Promise<void>;
  setPlayerReady(command: TogglePlayerReadyCommand): Promise<void>;
  startSession(command: StartJamSessionCommand): Promise<void>;
  startNextRound(command: StartNextRoundCommand): Promise<void>;
  endCurrentRound(command: EndCurrentRoundCommand): Promise<void>;
  endSession(command: EndJamSessionCommand): Promise<void>;
  
  // Query methods
  getSessionById(sessionId: SessionId): Promise<SessionDto | null>;
  getCurrentSessionInRoom(roomId: RoomId): Promise<SessionDto | null>;
}

// DTOs for query responses
interface SessionDto {
  sessionId: string;
  roomId: string;
  status: string;
  currentRoundNumber: number;
  rounds: RoundDto[];
  players: PlayerDto[];
}

interface PlayerDto {
  peerId: string;
  username: string;
  role: RoleDto | null;
  isReady: boolean;
  joinedAt: string;
}

interface RoleDto {
  id: string;
  name: string;
  color: string;
}

interface RoundDto {
  roundNumber: number;
  startedAt: string;
  durationSeconds: number;
  endedAt: string | null;
  isActive: boolean;
}
``` 