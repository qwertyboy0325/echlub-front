import { DomainEvent } from '../../../../shared/domain';

export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserProfileUpdated', userId);
  }
} 
