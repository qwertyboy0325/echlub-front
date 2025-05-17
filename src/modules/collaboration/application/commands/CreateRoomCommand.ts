import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';
import { PeerId } from '../../domain/value-objects/PeerId';

/**
 * Create Room Command
 */
export class CreateRoomCommand {
  constructor(
    public readonly ownerId: PeerId,
    public readonly ownerUsername: string,
    public readonly name: string,
    public readonly maxPlayers: number = 4,
    public readonly allowRelay: boolean = true,
    public readonly latencyTargetMs: number = 100,
    public readonly opusBitrate: number = 32000
  ) {}

  /**
   * Get room rules generated from command parameters
   */
  public getRules(): RoomRuleVO {
    return RoomRuleVO.create(
      this.maxPlayers,
      this.allowRelay,
      this.latencyTargetMs,
      this.opusBitrate
    );
  }
} 
