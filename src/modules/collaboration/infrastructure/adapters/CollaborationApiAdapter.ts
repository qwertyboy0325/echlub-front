import { injectable } from 'inversify';
import { 
  ICollaborationApiAdapter, 
  CreateRoomRequest, 
  UpdateRoomRulesRequest, 
  CloseRoomRequest, 
  ApiResponse, 
  RoomResponse 
} from './ICollaborationApiAdapter';
import { RoomId } from '../../domain/value-objects/RoomId';

/**
 * 協作 API 適配器實現
 */
@injectable()
export class CollaborationApiAdapter implements ICollaborationApiAdapter {
  private readonly API_BASE_URL: string = import.meta.env.VITE_API_URL || 'https://api.echlub.com';
  
  /**
   * 創建新房間
   */
  async createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.message || `Failed to create room: ${response.statusText}`
        };
      }
      
      return { data };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error creating room'
      };
    }
  }
  
  /**
   * 取得房間狀態
   */
  async getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms/${roomId.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.message || `Failed to get room: ${response.statusText}`
        };
      }
      
      return { data: data.room };
    } catch (error) {
      console.error('Error getting room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error getting room'
      };
    }
  }
  
  /**
   * 更新房間規則
   */
  async updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms/${roomId.toString()}/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const data = await response.json();
        return {
          error: data.message || `Failed to update room rules: ${response.statusText}`
        };
      }
      
      return {
        message: 'Room rules updated successfully'
      };
    } catch (error) {
      console.error('Error updating room rules:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error updating room rules'
      };
    }
  }
  
  /**
   * 關閉房間
   */
  async closeRoom(roomId: RoomId, request: CloseRoomRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms/${roomId.toString()}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const data = await response.json();
        return {
          error: data.message || `Failed to close room: ${response.statusText}`
        };
      }
      
      return {
        message: 'Room closed successfully'
      };
    } catch (error) {
      console.error('Error closing room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error closing room'
      };
    }
  }
} 