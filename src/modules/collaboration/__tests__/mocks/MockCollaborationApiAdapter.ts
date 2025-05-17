import { ICollaborationApiAdapter, ApiResponse, RoomResponse, CreateRoomRequest, UpdateRoomRulesRequest, CloseRoomRequest, JoinRoomRequest } from "../../infrastructure/adapters/ICollaborationApiAdapter";
import { RoomId } from "../../domain/value-objects/RoomId";
import { injectable } from "inversify";
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock implementation of Collaboration API Adapter for testing
 */
@injectable()
export class MockCollaborationApiAdapter implements ICollaborationApiAdapter {
  private roomStore: Map<string, { ownerId: string }> = new Map();
  
  /**
   * Create a new room
   */
  async createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>> {
    const roomId = uuidv4();
    this.roomStore.set(roomId, { ownerId: request.ownerId });
    return { 
      data: { 
        roomId
      },
      success: true
    };
  }
  
  /**
   * Get room status
   */
  async getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>> {
    const room = this.roomStore.get(roomId.toString());
    const ownerId = room ? room.ownerId : uuidv4();
    return { 
      data: {
        id: roomId.toString(),
        ownerId,
        active: true,
        maxPlayers: 4,
        currentPlayers: [ownerId],
        rules: {
          maxPlayers: 4,
          allowRelay: true,
          latencyTargetMs: 100,
          opusBitrate: 32000
        }
      },
      success: true
    };
  }
  
  /**
   * Update room rules
   */
  async updateRoomRules(_roomId: RoomId, _request: UpdateRoomRulesRequest): Promise<ApiResponse<void>> {
    return {
      success: true,
      data: undefined
    };
  }
  
  /**
   * Close room
   */
  async closeRoom(_roomId: RoomId, _request: CloseRoomRequest): Promise<ApiResponse<void>> {
    return {
      success: true,
      data: undefined
    };
  }
  
  /**
   * Get room list
   */
  async getRooms(_limit?: number, _offset?: number): Promise<ApiResponse<{ rooms: any[], total: number }>> {
    const rooms = Array.from(this.roomStore.entries()).map(([id, data]) => ({
      id,
      ownerId: data.ownerId,
      name: `Test Room ${id.substring(0, 4)}`,
      playerCount: 1,
      maxPlayers: 4
    }));
    
    return {
      data: {
        rooms,
        total: rooms.length
      }
    };
  }
  
  /**
   * Join room 
   * 注意: 根據規格書，沒有明確的 API 端點用於加入房間，
   * 我們僅需獲取房間信息，後續會通過 WebSocket 直接連接
   */
  async joinRoom(roomId: RoomId, _request: JoinRoomRequest): Promise<ApiResponse<RoomResponse>> {
    console.log('[MockCollaborationApiAdapter] 準備加入房間:', roomId.toString());
    console.log('[MockCollaborationApiAdapter] 按照規格書，僅需獲取房間信息，然後通過 WebSocket 連接');
    
    // 直接返回房間信息
    return this.getRoom(roomId);
  }
} 
