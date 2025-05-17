import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';

/**
 * Collaboration Service Interface
 * Provides API for managing WebRTC connections, rooms and data exchange
 */
export interface CollaborationService {
  /**
   * Initialize collaboration service
   * @param peerId Local peer ID
   */
  initialize(peerId: PeerId): Promise<void>;
  
  /**
   * Create a new room
   * @param ownerPeerId Owner's peer ID
   * @param ownerUsername Owner's username
   * @param roomName Room name
   * @param maxPlayers Maximum number of players
   * @param allowRelay Allow relay
   * @param latencyTargetMs Latency target (ms)
   * @param opusBitrate Opus bitrate
   */
  createRoom(
    ownerPeerId: PeerId, 
    ownerUsername: string,
    roomName: string,
    maxPlayers?: number,
    allowRelay?: boolean,
    latencyTargetMs?: number,
    opusBitrate?: number
  ): Promise<RoomId | null>;
  
  /**
   * Join a room
   * @param roomId Room ID
   */
  joinRoom(roomId: RoomId): Promise<void>;
  
  /**
   * Leave the current room
   */
  leaveRoom(): Promise<void>;
  
  /**
   * Close a room (requires owner privileges)
   * @param roomId Room ID
   * @param ownerId Owner ID
   */
  closeRoom(roomId: RoomId, ownerId: PeerId): Promise<boolean>;
  
  /**
   * Update room rules (requires owner privileges)
   * @param roomId Room ID
   * @param ownerId Owner ID
   * @param maxPlayers Maximum number of players
   * @param allowRelay Allow relay
   * @param latencyTargetMs Latency target (ms)
   * @param opusBitrate Opus bitrate
   */
  updateRoomRules(
    roomId: RoomId, 
    ownerId: PeerId, 
    maxPlayers: number, 
    allowRelay: boolean,
    latencyTargetMs: number,
    opusBitrate: number
  ): Promise<boolean>;
  
  /**
   * Get room information
   * @param roomId Room ID
   */
  getRoomInfo(roomId: RoomId): Promise<any>;
  
  /**
   * Check if user is the room owner
   * @param roomId Room ID
   * @param peerId User ID
   */
  isRoomOwner(roomId: RoomId, peerId: PeerId): Promise<boolean>;
  
  /**
   * Send data to a specific peer
   * @param peerId Peer ID
   * @param channel Channel name
   * @param data Data
   */
  sendData(peerId: PeerId, channel: string, data: any): Promise<void>;
  
  /**
   * Broadcast data to all connected peers
   * @param channel Channel name
   * @param data Data
   */
  broadcastData(channel: string, data: any): Promise<void>;
  
  /**
   * Subscribe to data channel
   * @param channel Channel name
   * @param callback Callback function
   */
  subscribeToData(channel: string, callback: (peerId: PeerId, data: any) => void): void;
  
  /**
   * Unsubscribe from data channel
   * @param channel Channel name
   * @param callback Callback function
   */
  unsubscribeFromData(channel: string, callback: (peerId: PeerId, data: any) => void): void;
  
  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerId[];
  
  /**
   * Check if connected
   */
  isConnected(): boolean;
  
  /**
   * Get peer connection state
   * @param peerId Peer ID
   */
  getPeerConnectionState(peerId: PeerId): ConnectionState;
} 
