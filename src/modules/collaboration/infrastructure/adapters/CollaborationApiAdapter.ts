import { injectable } from 'inversify';
import { 
  ICollaborationApiAdapter, 
  CreateRoomRequest, 
  UpdateRoomRulesRequest, 
  CloseRoomRequest, 
  ApiResponse, 
  RoomResponse,
  JoinRoomRequest
} from './ICollaborationApiAdapter';
import { RoomId } from '../../domain/value-objects/RoomId';
import { BaseApiAdapter } from '../../../../core/api/BaseApiAdapter';

/**
 * Collaboration API Adapter Implementation
 */
@injectable()
export class CollaborationApiAdapter extends BaseApiAdapter implements ICollaborationApiAdapter {
  /**
   * Create a new room
   */
  async createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>> {
    console.log('[CollaborationApiAdapter] Creating room:', request);
    
    // Format the request according to specification
    const requestData = {
      name: request.roomName,
      description: `Collaboration room created by ${request.roomName}`,
      maxPlayers: request.maxPlayers,
      allowRelay: request.allowRelay,
      latencyTargetMs: request.latencyTargetMs,
      opusBitrate: request.opusBitrate,
      ownerId: request.ownerId
    };
    
    console.log('[CollaborationApiAdapter] Formatted request:', requestData);
    
    // Use the correct API endpoint: /rooms
    const response = await this.post<any>('/rooms', requestData);
    
    if (response.error) {
      return response;
    }
    
    // Process response according to specification
    console.log('[CollaborationApiAdapter] Create room response:', JSON.stringify(response.data, null, 2));
    
    // Expected format: { success: true, data: { roomId: "xxx", ... } }
    let roomId = null;
    
    // Handle different API response formats
    if (response.data) {
      if (response.data.success === true && response.data.data) {
        // Format: { success: true, data: { roomId: "xxx" } }
        roomId = response.data.data.roomId || response.data.data.id;
      } else {
        // Format: { roomId: "xxx" } or { id: "xxx" }
        roomId = response.data.roomId || response.data.id;
      }
    }
    
    if (!roomId) {
      return {
        error: 'Invalid response format - room ID not found',
        success: false
      };
    }
    
    return {
      success: true,
      data: {
        roomId
      }
    };
  }
  
  /**
   * Extract player IDs from various possible response formats
   */
  private extractPlayerIds(players: any[]): string[] {
    if (!Array.isArray(players)) {
      return [];
    }
    
    // Handle different formats of player objects
    return players.map(player => {
      if (typeof player === 'string') {
        return player;
      } else if (player && typeof player === 'object') {
        return player.id || player.peerId || player.peer_id || '';
      }
      return '';
    }).filter(id => id);
  }
  
  /**
   * Get rule value from different possible field names
   */
  private getRuleValue(data: any, fieldName1: string, fieldName2: string, defaultValue: any): any {
    // Try first field name
    if (data && data[fieldName1] !== undefined) {
      return data[fieldName1];
    }
    
    // Try second field name
    if (data && data[fieldName2] !== undefined) {
      return data[fieldName2];
    }
    
    // Try checking if rules object exists
    if (data && data.rules) {
      if (data.rules[fieldName1] !== undefined) {
        return data.rules[fieldName1];
      }
      if (data.rules[fieldName2] !== undefined) {
        return data.rules[fieldName2];
      }
    }
    
    // Return default value if not found
    return defaultValue;
  }
  
  /**
   * Get room status
   */
  async getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>> {
    console.log('[CollaborationApiAdapter] Getting room:', roomId.toString());
    
    const response = await this.get<any>(`/rooms/${roomId.toString()}`);
    
    if (response.error) {
      return response;
    }
    
    console.log('[CollaborationApiAdapter] Room response data:', JSON.stringify(response.data, null, 2));
    
    // Get the raw data, which might be nested in a data property or directly in the response
    let rawData = response.data;
    
    // If response format is { success: true, data: {...} }
    if (rawData && rawData.success === true && rawData.data) {
      rawData = rawData.data;
    }
    
    // Ensure data exists
    if (!rawData) {
      return {
        error: 'Invalid room data format',
        success: false
      };
    }
    
    // Handle various possible field names, using default values to prevent errors
    const roomIdValue = rawData.roomId || rawData.id || rawData._id || roomId.toString();
    
    const roomData: RoomResponse = {
      id: roomIdValue,
      ownerId: rawData.ownerId || rawData.owner || '',
      active: rawData.active !== undefined ? rawData.active : true,
      maxPlayers: rawData.maxPlayers || rawData.max_players || 4,
      currentPlayers: Array.isArray(rawData.currentPlayers) ? rawData.currentPlayers : 
                     Array.isArray(rawData.current_players) ? rawData.current_players : 
                     (rawData.players ? this.extractPlayerIds(rawData.players) : []),
      rules: {
        maxPlayers: this.getRuleValue(rawData, 'maxPlayers', 'max_players', 4),
        allowRelay: this.getRuleValue(rawData, 'allowRelay', 'allow_relay', true),
        latencyTargetMs: this.getRuleValue(rawData, 'latencyTargetMs', 'latency_target_ms', 100),
        opusBitrate: this.getRuleValue(rawData, 'opusBitrate', 'opus_bitrate', 32000)
      }
    };
    
    return {
      success: true,
      data: roomData
    };
  }
  
