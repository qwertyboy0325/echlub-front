import { DomainEvent } from '../../../../shared/domain';

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserLoggedIn', userId);
  }
} 