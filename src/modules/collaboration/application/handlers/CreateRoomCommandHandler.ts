import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { CreateRoomCommand } from '../commands/CreateRoomCommand';
import type { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { Room } from '../../domain/aggregates/Room';
import { RoomId } from '../../domain/value-objects/RoomId';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * Handle create room command
 */
@injectable()
export class CreateRoomCommandHandler {
  constructor(
    @inject(CollaborationTypes.RoomRepository)
    private readonly roomRepository: IRoomRepository,
    
    @inject(CollaborationTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Handle create room command, create and save new room
   */
  async handle(command: CreateRoomCommand): Promise<RoomId> {
    // Create room ID
    const roomId = RoomId.generate();
    
    // Get room rules from command
    const rules = command.getRules();
    
    // Create room aggregate
    const room = Room.create(
      roomId,
      command.ownerId,
      command.ownerUsername,
      command.name,
      rules
    );
    
    // Save room
    await this.roomRepository.save(room);
    
    // Publish domain events
    const domainEvents = room.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    
    // Clear published events
    room.clearDomainEvents();
    
    return roomId;
  }
} 
