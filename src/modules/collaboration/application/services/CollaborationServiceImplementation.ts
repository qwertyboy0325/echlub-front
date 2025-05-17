import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { CollaborationService } from './CollaborationService';
import type { SignalingService } from '../../domain/interfaces/SignalingService';
import type { PeerConnectionManager } from '../../domain/interfaces/PeerConnectionManager';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import type { ICollaborationApiAdapter } from '../../infrastructure/adapters/ICollaborationApiAdapter';

@injectable()
export class CollaborationServiceImplementation implements CollaborationService {
  private localPeerId: PeerId | null = null;
  private currentRoomId: RoomId | null = null;
  private initialized = false;
  
  constructor(
    @inject(CollaborationTypes.SignalingService)
    private readonly signalingService: SignalingService,
    
    @inject(CollaborationTypes.PeerConnectionManager)
    private readonly peerConnectionManager: PeerConnectionManager,
    
    @inject(CollaborationTypes.CollaborationApiAdapter)
    private readonly collaborationApiAdapter: ICollaborationApiAdapter,
    
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  async initialize(peerId: PeerId): Promise<void> {
    if (this.initialized && this.localPeerId && this.localPeerId.equals(peerId)) {
      console.log(`Collaboration service already initialized, PeerId: ${peerId.toString()}`);
      return;
    }
    
    this.localPeerId = peerId;
    await this.peerConnectionManager.initialize(peerId);
    
    // Register signaling service event handlers
    this.registerSignalingEventHandlers();
    
    this.initialized = true;
    console.log(`Collaboration service initialized, PeerId: ${peerId.toString()}`);
  }

  /**
   * Register signaling service event handlers
   */
  private registerSignalingEventHandlers(): void {
    // Register room state update event handler
    this.signalingService.on('room-state', this.handleRoomState.bind(this));
    
    // Register player joined event handler
    this.signalingService.on('player-joined', this.handlePlayerJoined.bind(this));
    
    // Register player left event handler
    this.signalingService.on('player-left', this.handlePlayerLeft.bind(this));
    
    // Register connection failed event handler
    this.signalingService.on('connection-failed', this.handleConnectionFailed.bind(this));
  }

  /**
   * Handle room state message
   * @param payload Room state message
   */
  private handleRoomState(payload: any): void {
    console.log('[CollaborationService] Received room state update:', payload);
    
    if (!payload || !payload.roomId) return;
    
    // Publish room state update event
    this.eventBus.emit('collab.room-state-updated', payload);
  }

  /**
   * Handle player joined message
   * @param payload Player joined message
   */
  private handlePlayerJoined(payload: any): void {
    console.log('[CollaborationService] Player joined room:', payload);
    
    if (!payload || !payload.peerId) return;
    
    // If it's a new player, establish connection with that player
    if (this.localPeerId && payload.peerId !== this.localPeerId.toString()) {
      const remotePeerId = PeerId.fromString(payload.peerId);
      
      // Initiate connection
      this.peerConnectionManager.connect(remotePeerId, true)
        .catch(err => console.error(`[CollaborationService] Cannot connect to newly joined player ${payload.peerId}:`, err));
    }
    
    // Publish player joined event
    this.eventBus.emit('collab.player-joined', payload);
  }

  /**
   * Handle player left message
   * @param payload Player left message
   */
  private handlePlayerLeft(payload: any): void {
    console.log('[CollaborationService] Player left room:', payload);
    
    if (!payload || !payload.peerId) return;
    
    // If there's a connection with this player, disconnect
    if (this.localPeerId && payload.peerId !== this.localPeerId.toString()) {
      const remotePeerId = PeerId.fromString(payload.peerId);
      this.peerConnectionManager.disconnect(remotePeerId)
        .catch(err => console.error(`[CollaborationService] Error disconnecting from player ${payload.peerId} who left:`, err));
    }
    
    // Publish player left event
    this.eventBus.emit('collab.player-left', payload);
  }

  /**
   * Handle connection failed message
   * @param payload Connection failed message
   */
  private handleConnectionFailed(payload: any): void {
    console.error('[CollaborationService] WebSocket connection failed:', payload);
    
    // Publish connection failed event
    this.eventBus.emit('collab.connection-failed', payload);
  }

  async createRoom(
    ownerPeerId: PeerId, 
    ownerUsername: string,
    roomName: string,
    maxPlayers: number = 4,
    allowRelay: boolean = true,
    latencyTargetMs: number = 100,
    opusBitrate: number = 32000
  ): Promise<RoomId | null> {
    try {
      console.log('[CollaborationService] Creating room...');
      
      // Prepare create room request
      const createRoomRequest = {
        ownerId: ownerPeerId.toString(),
        roomName,
        maxPlayers,
        allowRelay,
        latencyTargetMs,
        opusBitrate
      };
      
      // Send API request to create room
      const response = await this.collaborationApiAdapter.createRoom(createRoomRequest);
      
      if (response.error) {
        console.error('[CollaborationService] Failed to create room:', response.error);
        return null;
      }
      
      if (!response.data || !response.data.roomId) {
        console.error('[CollaborationService] Invalid response for room creation:', response);
        return null;
      }
      
      console.log('[CollaborationService] Room created successfully:', response.data.roomId);
      
      // Get room ID from response
      const roomId = RoomId.fromString(response.data.roomId);
      
      // Automatically join the newly created room
      await this.joinRoom(roomId);
      
      return roomId;
    } catch (error) {
      console.error('[CollaborationService] Error while creating room:', error);
      return null;
    }
  }

  async joinRoom(roomId: RoomId): Promise<void> {
    if (!this.localPeerId || !this.initialized) throw new Error('Not initialized');
    
    // Additional check if roomId and localPeerId are valid
    if (!roomId) throw new Error('Invalid room ID');
    
    const roomIdStr = roomId.toString();
    const peerIdStr = this.localPeerId.toString();
    
    if (!roomIdStr || roomIdStr.trim() === '') throw new Error('Room ID cannot be empty');
    if (!peerIdStr || peerIdStr.trim() === '') throw new Error('Peer ID cannot be empty');
    
    console.log(`[CollaborationService] Preparing to join room: ${roomIdStr}, local peer ID: ${peerIdStr}`);
    
    if (this.currentRoomId && this.currentRoomId.equals(roomId)) {
      console.log(`Already in room: ${roomIdStr}`);
      return;
    }
    
    console.log(`Joining room: ${roomIdStr}`);
    
    try {
      // First get room details via API (specification steps 7-8)
      console.log('[CollaborationService] Step 1: Getting room details via API');
      const roomInfoResponse = await this.collaborationApiAdapter.getRoom(roomId);
      
      if (roomInfoResponse.error) {
        console.error(`[CollaborationService] Failed to get room details: ${roomInfoResponse.error}`);
        throw new Error(`Cannot join room: ${roomInfoResponse.error}`);
      }
      
      if (!roomInfoResponse.data) {
        console.error('[CollaborationService] Room details request returned invalid data');
        throw new Error('Cannot join room: Room does not exist or data is invalid');
      }
      
      console.log('[CollaborationService] Room exists and is valid, will directly connect to WebSocket');
      console.log('[CollaborationService] Room details:', JSON.stringify(roomInfoResponse.data, null, 2));
      
      // Room exists and is valid, establish WebSocket connection (specification steps 9-10)
      this.currentRoomId = roomId;
      
      console.log('[CollaborationService] Step 2: Connecting to WebSocket signaling server');
      console.log(`[CollaborationService] Room ID: ${roomIdStr}, Peer ID: ${peerIdStr}`);
      
      try {
        // Add timeout handling
        const connectPromise = this.signalingService.connect(roomId, this.localPeerId);
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 15000); // Increased timeout to 15 seconds
        });
        
        await Promise.race([connectPromise, timeoutPromise]);
        
        console.log('[CollaborationService] Successfully connected to WebSocket, room joining process completed');
        
        // Add waiting time to ensure JOIN message is processed
        console.log('[CollaborationService] Waiting for JOIN message to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
        
        // Check connection state
        const connectionState = this.signalingService.getConnectionState();
        console.log(`[CollaborationService] Current connection state: ${connectionState}`);
        
        if (connectionState !== ConnectionState.CONNECTED) {
          throw new Error(`WebSocket connection state abnormal: ${connectionState}`);
        }
      } catch (connectError) {
        console.error('[CollaborationService] WebSocket connection failed:', connectError);
        this.currentRoomId = null;
        throw new Error(`WebSocket connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`[CollaborationService] Failed to join room:`, error);
      throw new Error(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoomId) return;
    
    await this.peerConnectionManager.disconnectAll();
    await this.signalingService.disconnect();
    this.currentRoomId = null;
  }

  async closeRoom(roomId: RoomId, ownerId: PeerId): Promise<boolean> {
    try {
      console.log('[CollaborationService] Closing room:', roomId.toString());
      
      // Prepare close room request
      const closeRoomRequest = {
        ownerId: ownerId.toString()
      };
      
      // Send API request to close room
      const response = await this.collaborationApiAdapter.closeRoom(roomId, closeRoomRequest);
      
      if (response.error) {
        console.error('[CollaborationService] Failed to close room:', response.error);
        return false;
      }
      
      console.log('[CollaborationService] Room closed successfully');
      return true;
    } catch (error) {
      console.error('[CollaborationService] Error while closing room:', error);
      return false;
    }
  }

  async updateRoomRules(
    roomId: RoomId, 
    ownerId: PeerId, 
    maxPlayers: number, 
    allowRelay: boolean,
    latencyTargetMs: number,
    opusBitrate: number
  ): Promise<boolean> {
    try {
      console.log('[CollaborationService] Updating room rules:', roomId.toString());
      
      // Prepare update rules request
      const updateRulesRequest = {
        ownerId: ownerId.toString(),
        maxPlayers,
        allowRelay,
        latencyTargetMs,
        opusBitrate
      };
      
      // Send API request to update room rules
      const response = await this.collaborationApiAdapter.updateRoomRules(roomId, updateRulesRequest);
      
      if (response.error) {
        console.error('[CollaborationService] Failed to update room rules:', response.error);
        return false;
      }
      
      console.log('[CollaborationService] Room rules updated successfully');
      return true;
    } catch (error) {
      console.error('[CollaborationService] Error while updating room rules:', error);
      return false;
    }
  }

  async getRoomInfo(roomId: RoomId): Promise<any> {
    try {
      console.log('[CollaborationService] Getting room information:', roomId.toString());
      
      // Use API adapter to get room information
      const response = await this.collaborationApiAdapter.getRoom(roomId);
      
      if (response.error) {
        console.error('[CollaborationService] Failed to get room information:', response.error);
        return { id: roomId.toString(), name: 'Unnamed room' };
      }
      
      if (!response.data) {
        console.error('[CollaborationService] Room information request returned invalid data');
        return { id: roomId.toString(), name: 'Unnamed room' };
      }
      
      console.log('[CollaborationService] Room information:', response.data);
      
      // Return room information, adding room ID
      return {
        ...response.data,
        id: roomId.toString()
      };
    } catch (error) {
      console.error('[CollaborationService] Error getting room information:', error);
      return { id: roomId.toString(), name: 'Unnamed room' };
    }
  }

  async isRoomOwner(roomId: RoomId, peerId: PeerId): Promise<boolean> {
    try {
      // Get room information
      const roomInfo = await this.getRoomInfo(roomId);
      
      // Check if ownerId matches
      if (roomInfo && roomInfo.ownerId) {
        return roomInfo.ownerId === peerId.toString();
      }
      
      return false;
    } catch (error) {
      console.error('[CollaborationService] Error checking room owner:', error);
      return false;
    }
  }

  async sendData(peerId: PeerId, channel: string, data: any): Promise<void> {
    this.peerConnectionManager.sendData(peerId, channel, data);
  }

  async broadcastData(channel: string, data: any): Promise<void> {
    this.peerConnectionManager.broadcastData(channel, data);
  }

  subscribeToData(channel: string, callback: (peerId: PeerId, data: any) => void): void {
    this.peerConnectionManager.subscribeToData(channel, callback);
  }

  unsubscribeFromData(channel: string, callback: (peerId: PeerId, data: any) => void): void {
    this.peerConnectionManager.unsubscribeFromData(channel, callback);
  }

  getConnectedPeers(): PeerId[] {
    return this.peerConnectionManager.getConnectedPeers();
  }

  isConnected(): boolean {
    return !!this.currentRoomId && 
      this.signalingService.getConnectionState() === ConnectionState.CONNECTED;
  }

  getPeerConnectionState(peerId: PeerId): ConnectionState {
    return this.peerConnectionManager.getConnectionState(peerId);
  }
} 
