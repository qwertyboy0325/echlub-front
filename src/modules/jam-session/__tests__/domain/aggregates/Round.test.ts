import { Round, RoundStatus } from '../../../domain/aggregates/Round';
import { RoundId } from '../../../domain/value-objects/RoundId';
import { SessionId } from '../../../domain/value-objects/SessionId';
import { TrackReferenceVO } from '../../../domain/value-objects/TrackReferenceVO';

describe('Round', () => {
  describe('create', () => {
    it('should create a new round with valid properties', () => {
      const sessionId = 'session-123';
      const roundNumber = 1;
      const durationSeconds = 300;

      const round = Round.create(sessionId, roundNumber, durationSeconds);

      expect(round.sessionId).toBe(sessionId);
      expect(round.roundNumber).toBe(roundNumber);
      expect(round.durationSeconds).toBe(durationSeconds);
      expect(round.status).toBe(RoundStatus.IN_PROGRESS);
      expect(round.isCompleted()).toBe(false);
      expect(round.getAllTracks()).toHaveLength(0);
    });

    it('should throw error for invalid round number', () => {
      expect(() => {
        Round.create('session-123', 0, 300);
      }).toThrow('Round number must be positive');

      expect(() => {
        Round.create('session-123', -1, 300);
      }).toThrow('Round number must be positive');
    });

    it('should throw error for invalid duration', () => {
      expect(() => {
        Round.create('session-123', 1, 0);
      }).toThrow('Duration must be positive');

      expect(() => {
        Round.create('session-123', 1, -60);
      }).toThrow('Duration must be positive');
    });

        it('should emit RoundStarted domain event on creation', () => {
      const round = Round.create('session-123', 1, 300);
      
      const events = round.collectDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('jam.round-started');
    });
  });



  describe('addTrack', () => {
    it('should add track to round successfully', () => {
      const round = Round.create('session-123', 1, 300);
      const trackId = 'track-123';
      const peerId = 'player-456';

      round.addTrack(trackId, peerId);

      const tracks = round.getAllTracks();
      expect(tracks).toHaveLength(1);
      expect(tracks[0].trackId).toBe(trackId);
      expect(tracks[0].playerId).toBe(peerId);
    });

    it('should throw error when adding track to completed round', () => {
      const round = Round.create('session-123', 1, 300);
      round.end();

      expect(() => {
        round.addTrack('track-123', 'player-456');
      }).toThrow('Cannot add tracks to a completed round');
    });

    it('should throw error for empty trackId', () => {
      const round = Round.create('session-123', 1, 300);

      expect(() => {
        round.addTrack('', 'player-456');
      }).toThrow('Track ID and player ID are required');
    });

    it('should throw error for empty peerId', () => {
      const round = Round.create('session-123', 1, 300);

      expect(() => {
        round.addTrack('track-123', '');
      }).toThrow('Track ID and player ID are required');
    });

    it('should emit TrackAddedToRound domain event', () => {
      const round = Round.create('session-123', 1, 300);
      
      round.addTrack('track-123', 'player-456');

      const events = round.collectDomainEvents();
      expect(events).toHaveLength(2); // RoundStarted + TrackAddedToRound
      expect(events[1].eventType).toBe('jam.track-added-to-round');
    });
  });

  describe('markPlayerCompleted', () => {
    it('should mark player as completed successfully', () => {
      const round = Round.create('session-123', 1, 300);
      const peerId = 'player-456';

      round.markPlayerCompleted(peerId);

      expect(round.completedPeerIds).toContain(peerId);
    });

    it('should throw error when marking completed on completed round', () => {
      const round = Round.create('session-123', 1, 300);
      round.end();

      expect(() => {
        round.markPlayerCompleted('player-456');
      }).toThrow('Round is already completed');
    });

    it('should throw error for empty peerId', () => {
      const round = Round.create('session-123', 1, 300);

      expect(() => {
        round.markPlayerCompleted('');
      }).toThrow('Player ID is required');
    });

    it('should not duplicate completed players', () => {
      const round = Round.create('session-123', 1, 300);
      const peerId = 'player-456';

      round.markPlayerCompleted(peerId);
      round.markPlayerCompleted(peerId); // Second call should not duplicate

      expect(round.completedPeerIds.filter(id => id === peerId)).toHaveLength(1);
    });

    it('should emit PlayerCompletedRound domain event', () => {
      const round = Round.create('session-123', 1, 300);
      
      round.markPlayerCompleted('player-456');

      const events = round.collectDomainEvents();
      expect(events).toHaveLength(2); // RoundStarted + PlayerCompletedRound
      expect(events[1].eventType).toBe('jam.player-completed-round');
    });
  });

  describe('confirmNextRound', () => {
    it('should confirm player for next round successfully', () => {
      const round = Round.create('session-123', 1, 300);
      const peerId = 'player-456';

      round.confirmNextRound(peerId);

      expect(round.confirmedPeerIds).toContain(peerId);
    });

    it('should throw error when confirming on completed round', () => {
      const round = Round.create('session-123', 1, 300);
      round.end();

      expect(() => {
        round.confirmNextRound('player-456');
      }).toThrow('Round is already completed');
    });

    it('should throw error for empty peerId', () => {
      const round = Round.create('session-123', 1, 300);

      expect(() => {
        round.confirmNextRound('');
      }).toThrow('Player ID is required');
    });

    it('should not duplicate confirmed players', () => {
      const round = Round.create('session-123', 1, 300);
      const peerId = 'player-456';

      round.confirmNextRound(peerId);
      round.confirmNextRound(peerId); // Second call should not duplicate

      expect(round.confirmedPeerIds.filter(id => id === peerId)).toHaveLength(1);
    });

    it('should emit PlayerConfirmedNextRound domain event', () => {
      const round = Round.create('session-123', 1, 300);
      
      round.confirmNextRound('player-456');

      const events = round.collectDomainEvents();
      expect(events).toHaveLength(2); // RoundStarted + PlayerConfirmedNextRound
      expect(events[1].eventType).toBe('jam.player-confirmed-next-round');
    });
  });

  describe('end', () => {
    it('should end the round successfully', () => {
      const round = Round.create('session-123', 1, 300);

      round.end();

      expect(round.status).toBe(RoundStatus.COMPLETED);
      expect(round.isCompleted()).toBe(true);
      expect(round.endedAt).toBeInstanceOf(Date);
    });

    it('should throw error when ending already completed round', () => {
      const round = Round.create('session-123', 1, 300);
      round.end();

      expect(() => {
        round.end();
      }).toThrow('Round is already completed');
    });

    it('should emit RoundEnded domain event', () => {
      const round = Round.create('session-123', 1, 300);
      
      round.end();

      const events = round.collectDomainEvents();
      expect(events).toHaveLength(2); // RoundStarted + RoundEnded
      expect(events[1].eventType).toBe('jam.round-ended');
    });
  });

  describe('areAllPlayersCompleted', () => {
    it('should return true when all players are completed', () => {
      const round = Round.create('session-123', 1, 300);
      const playerIds = ['player-1', 'player-2'];

      round.markPlayerCompleted('player-1');
      round.markPlayerCompleted('player-2');

      expect(round.areAllPlayersCompleted(playerIds)).toBe(true);
    });

    it('should return false when not all players are completed', () => {
      const round = Round.create('session-123', 1, 300);
      const playerIds = ['player-1', 'player-2'];

      round.markPlayerCompleted('player-1');

      expect(round.areAllPlayersCompleted(playerIds)).toBe(false);
    });

    it('should return true for empty player list', () => {
      const round = Round.create('session-123', 1, 300);

      expect(round.areAllPlayersCompleted([])).toBe(true);
    });
  });

  describe('areAllPlayersConfirmed', () => {
    it('should return true when all players are confirmed', () => {
      const round = Round.create('session-123', 1, 300);
      const playerIds = ['player-1', 'player-2'];

      round.confirmNextRound('player-1');
      round.confirmNextRound('player-2');

      expect(round.areAllPlayersConfirmed(playerIds)).toBe(true);
    });

    it('should return false when not all players are confirmed', () => {
      const round = Round.create('session-123', 1, 300);
      const playerIds = ['player-1', 'player-2'];

      round.confirmNextRound('player-1');

      expect(round.areAllPlayersConfirmed(playerIds)).toBe(false);
    });

    it('should return true for empty player list', () => {
      const round = Round.create('session-123', 1, 300);

      expect(round.areAllPlayersConfirmed([])).toBe(true);
    });
  });

  describe('getTracksForPlayer', () => {
    it('should return tracks for specific player', () => {
      const round = Round.create('session-123', 1, 300);
      const peerId = 'player-456';

      round.addTrack('track-1', peerId);
      round.addTrack('track-2', 'other-player');
      round.addTrack('track-3', peerId);

      const playerTracks = round.getTracksForPlayer(peerId);
      expect(playerTracks).toHaveLength(2);
      expect(playerTracks.every(track => track.playerId === peerId)).toBe(true);
    });

    it('should return empty array for player with no tracks', () => {
      const round = Round.create('session-123', 1, 300);

      const playerTracks = round.getTracksForPlayer('player-456');
      expect(playerTracks).toHaveLength(0);
    });
  });

  describe('getRemainingSeconds', () => {
    it('should calculate remaining time correctly', () => {
      const round = Round.create('session-123', 1, 300);
      const currentTime = new Date(round.startedAt.getTime() + 60000); // 1 minute later

      const remaining = round.getRemainingSeconds(currentTime);
      expect(remaining).toBe(240); // 300 - 60 = 240
    });

    it('should return 0 when time has expired', () => {
      const round = Round.create('session-123', 1, 300);
      const currentTime = new Date(round.startedAt.getTime() + 400000); // 400 seconds later

      const remaining = round.getRemainingSeconds(currentTime);
      expect(remaining).toBe(0);
    });

    it('should return 0 when round is completed', () => {
      const round = Round.create('session-123', 1, 300);
      round.end();

      const remaining = round.getRemainingSeconds();
      expect(remaining).toBe(0);
    });
  });

  describe('getters', () => {
    it('should provide access to all properties', () => {
      const round = Round.create('session-123', 1, 300);

      expect(round.id).toBeDefined();
      expect(round.sessionId).toBe('session-123');
      expect(round.roundNumber).toBe(1);
      expect(round.durationSeconds).toBe(300);
      expect(round.startedAt).toBeInstanceOf(Date);
      expect(round.endedAt).toBeNull();
      expect(round.status).toBe(RoundStatus.IN_PROGRESS);
      expect(round.completedPeerIds).toEqual([]);
      expect(round.confirmedPeerIds).toEqual([]);
    });
  });
}); 