import { DomainEvent } from '../../../../core/domain/DomainEvent';

export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserProfileUpdated');
  }
} 