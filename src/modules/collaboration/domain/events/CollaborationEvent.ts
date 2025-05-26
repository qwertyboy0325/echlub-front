import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';
import { PeerId } from '../value-objects/PeerId';

export interface CollaborationPayload {
  channel: string;
  data: any;
  sender: string;
}

export class CollaborationEvent extends IntegrationEvent {
  constructor(
    public readonly peerId: PeerId,
    public readonly payload: CollaborationPayload
  ) {
    super();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      peerId: this.peerId.toString(),
      payload: this.payload
    };
  }
} 