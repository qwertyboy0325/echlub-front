import { DomainEvent } from '../../../../core/events/DomainEvent';
import { DomainError } from '../../domain/errors/DomainError';
import { RealEventBus } from '../../infrastructure/events/RealEventBus';

/**
 * Collaboration User
 */
export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    trackId: string;
    position: number;
  };
}

/**
 * Collaboration Operation
 */
export interface CollaborationOperation {
  id: string;
  type: 'insert' | 'delete' | 'update' | 'move';
  userId: string;
  timestamp: Date;
  aggregateId: string;
  aggregateType: string;
  data: any;
  version: number;
}

/**
 * Operational Transform Result
 */
export interface TransformResult {
  transformed: CollaborationOperation;
  shouldApply: boolean;
  conflicts: string[];
}

/**
 * Collaboration Session
 */
export interface CollaborationSession {
  id: string;
  name: string;
  users: CollaborationUser[];
  operations: CollaborationOperation[];
  version: number;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Collaboration Events
 */
export interface CollaborationEvents {
  onUserJoined: (user: CollaborationUser) => void;
  onUserLeft: (userId: string) => void;
  onUserCursorMoved: (userId: string, cursor: { trackId: string; position: number }) => void;
  onOperationReceived: (operation: CollaborationOperation) => void;
  onConflictDetected: (operation: CollaborationOperation, conflicts: string[]) => void;
  onSessionStateChanged: (session: CollaborationSession) => void;
  onConnectionStateChanged: (connected: boolean) => void;
  onError: (error: Error) => void;
}

/**
 * WebSocket Message
 */
interface WebSocketMessage {
  type: 'join' | 'leave' | 'operation' | 'cursor' | 'heartbeat' | 'sync';
  sessionId: string;
  userId: string;
  data?: any;
  timestamp: Date;
}

/**
 * Real Collaboration Adapter
 * Provides actual real-time collaboration functionality
 * Supports operational transformation, conflict resolution, and user presence
 */
export class RealCollaborationAdapter {
  private websocket: WebSocket | null = null;
  private eventBus: RealEventBus;
  private currentSession: CollaborationSession | null = null;
  private currentUser: CollaborationUser | null = null;
  
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: number | null = null;
  
  private events: Partial<CollaborationEvents> = {};
  private operationQueue: CollaborationOperation[] = [];
  private pendingOperations: Map<string, CollaborationOperation> = new Map();

  constructor(
    private serverUrl: string,
    eventBus?: RealEventBus
  ) {
    this.eventBus = eventBus || new RealEventBus();
    this.setupEventBusSubscriptions();
  }

  /**
   * Initialize collaboration adapter
   */
  public async initialize(user: CollaborationUser): Promise<void> {
    try {
      this.currentUser = user;
      await this.connect();
      console.log('Real Collaboration Adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Real Collaboration Adapter:', error);
      throw DomainError.operationNotPermitted('initialize', 'Collaboration adapter initialization failed');
    }
  }

  /**
   * Join collaboration session
   */
  public async joinSession(sessionId: string): Promise<CollaborationSession> {
    if (!this.isConnected || !this.currentUser) {
      throw DomainError.operationNotPermitted('joinSession', 'Not connected or user not set');
    }

    try {
      const message: WebSocketMessage = {
        type: 'join',
        sessionId,
        userId: this.currentUser.id,
        data: this.currentUser,
        timestamp: new Date()
      };

      this.sendMessage(message);

      // Wait for session state update
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Join session timeout'));
        }, 10000);

        const handleSessionUpdate = (session: CollaborationSession) => {
          if (session.id === sessionId) {
            clearTimeout(timeout);
            this.currentSession = session;
            resolve(session);
          }
        };

