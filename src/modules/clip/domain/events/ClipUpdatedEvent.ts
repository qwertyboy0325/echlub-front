import { ClipId } from '../value-objects/ClipId';
import { BaseClip } from '../entities/BaseClip';

export class ClipUpdatedEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly clip: BaseClip
  ) {}
} 