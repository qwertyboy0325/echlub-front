import { injectable, inject } from 'inversify';
import { ISignalHubAdapter } from './ISignalHubAdapter';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ApiConfig } from '../../../../core/api/ApiConfig';

// WebRTC fallback event constants
const WEBRTC_EVENTS = {
  FALLBACK_SUGGESTED: 'webrtc-fallback-suggested',
  FALLBACK_NEEDED: 'webrtc-fallback-needed',
  FALLBACK_ACTIVATE: 'webrtc-fallback-activate',
  FALLBACK_ACTIVATED: 'webrtc-fallback-activated',
  RELAY_DATA: 'relay-data'
};

// Room event constants
export const ROOM_EVENTS = {
  JOIN: 'join',
  LEAVE: 'leave',
  ROOM_STATE: 'room-state',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left'
};

// WebRTC signaling event constants
const SIGNAL_EVENTS = {
  ICE_CANDIDATE: 'ice-candidate',
  OFFER: 'offer',
  ANSWER: 'answer',
  CONNECTION_STATE: 'connection-state',
  RECONNECT_REQUEST: 'reconnect-request',
  RECONNECT_NEEDED: 'reconnect-needed',
  PEER_CONNECTION_STATE: 'peer-connection-state'
};

/**
 * SignalHub Adapter Implementation
 * Uses WebSocket for signaling exchange and room event broadcasting
 */
@injectable()
export class SignalHubAdapter implements ISignalHubAdapter {
  private socket: WebSocket | null = null;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 2000; // 2 seconds
  private readonly wsBaseUrl: string;
  
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStatus = false;
  private currentRoomId: string | null = null;
  private currentPeerId: string | null = null;

  
  constructor(
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus,
    @inject(TYPES.ENV_CONFIG)
    private readonly config: { BASE_URL?: string }
  ) {
    // Get URL from config or use default value
    let baseUrl = config.BASE_URL || ApiConfig.wsUrl || 'localhost:3000';
    
    // Remove HTTP protocol prefix, prepare for WebSocket protocol conversion
    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.substring(7); // Remove 'http://'
    } else if (baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.substring(8); // Remove 'https://'
    }
    
