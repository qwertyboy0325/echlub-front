import { injectable, inject } from 'inversify';
import { DomainEvent } from '@/core/events/DomainEvent';
import { IntegrationEvent } from '@/core/event-bus/IntegrationEvent';
import { IntegrationEventBus } from '@/core/event-bus/IntegrationEventBus';
import { JamEventBus } from '../messaging/JamEventBus';

@injectable()
export class EventPublisher {
  constructor(
    @inject('IntegrationEventBus') private integrationEventBus: IntegrationEventBus,
    @inject('JamEventBus') private jamEventBus: JamEventBus
  ) {}

  async publishDomainEvent(event: DomainEvent): Promise<void> {
    await this.jamEventBus.publish(event.eventName, event);
  }

  async publishIntegrationEvent(event: IntegrationEvent): Promise<void> {
    await this.integrationEventBus.publish(event);
  }

  async publishAll(events: (DomainEvent | IntegrationEvent)[]): Promise<void> {
    for (const event of events) {
      if (event instanceof DomainEvent) {
        await this.publishDomainEvent(event);
      } else {
        await this.publishIntegrationEvent(event);
      }
    }
  }
} 