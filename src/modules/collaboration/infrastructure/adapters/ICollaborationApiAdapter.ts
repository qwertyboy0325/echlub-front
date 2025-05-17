import { RoomId } from '../../domain/value-objects/RoomId';

/**
 * Room information response interface
 */
export interface RoomResponse {
  id: string;
  ownerId: string;
  active: boolean;
  maxPlayers: number;
  currentPlayers: string[];
  rules: {
    maxPlayers: number;
    allowRelay: boolean;
    latencyTargetMs: number;
    opusBitrate: number;
  };
}

/**
 * Create room request
 */
export interface CreateRoomRequest {
  ownerId: string;
  roomName: string;
  maxPlayers?: number;
  allowRelay?: boolean;
  latencyTargetMs?: number;
  opusBitrate?: number;
}

/**
 * Update room rules request
 */
export interface UpdateRoomRulesRequest {
  ownerId: string;
  maxPlayers?: number;
  allowRelay?: boolean;
  latencyTargetMs?: number;
  opusBitrate?: number;
}

/**
 * Close room request
 */
export interface CloseRoomRequest {
  ownerId: string;
}

/**
 * Join room request
 */
export interface JoinRoomRequest {
  peerId: string;
}

/**
 * API response result
 */
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

/**
 * Collaboration API Adapter Interface
 * Used for communication with the backend collaboration API
 */
export interface ICollaborationApiAdapter {
  /**
   * Create a new room
   * @param request Create room request
   */
  createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>>;
  
  /**
   * Get room status
   * @param roomId Room ID
   */
  getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>>;
  
  /**
   * Get room list
   * @param limit Result count limit
   * @param offset Page offset
   */
  getRooms(limit?: number, offset?: number): Promise<ApiResponse<{ rooms: any[], total: number }>>;
  
  /**
   * Update room rules
   * @param roomId Room ID
   * @param request Update rules request
   */
  updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<any>>;
  
  /**
   * Close room
   * @param roomId Room ID
   * @param request Close room request
   */
  closeRoom(roomId: RoomId, request: { ownerId: string }): Promise<ApiResponse<any>>;
  
  /**
   * Join a room
   * @param roomId Room ID
   * @param request Join room request
   */
  joinRoom(roomId: RoomId, request: JoinRoomRequest): Promise<ApiResponse<RoomResponse>>;
} 
