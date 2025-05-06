import { DomainEvent } from '../../../../shared/domain';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserRegistered', userId);
  }
} 