    // Store base URL without protocol prefix, actual ws:// or wss:// will be added during connection
    this.wsBaseUrl = baseUrl;
  }
  
  /**
   * Connect to signaling server
   */
  async connect(roomId: string, peerId: string): Promise<void> {
    console.log(`[SignalHubAdapter] Received connection request - Room ID: ${roomId}, Peer ID: ${peerId}`);
    console.log(`[SignalHubAdapter] Current connection status - Connected: ${this.connectionStatus}, Current room: ${this.currentRoomId}, Current Peer ID: ${this.currentPeerId}`);
    console.log(`[SignalHubAdapter] Current Socket status: ${this.socket ? this.getReadyStateText(this.socket.readyState) : 'No socket'}`);
    
    // If already connected to the same room, return
    if (this.socket && this.socket.readyState === WebSocket.OPEN && 
        this.currentRoomId === roomId && this.currentPeerId === peerId) {
      console.log('[SignalHubAdapter] Already connected to the same room, skipping duplicate connection');
      return;
    }
    
    // If connecting or already connected to other room/ID, disconnect existing connection first
    if (this.socket) {
      console.log(`[SignalHubAdapter] Existing connection exists, disconnecting existing connection`);
      // Set a flag indicating we're performing a disconnect reconnect
      this.isReconnecting = true;
      await this.disconnect();
      // Ensure reconnect flag is reset after disconnecting
      this.isReconnecting = false;
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Ensure wsBaseUrl has correct protocol prefix
        let baseUrl = this.wsBaseUrl;
        if (!baseUrl.startsWith('ws://') && !baseUrl.startsWith('wss://')) {
          baseUrl = `ws://${baseUrl}`;
        }
        
        // Use WebSocket connection URL that matches backend specification
        const wsUrl = `${baseUrl}/collaboration?roomId=${roomId}&peerId=${peerId}`;
        console.log(`[SignalHubAdapter] Attempting to connect to WebSocket signaling server: ${wsUrl}`);
        
        // Create new WebSocket connection
        this.socket = new WebSocket(wsUrl);
        this.currentRoomId = roomId;
        this.currentPeerId = peerId;
        
        // Start connection timestamp for tracking connection time
        const connectStartTime = Date.now();
        
        this.socket.onopen = () => {
          const connectTime = Date.now() - connectStartTime;
          console.log(`[SignalHubAdapter] WebSocket connection successful - Time: ${connectTime}ms`);
          console.log(`[SignalHubAdapter] Connected to room ${roomId} as ${peerId}`);
          this.connectionStatus = true;
          this.reconnectAttempts = 0;
          
          // Send join event immediately after connection
          console.log(`[SignalHubAdapter] Sending JOIN event`);
          this.joinRoom(roomId, peerId).catch(error => {
            console.error('[SignalHubAdapter] Room join error:', error);
          });
          
          resolve();
        };
        
        this.socket.onmessage = this.handleIncomingMessage.bind(this);
        
        this.socket.onclose = (event) => {
          console.log(`[SignalHubAdapter] WebSocket connection closed - Code: ${event.code}, Reason: ${event.reason}, Normal close: ${event.wasClean}`);
          console.log(`[SignalHubAdapter] Current Room ID: ${this.currentRoomId}, Current Peer ID: ${this.currentPeerId}`);
          this.connectionStatus = false;
          
          // Check if there are active WebRTC connections
          const hasActiveWebRTCConnections = this.checkWebRTCConnections();
          
          // Attempt to reconnect unless it was an intentional close
          if (!this.isReconnecting && event.code !== 1000) {
            console.log(`[SignalHubAdapter] Attempting to reconnect - Non-normal close event: ${event.code}`);
            
            if (hasActiveWebRTCConnections) {
              console.log(`[SignalHubAdapter] Detected active WebRTC connections, WebSocket will attempt to reconnect in the background, but communication will not be affected`);
              
              // If there are WebRTC connections, issue a warning but continue operation
              try {
                this.eventBus.publish({
                  type: 'websocket.closed.webrtc.active',
                  message: 'WebSocket closed, but WebRTC connections remain active',
                  closeCode: event.code,
                  closeReason: event.reason,
                  wasClean: event.wasClean,
                  timestamp: Date.now()
                });
              } catch (err) {
                console.error('[SignalHubAdapter] Error publishing WebSocket closed but WebRTC active event:', err);
              }
            }
            
            this.attemptReconnect();
          } else {
            console.log(`[SignalHubAdapter] Not attempting to reconnect - Reconnect status: ${this.isReconnecting}, Close code: ${event.code}`);
            
            // If it's an intentional close but there are active WebRTC connections, record this status
            if (event.code === 1000 && hasActiveWebRTCConnections) {
              console.log(`[SignalHubAdapter] WebSocket has been normally closed, but WebRTC connections remain active`);
              
              try {
                this.eventBus.publish({
                  type: 'websocket.closed.webrtc.active',
                  message: 'WebSocket intentionally closed, but WebRTC connections remain active',
                  closeCode: event.code,
                  closeReason: event.reason,
                  wasClean: event.wasClean,
                  intentional: true,
                  timestamp: Date.now()
                });
              } catch (err) {
                console.error('[SignalHubAdapter] Error publishing WebSocket intentional close but WebRTC active event:', err);
              }
            }
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('[SignalHubAdapter] WebSocket connection error:', error);
          console.error(`[SignalHubAdapter] Connection error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
          
          // Check if there are active WebRTC connections
          const hasActiveWebRTCConnections = this.checkWebRTCConnections();
          
          if (hasActiveWebRTCConnections) {
            // If there are WebRTC connections, issue a warning but do not interrupt communication
            console.warn('[SignalHubAdapter] WebSocket error occurred, but WebRTC connections remain active, communication will continue');
            
            // Publish error warning event
            try {
              this.eventBus.publish({
                type: 'websocket.error.webrtc.active',
                message: 'WebSocket error occurred, but WebRTC connections remain active',
                error: error.toString(),
                connectionStatus: 'websocket_error_webrtc_active',
                timestamp: Date.now()
              });
            } catch (err) {
              console.error('[SignalHubAdapter] Error publishing WebSocket error but WebRTC active event:', err);
            }
            
            // If connection is not established, do not reject connection Promise
            if (!this.connectionStatus) {
              console.warn('[SignalHubAdapter] WebSocket connection failed, but due to WebRTC active, will not completely reject connection');
              // Resolve Promise with warning flag
              resolve();
            }
          } else {
            // If no WebRTC connections, this is a true error
            if (!this.connectionStatus) {
              reject(new Error('Failed to connect to SignalHub'));
            }
          }
        };
      } catch (error) {
        console.error('[SignalHubAdapter] Connection process error:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Convert WebSocket readyState to readable text
   */
  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING (0)';
      case WebSocket.OPEN:
        return 'OPEN (1)';
      case WebSocket.CLOSING:
        return 'CLOSING (2)';
      case WebSocket.CLOSED:
        return 'CLOSED (3)';
      default:
        return `UNKNOWN (${readyState})`;
    }
  }
  
  /**
   * Join room
   */
  private async joinRoom(roomId: string, peerId: string): Promise<void> {
    console.log('==================================================');
    console.log(`[SignalHubAdapter] [JOIN_MESSAGE] Sending JOIN message`);
    console.log(`[SignalHubAdapter] [JOIN_MESSAGE] Room ID: "${roomId}"`);
    console.log(`[SignalHubAdapter] [JOIN_MESSAGE] Peer ID: "${peerId}"`);
    
    const joinPayload = {
      roomId,
      peerId
    };
    
    console.log(`[SignalHubAdapter] [JOIN_MESSAGE] Complete message: ${JSON.stringify({
      type: ROOM_EVENTS.JOIN,
      payload: joinPayload
    }, null, 2)}`);
    
    await this.send(ROOM_EVENTS.JOIN, joinPayload);
    
    console.log(`[SignalHubAdapter] [JOIN_MESSAGE] JOIN message sent ✅`);
    console.log('==================================================');
  }
  
  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    // Check if maximum retry attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleMaxReconnectAttemptsReached();
      return;
    }
    
    this.scheduleNextReconnectAttempt();
  }
  
  /**
   * Handle scenario when max reconnect attempts are reached
   */
  private handleMaxReconnectAttemptsReached(): void {
    console.error('WebSocket reconnection failed after maximum attempts. Giving up.');
    
    // Check if there are active WebRTC connections
    const hasActiveWebRTCConnections = this.checkWebRTCConnections();
    
    if (hasActiveWebRTCConnections) {
      this.handleMaxAttemptsWithActiveWebRTC();
    } else {
      this.handleMaxAttemptsWithoutWebRTC();
    }
  }
  
  /**
   * Handle max reconnect attempts reached with active WebRTC connections
   */
  private handleMaxAttemptsWithActiveWebRTC(): void {
    console.warn('[SignalHubAdapter] WebSocket connection failed, but WebRTC communication continues');
    
    this.publishReconnectWarningEvent();
    this.notifyConnectionWarningToUI();
    this.scheduleBackgroundReconnect();
  }
  
  /**
   * Publish reconnect warning event
   */
  private publishReconnectWarningEvent(): void {
    try {
      this.eventBus.publish({
        type: 'websocket.reconnect.warning',
        message: 'WebSocket connection failed after max reconnect attempts, but WebRTC communication continues',
        connectionType: 'websocket_disconnected_webrtc_active',
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('[SignalHubAdapter] Error publishing WebSocket reconnect warning event:', err);
    }
  }
  
  /**
   * Notify UI about connection warning
   */
  private notifyConnectionWarningToUI(): void {
    if (!this.subscriptions.has('connection-warning')) {
      return;
    }
    
    const listeners = this.subscriptions.get('connection-warning')!;
    const warningData = {
      warning: 'WebSocket connection is unavailable, but communication continues through WebRTC',
      roomId: this.currentRoomId,
      peerId: this.currentPeerId,
      connectionStatus: 'websocket_disconnected_webrtc_active',
      isWebRTCActive: true,
      timestamp: Date.now()
    };
    
    listeners.forEach(callback => {
      try {
        callback(warningData);
      } catch (err) {
        console.error('[SignalHubAdapter] Error in connection-warning callback:', err);
      }
    });
  }
  
  /**
   * Schedule background reconnect attempt
   */
  private scheduleBackgroundReconnect(): void {
    setTimeout(() => {
      if (!this.connectionStatus && this.currentRoomId && this.currentPeerId) {
        this.reconnectAttempts = 0; // Reset reconnect counter
        this.connect(this.currentRoomId, this.currentPeerId).catch(err => {
          console.warn('[SignalHubAdapter] Background reconnection attempt failed:', err);
        });
      }
    }, 10000); // Try reconnecting in background after 10 seconds
  }
  
  /**
   * Handle max reconnect attempts reached without WebRTC connections
   */
  private handleMaxAttemptsWithoutWebRTC(): void {
    this.isReconnecting = false;
    this.publishReconnectFailedEvent();
  }
  
  /**
   * Publish reconnect failed event
   */
  private publishReconnectFailedEvent(): void {
    try {
      this.eventBus.publish({
        type: 'websocket.reconnect.failed',
        message: 'WebSocket connection failed after max reconnect attempts',
        attempts: this.reconnectAttempts,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('[SignalHubAdapter] Error publishing WebSocket reconnect failed event:', err);
    }
  }
  
  /**
   * Schedule next reconnect attempt with exponential backoff
   */
  private scheduleNextReconnectAttempt(): void {
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    const delay = this.calculateReconnectDelay();
    
    console.log(`[SignalHubAdapter] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    setTimeout(() => this.executeReconnectAttempt(), delay);
  }
  
  /**
   * Calculate reconnect delay using exponential backoff
   */
  private calculateReconnectDelay(): number {
    return Math.min(30000, Math.pow(2, this.reconnectAttempts) * this.reconnectInterval);
  }
  
  /**
   * Execute reconnect attempt
   */
  private executeReconnectAttempt(): void {
    if (!this.currentRoomId || !this.currentPeerId) {
      console.error('[SignalHubAdapter] Cannot reconnect: missing roomId or peerId');
      this.isReconnecting = false;
      return;
    }
    
    console.log(`[SignalHubAdapter] Reconnecting to room ${this.currentRoomId}...`);
    this.connect(this.currentRoomId, this.currentPeerId)
      .catch(error => {
        console.error('[SignalHubAdapter] Reconnection attempt failed:', error);
        this.attemptReconnect();
      });
  }
  
  /**
   * Check if there are active WebRTC connections
   */
  private checkWebRTCConnections(): boolean {
    // More robust method to check if there are active WebRTC connections
    
    // Method 1: Check if offer, answer, ice-candidate messages have been received
    let hasReceivedRTCMessages = false;
    
    const rtcEventTypes = [
      SIGNAL_EVENTS.OFFER,
      SIGNAL_EVENTS.ANSWER,
      SIGNAL_EVENTS.ICE_CANDIDATE
    ];
    
    // Check if WebRTC connection-related messages have been received
    for (const type of rtcEventTypes) {
      if (this.subscriptions.has(type) && this.subscriptions.get(type)!.size > 0) {
        console.log(`[SignalHubAdapter] Detected previous reception of ${type} messages, indicating WebRTC connection may be established`);
        hasReceivedRTCMessages = true;
        break;
      }
    }
    
    // If potential connections found, further check peer-connection-state subscriptions
    if (hasReceivedRTCMessages) {
      // Check if there are peer-connection-state subscribers, which might indicate active connections
      if (this.subscriptions.has(SIGNAL_EVENTS.PEER_CONNECTION_STATE) && 
          this.subscriptions.get(SIGNAL_EVENTS.PEER_CONNECTION_STATE)!.size > 0) {
        console.log(`[SignalHubAdapter] Detected peer-connection-state subscriptions, further confirming WebRTC likely connected`);
        return true;
      }
    }
    
    // If no strong evidence found that WebRTC is connected, publish an event to query current status
    // If any component knows WebRTC status, it can respond to this event
    try {
      this.eventBus.publish({
        type: 'webrtc.connection.status.check',
        timestamp: Date.now()
      });
      console.log(`[SignalHubAdapter] Published WebRTC connection status check event`);
    } catch (err) {
      console.error(`[SignalHubAdapter] Error publishing WebRTC connection status check event:`, err);
    }
    
    // Return result based on existing evidence
    return hasReceivedRTCMessages;
  }
  
  /**
   * Disconnect from signaling server
   */
  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      console.log(`Attempting to disconnect SignalHub connection`);
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        console.log(`No need to disconnect: Socket is null or already closed, socket state: ${this.socket ? this.socket.readyState : 'null'}`);
        this.connectionStatus = false;
        this.currentRoomId = null;
        this.currentPeerId = null;
        resolve();
        return;
      }
      
      // If there's a room ID and peer ID, send leave event
      if (this.currentRoomId && this.currentPeerId && this.socket.readyState === WebSocket.OPEN) {
        console.log(`Sending leave room event: Room ID ${this.currentRoomId}, Peer ID ${this.currentPeerId}`);
        
        try {
          // First save current roomId and peerId in case they're modified by other code during sending
          const roomId = this.currentRoomId;
          const peerId = this.currentPeerId;
          
          this.send(ROOM_EVENTS.LEAVE, {
            roomId,
            peerId
          }).catch(error => {
            console.error(`Error sending leave room event: ${error}`);
          });
        } catch (error) {
          console.error(`Error attempting to send leave message: ${error}`);
        }
      } else {
        console.log(`Not sending leave message: Room ID ${this.currentRoomId}, Peer ID ${this.currentPeerId}, Socket state ${this.socket.readyState}`);
      }
      
      // Save socket reference for use within the function
      const socket = this.socket;
      
      this.socket.onclose = () => {
        console.log(`WebSocket close callback triggered, cleaning up connection state`);
        this.connectionStatus = false;
        this.currentRoomId = null;
        this.currentPeerId = null;
        this.socket = null;
        resolve();
      };
      
      console.log(`Closing WebSocket connection...`);
      socket.close();
    });
  }
  
  /**
   * Send message to signaling hub
   */
  async send(channel: string, data: any): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('SignalHub not connected');
    }
    
    const message = {
      type: channel,
      payload: data
    };
    
    // Add detailed logging
    if (channel === ROOM_EVENTS.JOIN) {
      console.log(`[SignalHubAdapter] [SEND_JOIN] WebSocket readyState: ${this.socket.readyState} (${this.socket.readyState === 1 ? 'OPEN' : 'NOT OPEN'})`);
    }
    
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }
  
  /**
   * Handle incoming message
   */
  private handleIncomingMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const { type, payload } = message;
      
      // Special handling for different message types
      if (type === ROOM_EVENTS.ROOM_STATE) {
        console.log(`[SignalHubAdapter] Received room state:`, payload);
      } else if (type === ROOM_EVENTS.PLAYER_JOINED) {
        console.log(`[SignalHubAdapter] Player joined:`, payload);
      } else if (type === 'error') {
        console.error(`[SignalHubAdapter] Received error:`, payload);
      } else {
        console.log(`[SignalHubAdapter] Received message of type ${type}`);
      }
      
      // Notify subscribers
      if (this.subscriptions.has(type)) {
        const handlers = this.subscriptions.get(type)!;
        handlers.forEach(handler => {
          try {
            handler(payload);
          } catch (error) {
            console.error(`Error in ${type} message handler:`, error);
          }
        });
      }
    } catch (error) {
      console.error(`Failed to process incoming message:`, error);
    }
  }
  
  /**
   * Update connection state
   */
  async updateConnectionState(peerId: string, state: string): Promise<void> {
    await this.send(SIGNAL_EVENTS.CONNECTION_STATE, {
      peerId,
      state
    });
  }
  
  /**
   * Request reconnection with peer
   */
  async requestReconnect(targetPeerId: string): Promise<void> {
    await this.send(SIGNAL_EVENTS.RECONNECT_REQUEST, {
      targetPeerId
    });
  }
  
  /**
   * Subscribe to messages on a specific channel
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    this.subscriptions.get(channel)!.add(callback);
  }
  
  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    const handlers = this.subscriptions.get(channel);
    
    if (handlers) {
      handlers.delete(callback);
      
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }
  
  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connectionStatus;
  }
  
  /**
   * Activate WebRTC fallback mode
   */
  async activateWebRTCFallback(peerId: string): Promise<void> {
    await this.send(WEBRTC_EVENTS.FALLBACK_ACTIVATE, {
      targetPeerId: peerId
    });
  }
  
  /**
   * Relay data through the server
   */
  async relayData(targetPeerId: string, data: any): Promise<void> {
    await this.send(WEBRTC_EVENTS.RELAY_DATA, {
      targetPeerId,
      data
    });
  }
  
  /**
   * Send ICE candidate
   */
  async sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.send(SIGNAL_EVENTS.ICE_CANDIDATE, {
      to: targetPeerId,
      from: this.currentPeerId,
      candidate
    });
  }
  
  /**
   * Send WebRTC offer
   */
  async sendOffer(targetPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    await this.send(SIGNAL_EVENTS.OFFER, {
      to: targetPeerId,
      from: this.currentPeerId,
      offer
    });
  }
  
  /**
   * Send WebRTC answer
   */
  async sendAnswer(targetPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    await this.send(SIGNAL_EVENTS.ANSWER, {
      to: targetPeerId,
      from: this.currentPeerId,
      answer
    });
  }
  
  /**
   * Subscribe to WebRTC fallback suggestion events
   */
  onWebRTCFallbackSuggested(callback: (data: { peerId: string, reason: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_SUGGESTED, callback);
  }
  
  /**
   * Subscribe to WebRTC fallback requirement events
   */
  onWebRTCFallbackNeeded(callback: (data: { peerId: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_NEEDED, callback);
  }
  
  /**
   * Subscribe to WebRTC fallback activation events
   */
  onWebRTCFallbackActivated(callback: (data: { peerId: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_ACTIVATED, callback);
  }
  
  /**
   * Subscribe to relay data events
   */
  onRelayData(callback: (data: { from: string, payload: any }) => void): void {
    this.subscribe(WEBRTC_EVENTS.RELAY_DATA, callback);
  }
  
  /**
   * Subscribe to room state events
   */
  onRoomState(callback: (data: any) => void): void {
    this.subscribe(ROOM_EVENTS.ROOM_STATE, callback);
  }
  
  /**
   * Subscribe to player join events
   */
  onPlayerJoined(callback: (data: { peerId: string, roomId: string, totalPlayers: number, isRoomOwner: boolean }) => void): void {
    this.subscribe(ROOM_EVENTS.PLAYER_JOINED, callback);
  }
  
  /**
   * Subscribe to player leave events
   */
  onPlayerLeft(callback: (data: { peerId: string, roomId: string }) => void): void {
    this.subscribe(ROOM_EVENTS.PLAYER_LEFT, callback);
  }
  
  /**
   * Subscribe to ICE candidate events
   */
  onIceCandidate(callback: (data: { from: string, candidate: RTCIceCandidateInit }) => void): void {
    this.subscribe(SIGNAL_EVENTS.ICE_CANDIDATE, callback);
  }
  
  /**
   * Subscribe to offer events
   */
  onOffer(callback: (data: { from: string, offer: RTCSessionDescriptionInit }) => void): void {
    this.subscribe(SIGNAL_EVENTS.OFFER, callback);
  }
  
  /**
   * Subscribe to answer events
   */
  onAnswer(callback: (data: { from: string, answer: RTCSessionDescriptionInit }) => void): void {
    this.subscribe(SIGNAL_EVENTS.ANSWER, callback);
  }
  
  /**
   * Subscribe to reconnect needed events
   */
  onReconnectNeeded(callback: (data: { from: string }) => void): void {
    this.subscribe(SIGNAL_EVENTS.RECONNECT_NEEDED, callback);
  }
  
  /**
   * Subscribe to peer connection state events
   */
  onPeerConnectionState(callback: (data: { peerId: string, state: string }) => void): void {
    this.subscribe(SIGNAL_EVENTS.PEER_CONNECTION_STATE, callback);
  }
  
  /**
   * Handle connection error
   */
  private handleConnectionError(error: any): void {
    console.error(`[SignalHubAdapter] Connection error:`, error);
    // Additional error handling logic can be implemented here
  }
} 
