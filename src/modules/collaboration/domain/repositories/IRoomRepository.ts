import { RoomId } from '../value-objects/RoomId';

/**
 * Room Repository Interface
 * Provides access and management functions for room data
 */
export interface IRoomRepository {
  /**
   * Get a specific room
   * @param roomId Room ID
   */
  findById(roomId: RoomId): Promise<any | null>;
  
  /**
   * Get list of active rooms
   */
  findActiveRooms(): Promise<any[]>;
  
  /**
   * Save room data
   * @param room Room data
   */
  save(room: any): Promise<void>;
  
  /**
   * Close a room
   * @param roomId Room ID
   */
  closeRoom(roomId: RoomId): Promise<void>;
  
  /**
   * Delete a room
   * @param roomId Room ID
   */
  delete(roomId: RoomId): Promise<void>;
} 
