import { DomainEvent } from '../../../../core/domain/DomainEvent';
 
export class UserLoggedOutEvent extends DomainEvent {
  constructor() {
    super('UserLoggedOut');
  }
} 