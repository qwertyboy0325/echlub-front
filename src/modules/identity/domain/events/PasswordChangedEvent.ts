import { DomainEvent } from '../../../../shared/domain';

export class PasswordChangedEvent extends DomainEvent {
  constructor() {
    super('PasswordChanged');
  }
} 
