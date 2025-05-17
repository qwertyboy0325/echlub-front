import { injectable } from 'inversify';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { Room, RoomStatus } from '../../domain/aggregates/Room';
import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';

/**
 * In-memory implementation of Room Repository
 * Used for development and testing environments
 */
@injectable()
export class InMemoryRoomRepository implements IRoomRepository {
  private rooms: Map<string, Room> = new Map<string, Room>();

  async save(room: Room): Promise<void> {
    this.rooms.set(room.roomId.toString(), room);
  }

  async findById(id: RoomId): Promise<Room | null> {
    const room = this.rooms.get(id.toString());
    return room || null;
  }

  async findByParticipant(peerId: PeerId): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => {
      return room.players.some(player => player.peerId.toString() === peerId.toString());
    });
  }

  async findActiveRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => 
      room.status === RoomStatus.CREATED || room.status === RoomStatus.ACTIVE
    );
  }

  async search(query: string, limit: number = 10): Promise<Room[]> {
    const normalizedQuery = query.toLowerCase();
    
    const result = Array.from(this.rooms.values())
      .filter(room => 
        (room.status === RoomStatus.CREATED || room.status === RoomStatus.ACTIVE) &&
        room.name.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, limit);
      
    return result;
  }

  async delete(id: RoomId): Promise<void> {
    this.rooms.delete(id.toString());
  }

  /**
   * Close a room
   * @param roomId Room ID
   */
  async closeRoom(roomId: RoomId): Promise<void> {
    const room = await this.findById(roomId);
    if (room) {
      room.close();
      await this.save(room);
    }
  }
} 
