import { injectable, inject } from 'inversify';
import { SignalingService } from '../domain/interfaces/SignalingService';
import { PeerId } from '../domain/value-objects/PeerId';
import { RoomId } from '../domain/value-objects/RoomId';
import { ConnectionState } from '../domain/value-objects/ConnectionState';
import { TYPES } from '../../../core/di/types';
import { ApiConfig } from '../../../core/api/ApiConfig';

/**
 * WebSocket Signaling Service Implementation
 * Responsible for handling communication with the signaling server for WebRTC connection establishment
 */
@injectable()
export class WebSocketSignalingService implements SignalingService {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, ((message: any) => void)[]> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setTimeout> | null = null;
  private heartbeatMs = 30000; // 30 seconds
  
  // Signaling server base URL, using ApiConfig
  private baseUrl = `ws://${ApiConfig.wsUrl.replace(/^https?:\/\//, '')}`;
  
  // Current room and peer ID
  private roomId: string | null = null;
  private peerId: string | null = null;
  
  /**
   * Constructor
   */
  constructor() {
    // Configure WebSocket URL based on environment
    if (process.env.NODE_ENV === 'production') {
      // Use secure wss protocol in production
      this.baseUrl = `wss://${ApiConfig.wsUrl.replace(/^https?:\/\//, '')}`;
    }
    console.log('WebSocketSignalingService baseUrl:', this.baseUrl);
  }

