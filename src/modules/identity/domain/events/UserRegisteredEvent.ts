import { DomainEvent } from '../../../../core/domain/DomainEvent';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserRegistered');
  }
} 