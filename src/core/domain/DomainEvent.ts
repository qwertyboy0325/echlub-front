import { DomainEvent as NewDomainEvent } from '../events/DomainEvent';

/**
 * @deprecated 此檔案已被棄用，請使用 @/core/events/DomainEvent 代替
 */
export abstract class DomainEvent extends NewDomainEvent {
  constructor(eventName: string) {
    super(eventName);
  }
} 