  /**
   * Connect to signaling server
   * @param roomId Room ID
   * @param peerId Local peer ID
   */
  async connect(roomId: RoomId, peerId: PeerId): Promise<boolean> {
    // Check input parameters
    if (!roomId || !peerId) {
      console.error('%cConnection failed %c- roomId or peerId is empty', 
        'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #e74c3c; font-weight: bold;');
      console.error('%croomId: %c' + (roomId?.toString() || 'undefined'), 
        'color: #7f8c8d;', roomId ? 'color: #2c3e50;' : 'color: #e74c3c; font-weight: bold;');
      console.error('%cpeerId: %c' + (peerId?.toString() || 'undefined'), 
        'color: #7f8c8d;', peerId ? 'color: #2c3e50;' : 'color: #e74c3c; font-weight: bold;');
      return false;
    }
    
    // Get string values and perform additional checks
    const roomIdStr = roomId.toString();
    const peerIdStr = peerId.toString();
    
    console.log('%cConnection parameter check %c- Room ID: %c"' + roomIdStr + '"%c, Peer ID: %c"' + peerIdStr + '"', 
      'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;',
      'color: #2c3e50;',
      'color: #27ae60; font-weight: bold;',
      'color: #2c3e50;',
      'color: #8e44ad; font-weight: bold;');
    
    if (!roomIdStr || !peerIdStr || roomIdStr === 'null' || peerIdStr === 'null') {
      console.error('%cConnection failed %c- roomIdStr or peerIdStr is invalid', 
        'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #e74c3c; font-weight: bold;');
      console.error('%croomIdStr: %c"' + roomIdStr + '"', 
        'color: #7f8c8d;', 
        (roomIdStr && roomIdStr !== 'null') ? 'color: #2c3e50;' : 'color: #e74c3c; font-weight: bold;');
      console.error('%cpeerIdStr: %c"' + peerIdStr + '"', 
        'color: #7f8c8d;', 
        (peerIdStr && peerIdStr !== 'null') ? 'color: #2c3e50;' : 'color: #e74c3c; font-weight: bold;');
      return false;
    }
    
    // Hold the passed roomId and peerId for reconnection
    this.roomId = roomIdStr;
    this.peerId = peerIdStr;
    
    // Check if already connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('%cWebSocket already connected', 
        'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;');
      return true;
    }
    
    // Start reconnection
    if (this.socket) {
      this.closeWebSocket();
    }
    
    // Build WebSocket URL
    const wsUrl = this.buildWebSocketUrl(this.roomId, this.peerId);
    
    // Check built URL
    if (!wsUrl || !wsUrl.startsWith('ws')) {
      console.error('%cInvalid WebSocket URL: %c' + wsUrl, 
        'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #e74c3c; font-weight: bold;');
      return false;
    }
    
    console.log('%cConnecting to WebSocket %c- URL: %c' + wsUrl, 
      'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;',
      'color: #2c3e50;',
      'color: #2c3e50; font-weight: bold;');
    
    // Set connection state
    this.connectionState = ConnectionState.CONNECTING;
    
    return new Promise((resolve) => {
      try {
        // Create WebSocket instance
        this.socket = new WebSocket(wsUrl);
        
        // Connection timeout handling
        const timeoutId = setTimeout(() => {
          if (this.connectionState !== ConnectionState.CONNECTED) {
            console.error('%cWebSocket connection timeout', 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            this.connectionState = ConnectionState.ERROR;
            resolve(false);
          }
        }, 10000);
        
        // Define WebSocket event handlers
        this.socket.onopen = () => {
          console.log('%c===== WebSocket connection established =====', 
            'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;');
          this.connectionState = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          clearTimeout(timeoutId);
          
          // Check roomId and peerId validity again before sending JOIN message
          if (!this.roomId || !this.peerId || this.roomId === 'null' || this.peerId === 'null') {
            console.error('%cCannot send JOIN message %c- invalid roomId or peerId', 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #e74c3c; font-weight: bold;');
            console.error('%croomId: %c"' + this.roomId + '"', 
              'color: #7f8c8d;', 
              (this.roomId && this.roomId !== 'null') ? 'color: #2c3e50;' : 'color: #e74c3c; font-weight: bold;');
            console.error('%cpeerId: %c"' + this.peerId + '"', 
              'color: #7f8c8d;', 
              (this.peerId && this.peerId !== 'null') ? 'color: #2c3e50;' : 'color: #e74c3c; font-weight: bold;');
            resolve(false);
            return;
          }
          
          // Make sure the held values are strings, not null or undefined
          this.roomId = this.roomId || '';
          this.peerId = this.peerId || '';
          
          // Send join room message according to exact format, consistent with SignalHubAdapter
          console.log(`%c[JOIN_MESSAGE] %cPreparing to send JOIN message %c- Room ID: "${this.roomId}", Peer ID: "${this.peerId}"`, 
            'background: #2980b9; color: white; padding: 2px 5px; border-radius: 3px;',
            'color: #2c3e50;',
            'color: #2c3e50; font-weight: bold;');
          
          // Use the exact same JOIN message format as SignalHubAdapter.joinRoom()
          const joinMessage = {
            type: 'join',
            payload: {
              roomId: this.roomId,
              peerId: this.peerId
            }
          };
          
          // Output detailed JOIN message content
          console.log('%c[JOIN_MESSAGE] Complete JOIN message content: %c' + JSON.stringify(joinMessage, null, 2), 
            'color: #3498db; font-weight: bold;', 'color: #2c3e50;');
          
          const joinSuccess = this.sendMessage(joinMessage);
          
          if (!joinSuccess) {
            console.error('%c[JOIN_MESSAGE] ❌ JOIN message sending failed', 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
          } else {
            console.log('%c[JOIN_MESSAGE] ✅ JOIN message sent successfully', 
              'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;');
            
            // Test connection immediately after JOIN message sent successfully
            setTimeout(async () => {
              const testSuccess = await this.testConnection();
              console.log(`%c[WebSocketSignalingService] %cConnection test result: ${testSuccess ? '✅ Success' : '❌ Failed'}`, 
                'color: #3498db; font-weight: bold;', 
                testSuccess ? 'color: #27ae60; font-weight: bold;' : 'color: #e74c3c; font-weight: bold;');
            }, 500);
          }
          
          resolve(true);
        };
        
        // Connection closed handling
        this.socket.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          this.connectionState = ConnectionState.DISCONNECTED;
          this.stopHeartbeat();
          
          // If it's not a normal closure, try to reconnect
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('WebSocket reconnection failed, reached maximum retry attempts');
            this.notifyConnectionFailed();
          }
        };
        
        // Connection error handling
        this.socket.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          this.connectionState = ConnectionState.ERROR;
          
          // Check if WebRTC connection is already established
          const isWebRTCConnected = this.checkWebRTCConnectionStatus();
          
          if (isWebRTCConnected) {
            // If WebRTC is connected, it's not considered a fatal error
            console.warn('%c[WebSocketSignalingService] %cWebSocket error occurred, but WebRTC communication continues',
              'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #f39c12; font-weight: bold;');
            
            // You can choose to notify the user, but continue running
            if (this.messageHandlers.has('websocket-error')) {
              const handlers = this.messageHandlers.get('websocket-error')!;
              const errorPayload = {
                warning: 'WebSocket connection has issues, but communication continues through WebRTC',
                isWebRTCActive: true
              };
              
              handlers.forEach(handler => {
                try {
                  handler(errorPayload);
                } catch (err) {
                  console.error('Error handling WebSocket error event:', err);
                }
              });
            }
            
            // In the case of WebRTC connection, WebSocket error won't cause Promise rejection
            if (this.socket?.readyState === WebSocket.CONNECTING) {
              // If connection hasn't been established yet, return true, indicating it can continue
              resolve(true);
            }
          } else {
            // WebRTC not connected, this is a fatal error
            if (this.socket?.readyState === WebSocket.CONNECTING) {
              resolve(false);
            }
            
            this.handleConnectionError(error);
          }
        };
        
        // Message handling
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleIncomingMessage(message);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        this.connectionState = ConnectionState.ERROR;
        resolve(false);
      }
    });
  }

  /**
   * Close WebSocket connection
   * @private
   */
  private closeWebSocket(): void {
    if (this.socket) {
      console.log('%cClosing WebSocket connection', 
        'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
      
      // Remove event listeners
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      
      // Close connection
      if (this.socket.readyState === WebSocket.OPEN || 
          this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    // Stop heartbeat detection
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    console.log('%cDisconnecting WebSocket connection', 
      'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
    
    return new Promise<void>((resolve) => {
      this.closeWebSocket();
      this.connectionState = ConnectionState.DISCONNECTED;
      
      // Reset room ID and peer ID
      this.roomId = null;
      this.peerId = null;
      
      resolve();
    });
  }

  /**
   * Register event handler
   * @param eventType Event type
   * @param handler Handler function
   */
  on(eventType: string, handler: (message: any) => void): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    
    this.messageHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   * @param eventType Event type
   * @param handler Handler function
   */
  off(eventType: string, handler: (message: any) => void): void {
    if (!this.messageHandlers.has(eventType)) {
      return;
    }
    
    const handlers = this.messageHandlers.get(eventType)!;
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      
      if (handlers.length === 0) {
        this.messageHandlers.delete(eventType);
      }
    }
  }

  /**
   * Send message
   * @param message Message to send
   * @returns Promise that resolves when message is sent
   */
  async sendMessage(message: any): Promise<void> {
    // Check if socket is available and connected
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('%cCannot send message %c- WebSocket not connected', 
        'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #e74c3c; font-weight: bold;');
      console.error('%cSocket state: %c' + (this.socket ? this.socket.readyState : 'null'), 
        'color: #7f8c8d;', 'color: #e74c3c; font-weight: bold;');
      throw new Error('WebSocket not connected');
    }
    
    try {
      // If message is not a string, stringify it
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      
      console.log('%c[SEND_MESSAGE] %cSending message via WebSocket %c- Type: ' + (typeof message === 'string' ? 'string' : 'object'), 
        'background: #2980b9; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #2c3e50;',
        'color: #2c3e50; font-weight: bold;');
      console.log('%c[SEND_MESSAGE] Message content: %c' + messageStr, 
        'color: #3498db; font-weight: bold;', 'color: #2c3e50;');
      
      // Send message
      this.socket.send(messageStr);
      
      console.log('%c[SEND_MESSAGE] ✅ Message sent successfully', 
        'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;');
    } catch (error) {
      console.error('%c[SEND_MESSAGE] ❌ Message sending failed %c- Error: ' + error, 
        'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #e74c3c; font-weight: bold;');
      throw error;
    }
  }

  /**
   * Send Offer to remote peer
   * @param to Target peer ID
   * @param offer WebRTC offer
   */
  async sendOffer(to: PeerId, offer: RTCSessionDescriptionInit): Promise<void> {
    const message = {
      type: 'offer',
      payload: {
        to: to.toString(),
        offer: offer
      }
    };
    
    console.log(`%c[sendOffer] %cSending Offer to peer: ${to.toString()}`, 
      'color: #e67e22; font-weight: bold;', 'color: #2c3e50;');
    
    await this.sendMessage(message);
  }
  
  /**
   * Send Answer to remote peer
   * @param to Target peer ID
   * @param answer WebRTC answer
   */
  async sendAnswer(to: PeerId, answer: RTCSessionDescriptionInit): Promise<void> {
    const message = {
      type: 'answer',
      payload: {
        to: to.toString(),
        answer: answer
      }
    };
    
    console.log(`%c[sendAnswer] %cSending Answer to peer: ${to.toString()}`, 
      'color: #27ae60; font-weight: bold;', 'color: #2c3e50;');
    
    await this.sendMessage(message);
  }
  
  /**
   * Send ICE Candidate to remote peer
   * @param to Target peer ID
   * @param candidate ICE candidate
   */
  async sendIceCandidate(to: PeerId, candidate: RTCIceCandidate): Promise<void> {
    const message = {
      type: 'ice-candidate',
      payload: {
        to: to.toString(),
        candidate: candidate
      }
    };
    
    console.log(`%c[sendIceCandidate] %cSending ICE Candidate to peer: ${to.toString()}`, 
      'color: #9b59b6; font-weight: bold;', 'color: #2c3e50;');
    
    await this.sendMessage(message);
  }
  
  /**
   * Activate fallback mode for peer
   * @param to Target peer ID
   */
  async activateFallback(to: PeerId): Promise<void> {
    const message = {
      type: 'webrtc-fallback-activate',
      payload: {
        to: to.toString()
      }
    };
    
    console.log(`%c[activateFallback] %cActivating fallback for peer: ${to.toString()}`, 
      'color: #f39c12; font-weight: bold;', 'color: #2c3e50;');
    
    await this.sendMessage(message);
  }
  
  /**
   * Relay data to peer via signaling server
   * @param to Target peer ID
   * @param channel Data channel name
   * @param data Data to relay
   * @returns Promise<boolean> indicating success
   */
  async relayData(to: PeerId, channel: string, data: any): Promise<boolean> {
    const message = {
      type: 'relay-data',
      payload: {
        to: to.toString(),
        payload: {
          channel: channel,
          data: data
        }
      }
    };
    
    console.log(`%c[relayData] %cRelaying data to peer: ${to.toString()}, channel: ${channel}`, 
      'color: #3498db; font-weight: bold;', 'color: #2c3e50;');
    
    try {
      await this.sendMessage(message);
      return true;
    } catch (error) {
      console.error(`Failed to relay data to peer ${to.toString()}:`, error);
      return false;
    }
  }
  
  /**
   * Send reconnection request to peer
   * @param to Target peer ID
   */
  async sendReconnectRequest(to: PeerId): Promise<void> {
    const message = {
      type: 'reconnect-request',
      payload: {
        to: to.toString()
      }
    };
    
    console.log(`%c[sendReconnectRequest] %cSending reconnect request to peer: ${to.toString()}`, 
      'color: #e74c3c; font-weight: bold;', 'color: #2c3e50;');
    
    await this.sendMessage(message);
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Handle incoming message
   * @param message Incoming message
   */
  private handleIncomingMessage(message: any): void {
    const { type, payload } = message;
    
    // Display received all messages (including complete original message content)
    console.log(`%c[RECEIVED] %cReceived WebSocket message, type: %c${type}`, 
      'background: #16a085; color: white; padding: 2px 5px; border-radius: 3px;',
      'color: #2c3e50;',
      'color: #2c3e50; font-weight: bold;');
    
    // Display complete message content
    console.log('%c[RECEIVED_MESSAGE_DETAILS] %cComplete message content: %c' + JSON.stringify(message, null, 2), 
      'background: #8e44ad; color: white; padding: 2px 5px; border-radius: 3px;',
      'color: #7f8c8d;', 
      'color: #2c3e50; font-weight: bold;');
    
    // Handle heartbeat response
    if (type === 'pong') {
      return;
    }
    
    // Detailed logging for specific type messages
    if (type === 'room-state' || type === 'player-joined' || type === 'error' || type === 'room-stats') {
      console.log('%c==================================================', 'color: #16a085;');
      console.log(`%c[MESSAGE_TYPE: ${type.toUpperCase()}] %cDetailed content:`, 
        'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #2c3e50; font-weight: bold;');
      
      // Display payload in a beautified way
      console.log('%c' + JSON.stringify(payload, null, 2), 
        'color: #2c3e50; background: #ecf0f1; padding: 5px; border-radius: 3px; border-left: 3px solid #3498db;');
      
      console.log('%c==================================================', 'color: #16a085;');
      
      // Special handling for room-stats type to trigger notification
      if (type === 'room-stats') {
        // Call "server-stats" message subscribers, which can be subscribed in CollabRoom
        if (this.messageHandlers.has('server-stats')) {
          const handlers = this.messageHandlers.get('server-stats')!;
          for (const handler of handlers) {
            try {
              handler({
                type: 'room-stats',
                timestamp: new Date(),
                data: payload
              });
            } catch (err) {
              console.error('Error handling server-stats message:', err);
            }
          }
        }
      }
    }
    
    // Handle system messages
    switch (type) {
      case 'error':
        console.error('%cReceived error message: %c' + JSON.stringify(payload), 
          'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #e74c3c;');
        break;
        
      case 'room-state':
        console.log('%cReceived room state: %c' + JSON.stringify(payload), 
          'background: #2980b9; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
        break;
        
      case 'room-stats':
        console.log('%cReceived room statistics data: %c' + JSON.stringify(payload), 
          'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
        
        // Ensure correct triggering of room-stats event handler
        if (this.messageHandlers.has('room-stats')) {
          const handlers = this.messageHandlers.get('room-stats')!;
          for (const handler of handlers) {
            try {
              handler(payload);
            } catch (err) {
              console.error('%cError handling room-stats message: %c' + err, 
                'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', 
                'color: #e74c3c;');
            }
          }
        }
        break;
        
      case 'player-joined':
        console.log('%cPlayer joined room: %c' + JSON.stringify(payload), 
          'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
        break;
        
      case 'player-left':
        console.log('%cPlayer left room: %c' + JSON.stringify(payload), 
          'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
        break;
        
      case 'server-message':
        console.log('%cReceived server message: %c' + JSON.stringify(payload), 
          'background: #8e44ad; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
        break;
        
      default:
        console.log('%cReceived other type message: %c[' + type + '] ' + JSON.stringify(payload), 
          'background: #7f8c8d; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
    }
    
    // Call registered event handlers
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)!;
      
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`%cError handling ${type} message: %c${err}`, 
            'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', 
            'color: #e74c3c;');
        }
      }
    }
  }

  /**
   * Build WebSocket URL
   * @param roomId Room ID
   * @param peerId Peer ID
   */
  private buildWebSocketUrl(roomId: string, peerId: string): string {
    // Ensure roomId and peerId are not empty
    if (!roomId || !peerId) {
      console.error('[WebSocketSignalingService] roomId or peerId is empty', { roomId, peerId });
    }
    
    // Use original values directly, no URL encoding, consistent with SignalHubAdapter
    const url = `${this.baseUrl}/collaboration?roomId=${roomId}&peerId=${peerId}`;
    
    console.log('[WebSocketSignalingService] Building WebSocket URL:', url);
    return url;
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'ping',
          payload: {
            timestamp: Date.now()
          }
        });
      }
    }, this.heartbeatMs);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    
    console.log(`Scheduling reconnection in ${delay}ms, attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.roomId && this.peerId) {
        const roomId = RoomId.fromString(this.roomId);
        const peerId = PeerId.fromString(this.peerId);
        
        this.connect(roomId, peerId)
          .catch(err => console.error('Reconnection failed:', err));
      }
    }, delay);
  }

  /**
   * Notify connection failure
   */
  private notifyConnectionFailed(): void {
    // Regardless of the type of error, first check if WebRTC is connected
    const isWebRTCConnected = this.checkWebRTCConnectionStatus();
    
    if (isWebRTCConnected) {
      // WebRTC is connected, just display warning notification, no communication interruption
      const webRTCPayload = {
        warning: 'WebSocket connection failed, but WebRTC communication continues',
        roomId: this.roomId,
        peerId: this.peerId,
        // Set flag to indicate this is just a warning, WebRTC is still working
        isWebRTCActive: true,
        connectionStatus: 'websocket_disconnected_webrtc_active'
      };
      
      console.warn('%c[WebSocketSignalingService] %cWebSocket connection failed, but WebRTC communication continues',
        'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #f39c12; font-weight: bold;');
        
      // Trigger specific warning event
      if (this.messageHandlers.has('websocket-warning')) {
        const handlers = this.messageHandlers.get('websocket-warning')!;
        
        for (const handler of handlers) {
          try {
            handler(webRTCPayload);
          } catch (err) {
            console.error('Error handling WebSocket warning notification:', err);
          }
        }
      }
      
      // Also trigger connection failure event, but with WebRTC active flag
      if (this.messageHandlers.has('connection-failed')) {
        const handlers = this.messageHandlers.get('connection-failed')!;
        
        for (const handler of handlers) {
          try {
            handler(webRTCPayload);
          } catch (err) {
            console.error('Error handling connection failure notification:', err);
          }
        }
      }
      
      // Continue trying to reconnect WebSocket in the background, without affecting user experience
      setTimeout(() => this.attemptBackgroundReconnect(), 10000);
    } else {
      // WebRTC not connected, this is a true connection failure
      console.error('%c[WebSocketSignalingService] %cWebSocket connection failed, cannot communicate with other participants',
        'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #e74c3c; font-weight: bold;');
      
      const payload = {
        error: 'WebSocket connection failed: Unknown error',
        roomId: this.roomId,
        peerId: this.peerId
      };
      
      if (this.messageHandlers.has('connection-failed')) {
        const handlers = this.messageHandlers.get('connection-failed')!;
        
        for (const handler of handlers) {
          try {
            handler(payload);
          } catch (err) {
            console.error('Error handling connection failure notification:', err);
          }
        }
      }
    }
  }
  
  /**
   * Attempt background reconnection, without affecting user experience
   */
  private attemptBackgroundReconnect(): void {
    // Check if reconnection is still needed
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[WebSocketSignalingService] Attempting background reconnection to WebSocket');
      
      // Reset reconnection attempts, for more retry opportunities
      this.reconnectAttempts = 0;
      
      if (this.roomId && this.peerId) {
        const roomId = RoomId.fromString(this.roomId);
        const peerId = PeerId.fromString(this.peerId);
        
        this.connect(roomId, peerId)
          .then(success => {
            if (success) {
              console.log('[WebSocketSignalingService] WebSocket background reconnection successful');
              
              // Publish reconnection success event
              if (this.messageHandlers.has('reconnect-success')) {
                const handlers = this.messageHandlers.get('reconnect-success')!;
                
                handlers.forEach(handler => {
                  try {
                    handler({
                      message: 'WebSocket connection restored',
                      roomId: this.roomId,
                      peerId: this.peerId
                    });
                  } catch (err) {
                    console.error('Error handling reconnection success notification:', err);
                  }
                });
              }
            } else {
              console.warn('[WebSocketSignalingService] WebSocket background reconnection failed, but WebRTC is still running');
              // Continue trying to reconnect periodically
              setTimeout(() => this.attemptBackgroundReconnect(), 30000); // Try again in 30 seconds
            }
          })
          .catch(err => {
            console.warn('[WebSocketSignalingService] WebSocket background reconnection error:', err);
            // Continue trying to reconnect periodically
            setTimeout(() => this.attemptBackgroundReconnect(), 30000); // Try again in 30 seconds
          });
      }
    }
  }

  /**
   * Handle connection error
   * @param error Error object
   */
  private handleConnectionError(error: any): void {
    console.error('[WebSocketSignalingService] WebSocket connection error:', error);
    
    // Check if WebRTC connection is already established
    const isWebRTCConnected = this.checkWebRTCConnectionStatus();
    
    if (isWebRTCConnected) {
      // WebRTC is connected, just display warning
      console.warn('[WebSocketSignalingService] WebSocket connection error, but WebRTC communication will continue');
      
      // Trigger specific warning event
      if (this.messageHandlers.has('websocket-error')) {
        const handlers = this.messageHandlers.get('websocket-error')!;
        const errorPayload = {
          warning: 'WebSocket connection error, but WebRTC communication continues',
          roomId: this.roomId,
          peerId: this.peerId,
          isWebRTCActive: true,
          error: error?.message || 'Unknown error',
          connectionStatus: 'websocket_error_webrtc_active'
        };
        
        handlers.forEach(handler => {
          try {
            handler(errorPayload);
          } catch (err) {
            console.error('Error handling WebSocket warning:', err);
          }
        });
      }
      
      // Try to reconnect in the background
      setTimeout(() => this.attemptBackgroundReconnect(), 5000);
    } else {
      // WebRTC not connected, this is a true error
      this.connectionState = ConnectionState.ERROR;
      
      // Trigger error event
      if (this.messageHandlers.has('connection-error')) {
        const handlers = this.messageHandlers.get('connection-error')!;
        const errorPayload = {
          error: 'WebSocket connection error: ' + (error?.message || 'Unknown error'),
          roomId: this.roomId,
          peerId: this.peerId
        };
        
        handlers.forEach(handler => {
          try {
            handler(errorPayload);
          } catch (err) {
            console.error('Error handling connection error notification:', err);
          }
        });
      }
    }
  }

  /**
   * Handle unknown connection error, especially "Connection failed: Unknown error"
   * Regardless of what error occurs, as long as WebRTC connection exists, communication won't be interrupted
   */
  private handleUnknownConnectionError(): void {
    console.error('[WebSocketSignalingService] Unknown connection error occurred');
    
    // Check WebRTC connection status
    const isWebRTCConnected = this.checkWebRTCConnectionStatus();
    
    if (isWebRTCConnected) {
      // WebRTC is connected, issue warning but don't interrupt communication
      console.warn('[WebSocketSignalingService] Unknown connection error occurred, but WebRTC communication continues');
      
      const warningPayload = {
        warning: 'Unknown connection error occurred, but WebRTC communication continues',
        roomId: this.roomId,
        peerId: this.peerId,
        isWebRTCActive: true,
        connectionStatus: 'unknown_error_webrtc_active',
        timestamp: Date.now()
      };
      
      // Publish warning event
      if (this.messageHandlers.has('connection-warning')) {
        const handlers = this.messageHandlers.get('connection-warning')!;
        
        handlers.forEach(handler => {
          try {
            handler(warningPayload);
          } catch (err) {
            console.error('Error handling connection warning notification:', err);
          }
        });
      }
      
      // Try to reconnect in the background
      setTimeout(() => this.attemptBackgroundReconnect(), 5000);
    } else {
      // WebRTC not connected, this is a fatal error
      this.connectionState = ConnectionState.ERROR;
      
      // Publish error event
      if (this.messageHandlers.has('connection-error')) {
        const handlers = this.messageHandlers.get('connection-error')!;
        
        handlers.forEach(handler => {
          try {
            handler({
              error: 'Unknown connection error',
              roomId: this.roomId,
              peerId: this.peerId,
              connectionStatus: 'connection_lost',
              timestamp: Date.now()
            });
          } catch (err) {
            console.error('Error handling connection error notification:', err);
          }
        });
      }
    }
  }

  /**
   * Check WebRTC connection status
   * Through sending event query to CollaborationModule to check current WebRTC connection status
   * @returns If WebRTC connection is established, return true, otherwise return false
   */
  private checkWebRTCConnectionStatus(): boolean {
    // Establish a more robust way to detect WebRTC connection activity
    
    // Check if previously received any WebRTC related messages, indicating connection process has started
    const rtcEventTypes = ['offer', 'answer', 'ice-candidate'];
    let hasReceivedRTCMessages = false;
    
    for (const eventType of rtcEventTypes) {
      if (this.messageHandlers.has(eventType) && 
          this.messageHandlers.get(eventType)!.length > 0) {
        hasReceivedRTCMessages = true;
        break;
      }
    }
    
    // If no WebRTC related messages received, assume connection hasn't been established
    if (!hasReceivedRTCMessages) {
      console.log('[WebSocketSignalingService] Detected no WebRTC connection messages received, assuming WebRTC not connected');
      return false;
    }
    
    // If received WebRTC messages, assume connection has been established
    console.log('[WebSocketSignalingService] Detected WebRTC connection possibly established, need to consider maintaining communication');
    return true;
  }

  /**
   * Send test message to confirm connection is working normally
   */
  private async testConnection(): Promise<boolean> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.roomId || !this.peerId) {
      console.error('[WebSocketSignalingService] Cannot send test message: Not connected or missing roomId/peerId');
      return false;
    }
    
    console.log('[WebSocketSignalingService] Sending test message');
    
    // Send a simple ping message
    const testSuccess = this.sendMessage({
      type: 'ping',
      payload: {
        timestamp: Date.now(),
        roomId: this.roomId,
        peerId: this.peerId
      }
    });
    
    if (!testSuccess) {
      console.error('[WebSocketSignalingService] Test message sending failed');
      return false;
    }
    
    return true;
  }
} 




