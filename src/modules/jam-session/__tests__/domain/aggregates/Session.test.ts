import 'reflect-metadata';
import { Session, SessionStatus } from '../../../domain/aggregates/Session';
import { SessionId } from '../../../domain/value-objects/SessionId';
import { RoleVO } from '../../../domain/value-objects/RoleVO';
import { RoundId } from '../../../domain/value-objects/RoundId';

describe('Session Aggregate', () => {
  let sessionId: SessionId;
  let roomId: string;
  let initiatorPeerId: string;
  let drummerRole: RoleVO;
  let guitaristRole: RoleVO;
  let vocalistRole: RoleVO;

  beforeEach(() => {
    sessionId = SessionId.generate();
    roomId = 'room-123';
    initiatorPeerId = 'player-initiator';
    drummerRole = RoleVO.create('drummer', 'Drummer', '#FF5722', true);
    guitaristRole = RoleVO.create('guitarist', 'Guitarist', '#4CAF50', true);
    vocalistRole = RoleVO.create('vocalist', 'Vocalist', '#2196F3', false); // Non-unique role
  });

  describe('Session Creation', () => {
    test('should create a new session with initiator as first player', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);

      expect(session.sessionId).toEqual(sessionId);
      expect(session.roomId).toBe(roomId);
      expect(session.status).toBe(SessionStatus.PENDING);
      expect(session.playerCount).toBe(1);
      expect(session.playerIds).toContain(initiatorPeerId);

      // Check domain events
      const events = session.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('jam.session-created');
      expect(events[1].eventType).toBe('jam.player-added');
    });

    test('should have correct initial state', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);

      expect(session.currentRoundNumber).toBe(0);
      expect(session.currentRoundId).toBe(null);
      expect(session.players.size).toBe(1);
      
      const initiatorPlayer = session.players.get(initiatorPeerId);
      expect(initiatorPlayer).toBeDefined();
      expect(initiatorPlayer!.role).toBe(null);
      expect(initiatorPlayer!.isReady).toBe(false);
    });
  });

  describe('Player Management', () => {
    test('should add new players to pending session', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.clearDomainEvents();

      const newPlayerId = 'player-2';
      session.addPlayer(newPlayerId);

      expect(session.playerCount).toBe(2);
      expect(session.playerIds).toContain(newPlayerId);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.player-added');
    });

    test('should not add duplicate players', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.clearDomainEvents();

      // Try to add the same player twice
      session.addPlayer(initiatorPeerId);

      expect(session.playerCount).toBe(1);
      expect(session.getDomainEvents()).toHaveLength(0); // No new events
    });

    test('should not allow adding players when session is not pending', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      
      // Set up session to start
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();

      expect(() => {
        session.addPlayer('new-player');
      }).toThrow('Players can only be added when session is pending');
    });

    test('should mark player as unavailable and remove from session', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';
      session.addPlayer(player2);
      session.clearDomainEvents();

      session.markPlayerAsUnavailable(player2);

      expect(session.playerCount).toBe(1);
      expect(session.playerIds).not.toContain(player2);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.player-left-session');
    });

    test('should end session when all players become unavailable', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.clearDomainEvents();

      session.markPlayerAsUnavailable(initiatorPeerId);

      expect(session.status).toBe(SessionStatus.ENDED);
      expect(session.playerCount).toBe(0);
    });
  });

  describe('Role Management', () => {
    test('should set player role correctly', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.clearDomainEvents();

      session.setPlayerRole(initiatorPeerId, drummerRole);

      const player = session.players.get(initiatorPeerId);
      expect(player!.role).toBe(drummerRole);
      expect(player!.hasRole(drummerRole)).toBe(true);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.player-role-set');
    });

    test('should not allow setting role for non-existent player', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);

      expect(() => {
        session.setPlayerRole('non-existent-player', drummerRole);
      }).toThrow('Player not found in session');
    });

    test('should not allow setting role when session is not pending', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();

      expect(() => {
        session.setPlayerRole(initiatorPeerId, guitaristRole);
      }).toThrow('Roles can only be set when session is pending');
    });

    test('should prevent multiple players from taking unique roles', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';
      session.addPlayer(player2);

      // First player takes drummer role
      session.setPlayerRole(initiatorPeerId, drummerRole);

      // Second player tries to take the same unique role
      expect(() => {
        session.setPlayerRole(player2, drummerRole);
      }).toThrow('This role is already taken by another player');
    });

    test('should allow multiple players to take non-unique roles', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';
      session.addPlayer(player2);

      // Both players can take vocalist role (non-unique)
      session.setPlayerRole(initiatorPeerId, vocalistRole);
      session.setPlayerRole(player2, vocalistRole);

      expect(session.players.get(initiatorPeerId)!.hasRole(vocalistRole)).toBe(true);
      expect(session.players.get(player2)!.hasRole(vocalistRole)).toBe(true);
    });

    test('should allow player to change from unique role to another', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';
      session.addPlayer(player2);

      // Player 1 takes drummer
      session.setPlayerRole(initiatorPeerId, drummerRole);
      
      // Player 1 changes to guitarist
      session.setPlayerRole(initiatorPeerId, guitaristRole);
      
      // Now player 2 can take drummer
      session.setPlayerRole(player2, drummerRole);

      expect(session.players.get(initiatorPeerId)!.hasRole(guitaristRole)).toBe(true);
      expect(session.players.get(player2)!.hasRole(drummerRole)).toBe(true);
    });
  });

  describe('Ready State Management', () => {
    test('should set player ready state correctly', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.clearDomainEvents();

      session.setPlayerReady(initiatorPeerId, true);

      const player = session.players.get(initiatorPeerId);
      expect(player!.isReady).toBe(true);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.player-ready');
    });

    test('should not allow player to be ready without a role', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);

      expect(() => {
        session.setPlayerReady(initiatorPeerId, true);
      }).toThrow('Player must have a role before being ready');
    });

    test('should not allow setting ready state for non-existent player', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);

      expect(() => {
        session.setPlayerReady('non-existent-player', true);
      }).toThrow('Player not found in session');
    });

    test('should allow unready state without role', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);

      // Should not throw
      session.setPlayerReady(initiatorPeerId, false);

      const player = session.players.get(initiatorPeerId);
      expect(player!.isReady).toBe(false);
    });
  });

  describe('Session Lifecycle', () => {
    test('should start session when all players are ready', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';
      session.addPlayer(player2);

      // Set roles and ready states
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerRole(player2, guitaristRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.setPlayerReady(player2, true);
      session.clearDomainEvents();

      session.startJamSession();

      expect(session.status).toBe(SessionStatus.IN_PROGRESS);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.session-started');
    });

    test('should not start session when not all players are ready', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';
      session.addPlayer(player2);

      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerRole(player2, guitaristRole);
      session.setPlayerReady(initiatorPeerId, true);
      // player2 is not ready

      expect(() => {
        session.startJamSession();
      }).toThrow('All players must be ready to start the session');
    });

    test('should not start session with no players', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.markPlayerAsUnavailable(initiatorPeerId);

      expect(() => {
        session.startJamSession();
      }).toThrow('Session can only be started from pending state');
    });

    test('should not start session when not in pending state', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();

      expect(() => {
        session.startJamSession();
      }).toThrow('Session can only be started from pending state');
    });

    test('should end session correctly', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();
      session.clearDomainEvents();

      session.endJamSession();

      expect(session.status).toBe(SessionStatus.ENDED);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.session-ended');
    });

    test('should not end already ended session', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();
      session.endJamSession();

      expect(() => {
        session.endJamSession();
      }).toThrow('Session is already ended');
    });
  });

  describe('Round Management', () => {
    test('should set current round correctly', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();
      session.clearDomainEvents();

      const roundId = RoundId.create();
      session.setCurrentRound(roundId, 1);

      expect(session.currentRoundId).toEqual(roundId);
      expect(session.currentRoundNumber).toBe(1);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.round-started');
    });

    test('should not set current round when session is not in progress', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const roundId = RoundId.create();

      expect(() => {
        session.setCurrentRound(roundId, 1);
      }).toThrow('Cannot set current round when session is not in progress');
    });

    test('should mark round as completed', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();

      const roundId = RoundId.create();
      session.setCurrentRound(roundId, 1);
      session.clearDomainEvents();

      session.markRoundCompleted(roundId);

      expect(session.status).toBe(SessionStatus.ROUND_COMPLETION);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.round-completed');
    });

    test('should prepare next round correctly', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();

      const roundId = RoundId.create();
      session.setCurrentRound(roundId, 1);
      session.markRoundCompleted(roundId);
      session.clearDomainEvents();

      const nextRoundNumber = session.prepareNextRound();

      expect(nextRoundNumber).toBe(2);
      expect(session.status).toBe(SessionStatus.IN_PROGRESS);
      expect(session.currentRoundNumber).toBe(2);
      expect(session.currentRoundId).toBe(null);

      const events = session.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.next-round-prepared');
    });

    test('should not prepare next round when not in round completion phase', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.startJamSession();

      expect(() => {
        session.prepareNextRound();
      }).toThrow('Can only prepare next round during round completion phase');
    });
  });

  describe('Event Sourcing', () => {
    test('should maintain state consistency through events', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      const player2 = 'player-2';

      // Sequence of operations
      session.addPlayer(player2);
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerRole(player2, guitaristRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.setPlayerReady(player2, true);
      session.startJamSession();

      // Verify final state
      expect(session.status).toBe(SessionStatus.IN_PROGRESS);
      expect(session.playerCount).toBe(2);
      expect(session.players.get(initiatorPeerId)!.hasRole(drummerRole)).toBe(true);
      expect(session.players.get(player2)!.hasRole(guitaristRole)).toBe(true);
      expect(session.players.get(initiatorPeerId)!.isReady).toBe(true);
      expect(session.players.get(player2)!.isReady).toBe(true);

      // Check that all events were raised
      const events = session.getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    test('should handle role changes correctly through events', () => {
      const session = Session.create(sessionId, roomId, initiatorPeerId);
      
      // Player sets role, becomes ready, then changes role
      session.setPlayerRole(initiatorPeerId, drummerRole);
      session.setPlayerReady(initiatorPeerId, true);
      session.setPlayerRole(initiatorPeerId, guitaristRole);

      const player = session.players.get(initiatorPeerId)!;
      expect(player.hasRole(guitaristRole)).toBe(true);
      expect(player.hasRole(drummerRole)).toBe(false);
      expect(player.isReady).toBe(false); // Should be reset when role changes
    });
  });
}); 