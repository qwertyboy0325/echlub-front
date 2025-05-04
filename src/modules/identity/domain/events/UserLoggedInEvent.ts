import { DomainEvent } from '../../../../core/domain/DomainEvent';

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserLoggedIn');
  }
} 