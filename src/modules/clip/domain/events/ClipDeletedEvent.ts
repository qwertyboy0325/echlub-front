import { ClipId } from '../value-objects/ClipId';

export class ClipDeletedEvent {
  constructor(
    public readonly clipId: ClipId
  ) {}
} 