import { DomainEvent } from '../../../../shared/domain';

export class UserLoggedOutEvent extends DomainEvent {
  constructor() {
    super('UserLoggedOut');
  }
} 
