import { DomainEvent } from '../../../../core/domain/DomainEvent';

export abstract class Entity {
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  private domainEvents: DomainEvent[] = [];

  constructor(createdAt: Date, updatedAt: Date) {
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  public equals(other: Entity): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._createdAt.getTime() === other._createdAt.getTime();
  }

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
} 