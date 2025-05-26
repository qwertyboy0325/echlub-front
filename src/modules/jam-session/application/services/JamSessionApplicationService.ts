import { injectable, inject } from 'inversify';
import { Session } from '../../domain/aggregates/Session';
import type { JamSessionRepository } from '../../domain/repositories/JamSessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';
import { RoleVO } from '../../domain/value-objects/RoleVO';
import { JamEventBus } from '../../infrastructure/messaging/JamEventBus';

@injectable()
export class JamSessionApplicationService {
  constructor(
    @inject('JamSessionRepository') private repository: JamSessionRepository,
    @inject('JamEventBus') private eventBus: JamEventBus
  ) {}

  async startSession(sessionId: string, roomId: string, initiatorPeerId: string): Promise<void> {
    const session = new Session(
      SessionId.fromString(sessionId),
      roomId,
      initiatorPeerId
    );

    await this.repository.save(session);
    const events = session.collectDomainEvents();
    this.publishDomainEvents(events);
  }

  async setPlayerRole(sessionId: string, playerId: string, role: string): Promise<void> {
    const session = await this.repository.findById(SessionId.fromString(sessionId));
    if (!session) {
      throw new Error('Session not found');
    }

    const roleVO = RoleVO.create(role);
    session.setPlayerRole(playerId, roleVO);
    
    await this.repository.save(session);
    const events = session.collectDomainEvents();
    this.publishDomainEvents(events);
  }

  async markPlayerUnavailable(sessionId: string, playerId: string): Promise<void> {
    const session = await this.repository.findById(SessionId.fromString(sessionId));
    if (!session) {
      throw new Error('Session not found');
    }

    session.markPlayerAsUnavailable(playerId);
    
    await this.repository.save(session);
    const events = session.collectDomainEvents();
    this.publishDomainEvents(events);
  }

  async startNextRound(sessionId: string, durationSeconds: number): Promise<void> {
    const session = await this.repository.findById(SessionId.fromString(sessionId));
    if (!session) {
      throw new Error('Session not found');
    }

    session.startNextRound(durationSeconds);
    
    await this.repository.save(session);
    const events = session.collectDomainEvents();
    this.publishDomainEvents(events);
  }

  async addTrack(sessionId: string, trackId: string, playerId: string): Promise<void> {
    const session = await this.repository.findById(SessionId.fromString(sessionId));
    if (!session) {
      throw new Error('Session not found');
    }

    session.addTrackToCurrentRound(trackId, playerId);
    
    await this.repository.save(session);
    const events = session.collectDomainEvents();
    this.publishDomainEvents(events);
  }

  private publishDomainEvents(events: any[]): void {
    events.forEach(event => {
      this.eventBus.publish(event.eventName, event);
    });
  }
} 