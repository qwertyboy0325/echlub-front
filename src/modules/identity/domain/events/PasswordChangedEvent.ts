import { DomainEvent } from '../../../../core/domain/DomainEvent';

export class PasswordChangedEvent extends DomainEvent {
  constructor() {
    super('PasswordChanged');
  }
} 