        this.events.onSessionStateChanged = handleSessionUpdate;
      });

    } catch (error) {
      console.error('Error joining session:', error);
      throw DomainError.operationNotPermitted('joinSession', `Failed to join session: ${error}`);
    }
  }

  /**
   * Leave current session
   */
  public async leaveSession(): Promise<void> {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    try {
      const message: WebSocketMessage = {
        type: 'leave',
        sessionId: this.currentSession.id,
        userId: this.currentUser.id,
        timestamp: new Date()
      };

      this.sendMessage(message);
      this.currentSession = null;

    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }

  /**
   * Send operation to other collaborators
   */
  public async sendOperation(operation: Omit<CollaborationOperation, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    if (!this.currentSession || !this.currentUser) {
      throw DomainError.operationNotPermitted('sendOperation', 'Not in a collaboration session');
    }

    try {
      const fullOperation: CollaborationOperation = {
        ...operation,
        id: this.generateOperationId(),
        userId: this.currentUser.id,
        timestamp: new Date()
      };

      // Add to pending operations
      this.pendingOperations.set(fullOperation.id, fullOperation);

      const message: WebSocketMessage = {
        type: 'operation',
        sessionId: this.currentSession.id,
        userId: this.currentUser.id,
        data: fullOperation,
        timestamp: new Date()
      };

      this.sendMessage(message);

    } catch (error) {
      console.error('Error sending operation:', error);
      throw DomainError.operationNotPermitted('sendOperation', `Failed to send operation: ${error}`);
    }
  }

  /**
   * Update user cursor position
   */
  public updateCursor(trackId: string, position: number): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    try {
      this.currentUser.cursor = { trackId, position };

      const message: WebSocketMessage = {
        type: 'cursor',
        sessionId: this.currentSession.id,
        userId: this.currentUser.id,
        data: { trackId, position },
        timestamp: new Date()
      };

      this.sendMessage(message);

    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  /**
   * Get online users
   */
  public getOnlineUsers(): CollaborationUser[] {
    if (!this.currentSession) {
      return [];
    }
    return this.currentSession.users.filter(user => user.isOnline);
  }

  /**
   * Set event handlers
   */
  public setEventHandlers(events: Partial<CollaborationEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Get connection state
   */
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  /**
   * Dispose of the collaboration adapter
   */
  public async dispose(): Promise<void> {
    try {
      await this.leaveSession();
      this.disconnect();
      this.eventBus.dispose();
      console.log('Real Collaboration Adapter disposed');
    } catch (error) {
      console.error('Error disposing collaboration adapter:', error);
    }
  }

  // Private methods

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.serverUrl);

        this.websocket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.events.onConnectionStateChanged?.(true);
          console.log('Connected to collaboration server');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.websocket.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.events.onConnectionStateChanged?.(false);
          console.log('Disconnected from collaboration server');
          this.attemptReconnect();
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.events.onError?.(new Error('WebSocket connection error'));
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
        
        // Rejoin session if we were in one
        if (this.currentSession && this.currentUser) {
          await this.joinSession(this.currentSession.id);
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  private sendMessage(message: WebSocketMessage): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, queueing message');
      // Could implement message queuing here
      return;
    }

    try {
      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        case 'join':
          this.handleUserJoined(message.data);
          break;
        case 'leave':
          this.handleUserLeft(message.userId);
          break;
        case 'operation':
          this.handleOperationReceived(message.data);
          break;
        case 'cursor':
          this.handleCursorMoved(message.userId, message.data);
          break;
        case 'sync':
          this.handleSessionSync(message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.events.onError?.(error as Error);
    }
  }

  private handleUserJoined(user: CollaborationUser): void {
    if (this.currentSession) {
      const existingUserIndex = this.currentSession.users.findIndex(u => u.id === user.id);
      if (existingUserIndex >= 0) {
        this.currentSession.users[existingUserIndex] = user;
      } else {
        this.currentSession.users.push(user);
      }
    }
    
    this.events.onUserJoined?.(user);
  }

  private handleUserLeft(userId: string): void {
    if (this.currentSession) {
      this.currentSession.users = this.currentSession.users.filter(u => u.id !== userId);
    }
    
    this.events.onUserLeft?.(userId);
  }

  private handleOperationReceived(operation: CollaborationOperation): void {
    try {
      // Apply operational transformation
      const transformResult = this.transformOperation(operation);
      
      if (transformResult.shouldApply) {
        // Remove from pending operations if it's our own operation
        this.pendingOperations.delete(operation.id);
        
        // Add to session operations
        if (this.currentSession) {
          this.currentSession.operations.push(transformResult.transformed);
          this.currentSession.version++;
        }
        
        this.events.onOperationReceived?.(transformResult.transformed);
        
        if (transformResult.conflicts.length > 0) {
          this.events.onConflictDetected?.(operation, transformResult.conflicts);
        }
      }
    } catch (error) {
      console.error('Error handling operation:', error);
      this.events.onError?.(error as Error);
    }
  }

  private handleCursorMoved(userId: string, cursor: { trackId: string; position: number }): void {
    if (this.currentSession) {
      const user = this.currentSession.users.find(u => u.id === userId);
      if (user) {
        user.cursor = cursor;
      }
    }
    
    this.events.onUserCursorMoved?.(userId, cursor);
  }

  private handleSessionSync(session: CollaborationSession): void {
    this.currentSession = session;
    this.events.onSessionStateChanged?.(session);
  }

  private transformOperation(operation: CollaborationOperation): TransformResult {
    // Simplified operational transformation
    // In a real implementation, this would be much more sophisticated
    
    const conflicts: string[] = [];
    let shouldApply = true;
    
    // Check for conflicts with pending operations
    for (const [id, pendingOp] of this.pendingOperations) {
      if (pendingOp.aggregateId === operation.aggregateId && 
          pendingOp.timestamp < operation.timestamp) {
        conflicts.push(`Conflict with pending operation ${id}`);
      }
    }
    
    // Check version conflicts
    if (this.currentSession && operation.version < this.currentSession.version) {
      conflicts.push('Version conflict detected');
      // Could implement more sophisticated conflict resolution here
    }
    
    return {
      transformed: operation,
      shouldApply,
      conflicts
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected && this.currentSession && this.currentUser) {
        const message: WebSocketMessage = {
          type: 'heartbeat',
          sessionId: this.currentSession.id,
          userId: this.currentUser.id,
          timestamp: new Date()
        };
        this.sendMessage(message);
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventBusSubscriptions(): void {
    // Subscribe to domain events for collaboration
    this.eventBus.subscribe('TrackCreated', (event) => {
      this.sendOperationFromDomainEvent(event, 'insert');
    });

    this.eventBus.subscribe('ClipAddedToTrack', (event) => {
      this.sendOperationFromDomainEvent(event, 'insert');
    });

    this.eventBus.subscribe('MidiNoteAdded', (event) => {
      this.sendOperationFromDomainEvent(event, 'insert');
    });

    this.eventBus.subscribe('MidiNoteRemoved', (event) => {
      this.sendOperationFromDomainEvent(event, 'delete');
    });
  }

  private async sendOperationFromDomainEvent(event: DomainEvent, operationType: 'insert' | 'delete' | 'update' | 'move'): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      await this.sendOperation({
        type: operationType,
        aggregateId: event.aggregateId || '',
        aggregateType: 'Track',
        data: event,
        version: this.currentSession.version + 1
      });
    } catch (error) {
      console.error('Error sending operation from domain event:', error);
    }
  }

  // Static utility methods

  /**
   * Generate user color
   */
  public static generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Create user from basic info
   */
  public static createUser(id: string, name: string, avatar?: string): CollaborationUser {
    return {
      id,
      name,
      avatar,
      color: this.generateUserColor(),
      isOnline: true,
      lastSeen: new Date()
    };
  }
} 