  /**
   * Get room list
   * @param limit Result count limit
   * @param offset Page offset
   */
  async getRooms(limit?: number, offset?: number): Promise<ApiResponse<{ rooms: any[], total: number }>> {
    console.log('[CollaborationApiAdapter] Getting room list:', { limit, offset });
    
    // Build query parameters
    const queryParams = [];
    if (limit !== undefined) queryParams.push(`limit=${limit}`);
    if (offset !== undefined) queryParams.push(`offset=${offset}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    // Call API to get room list
    const response = await this.get<any>(`/rooms${queryString}`);
    
    if (response.error) {
      return response;
    }
    
    // Process response
    console.log('[CollaborationApiAdapter] Room list response:', JSON.stringify(response.data, null, 2));
    
    // Get raw data, which might be nested in a data property or directly in the response
    let rawData = response.data;
    
    // If response format is { success: true, data: {...} }
    if (rawData && rawData.success === true && rawData.data) {
      rawData = rawData.data;
    }
    
    // Ensure data exists
    if (!rawData) {
      return {
        error: 'Invalid room list format',
        success: false
      };
    }
    
    // Handle different response formats
    let rooms = [];
    let total = 0;
    
    // Format 1: { rooms: [...], total: 10 }
    if (Array.isArray(rawData.rooms)) {
      rooms = rawData.rooms;
      total = rawData.total || rooms.length;
    }
    // Format 2: { data: [...], count: 10 }
    else if (Array.isArray(rawData.data)) {
      rooms = rawData.data;
      total = rawData.count || rooms.length;
    }
    // Format 3: the response itself is an array
    else if (Array.isArray(rawData)) {
      rooms = rawData;
      total = rooms.length;
    }
    
    // Map rooms to a consistent format
    const formattedRooms = rooms.map((room: any) => {
      const roomId = room.roomId || room.id || room._id;
      
      return {
        id: roomId,
        name: room.name || room.roomName || 'Unnamed Room',
        ownerId: room.ownerId || room.owner || '',
        active: room.active !== undefined ? room.active : true,
        maxPlayers: room.maxPlayers || room.max_players || 4,
        currentPlayers: Array.isArray(room.currentPlayers) ? room.currentPlayers : 
                       Array.isArray(room.current_players) ? room.current_players : 
                       (room.players ? this.extractPlayerIds(room.players) : []),
        playerCount: room.playerCount || room.player_count || 
                    (Array.isArray(room.currentPlayers) ? room.currentPlayers.length : 
                    (Array.isArray(room.current_players) ? room.current_players.length : 
                    (Array.isArray(room.players) ? room.players.length : 0)))
      };
    });
    
    return {
      success: true,
      data: {
        rooms: formattedRooms,
        total
      }
    };
  }
  
  /**
   * Update room rules
   */
  async updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<any>> {
    console.log('[CollaborationApiAdapter] Updating room rules:', roomId.toString(), request);
    
    // Format request to match API specification
    const requestData = {
      ownerId: request.ownerId,
      rules: {
        maxPlayers: request.maxPlayers,
        allowRelay: request.allowRelay,
        latencyTargetMs: request.latencyTargetMs,
        opusBitrate: request.opusBitrate
      }
    };
    
    const response = await this.put<any>(`/rooms/${roomId.toString()}/rules`, requestData);
    
    if (response.error) {
      return response;
    }
    
    console.log('[CollaborationApiAdapter] Update rules response:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data
    };
  }
  
  /**
   * Close room
   */
  async closeRoom(roomId: RoomId, request: CloseRoomRequest): Promise<ApiResponse<any>> {
    console.log('[CollaborationApiAdapter] Closing room:', roomId.toString(), request);
    
    const response = await this.post<any>(`/rooms/${roomId.toString()}/close`, request);
    
    if (response.error) {
      return response;
    }
    
    console.log('[CollaborationApiAdapter] Close room response:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data
    };
  }
  
  /**
   * Join a room
   */
  async joinRoom(roomId: RoomId, request: JoinRoomRequest): Promise<ApiResponse<RoomResponse>> {
    console.log('[CollaborationApiAdapter] Preparing to join room:', roomId.toString(), request);
    
    // Note: According to specifications, there is no explicit API endpoint for joining a room.
    // Participants join a room by getting the room info and then connecting via WebSocket.
    console.log('[CollaborationApiAdapter] According to specifications, joining a room only requires getting room info and then connecting via WebSocket');
    
    // Get room information
    return this.getRoom(roomId);
  }
} 
