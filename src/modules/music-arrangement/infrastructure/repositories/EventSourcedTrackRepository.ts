import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { Track } from '../../domain/aggregates/Track';
import { TrackId } from '../../domain/value-objects/TrackId';
import type { EventStore } from '../events/EventStore';
import { DomainError } from '../../domain/errors/DomainError';
import { UndoRedoService } from '../../application/services/UndoRedoService';
import { UndoableEvent } from '../../domain/events/MidiEvents';
import { DomainEvent } from '../../../../core/events/DomainEvent';
import { TrackCreatedEvent } from '../../domain/events/TrackEvents';
import { TrackMetadata } from '../../domain/value-objects/TrackMetadata';

// Import PeerId from Track events (placeholder)
import { PeerId } from '../../domain/events/TrackEvents';

/**
 * Event Sourced Track Repository
 * Implements TrackRepository using event sourcing with EventStore
 * Provides full event sourcing capabilities with undo/redo support
 */
export class EventSourcedTrackRepository implements TrackRepository {
  constructor(
    private eventStore: EventStore,
    private undoRedoService?: UndoRedoService
  ) {}

  async findById(id: TrackId): Promise<Track | null> {
    try {
      const events = await this.eventStore.getEventsForAggregate(id.toString());
      
      if (events.length === 0) {
        return null;
      }

      // Reconstruct track from events
      return Track.fromHistory(id, events);
    } catch (error) {
      console.error('Error loading track from events:', error);
      throw DomainError.trackNotFound(id.toString());
    }
  }

  async save(track: Track): Promise<void> {
    try {
      const uncommittedEvents = track.getUncommittedEvents();
      
      if (uncommittedEvents.length === 0) {
        return; // No changes to save
      }

      // Get current version for optimistic concurrency
      const currentEvents = await this.eventStore.getEventsForAggregate(track.trackId.toString());
      const expectedVersion = currentEvents.length;

      // Save events to event store
      await this.eventStore.saveEvents(
        track.trackId.toString(),
        uncommittedEvents,
        expectedVersion
      );

      // Record undoable events for undo/redo functionality
      if (this.undoRedoService) {
        for (const event of uncommittedEvents) {
          if (this.isUndoableEvent(event)) {
            await this.undoRedoService.recordUndoableEvent(
              event as UndoableEvent,
              track.trackId.toString(),
              expectedVersion + uncommittedEvents.indexOf(event) + 1,
              track.ownerId.toString() // Assuming we can get user ID from track
            );
          }
        }
      }

      // Mark events as committed
      track.clearUncommittedEvents();

    } catch (error) {
      console.error('Error saving track events:', error);
      throw error;
    }
  }

  async delete(id: TrackId): Promise<void> {
    try {
      // In event sourcing, we don't actually delete events
      // Instead, we could add a "TrackDeleted" event
      // For now, we'll clear the event history (not recommended in production)
      
      // Get the track first to ensure it exists
      const track = await this.findById(id);
      if (!track) {
        throw DomainError.trackNotFound(id.toString());
      }

      // Clear undo/redo history
      if (this.undoRedoService) {
        this.undoRedoService.clearHistory(id.toString());
      }

      // Note: In a real implementation, we would add a TrackDeletedEvent
      // rather than clearing the event store
      console.warn('Track deletion in event sourcing should use TrackDeletedEvent');
      
    } catch (error) {
      console.error('Error deleting track:', error);
      throw error;
    }
  }

  async exists(id: TrackId): Promise<boolean> {
    try {
      const events = await this.eventStore.getEventsForAggregate(id.toString());
      return events.length > 0;
    } catch (error) {
      console.error('Error checking track existence:', error);
      return false;
    }
  }

  async saveWithClips(track: Track): Promise<void> {
    // In event sourcing, clips are part of the track aggregate
    // So saving the track automatically includes all clip events
    await this.save(track);
  }

  async loadWithClips(id: TrackId): Promise<Track | null> {
    // In event sourcing, loading a track automatically includes all its state
    // including clips, since they're reconstructed from events
    return await this.findById(id);
  }

  async findByOwnerId(ownerId: PeerId): Promise<Track[]> {
    try {
      // This is a complex query in event sourcing
      // We need to scan events and filter by owner
      // In a production system, we'd use read models/projections for this
      
      const allEvents = await this.eventStore.getEventsSince(new Date(0));
      const tracksByOwner: Map<string, Track> = new Map();

      // Group events by aggregate and filter by owner
      for (const event of allEvents) {
        if (event.eventName === 'TrackCreated' && event.aggregateId) {
          const trackCreatedEvent = event as any; // Type assertion for demo
          if (trackCreatedEvent.ownerId?.toString() === ownerId.toString()) {
            const trackId = TrackId.fromString(event.aggregateId);
            const track = await this.findById(trackId);
            if (track) {
              tracksByOwner.set(trackId.toString(), track);
            }
          }
        }
      }

      return Array.from(tracksByOwner.values());
    } catch (error) {
      console.error('Error finding tracks by owner:', error);
      return [];
    }
  }

  async findByType(trackType: string): Promise<Track[]> {
    try {
      // Similar to findByOwnerId, this requires scanning events
      // In production, use read models for efficient queries
      
      const allEvents = await this.eventStore.getEventsByType('TrackCreated');
      const tracksByType: Map<string, Track> = new Map();

      for (const event of allEvents) {
        if (event.aggregateId) {
          const trackCreatedEvent = event as any;
          if (trackCreatedEvent.trackType?.toString() === trackType) {
            const trackId = TrackId.fromString(event.aggregateId);
            const track = await this.findById(trackId);
            if (track) {
              tracksByType.set(trackId.toString(), track);
            }
          }
        }
      }

      return Array.from(tracksByType.values());
    } catch (error) {
      console.error('Error finding tracks by type:', error);
      return [];
    }
  }

  async findTracksInTimeRange(startTime: number, endTime: number): Promise<Track[]> {
    try {
      // This is complex in event sourcing - requires analyzing clip events
      // In production, use read models/projections
      
      const clipEvents = await this.eventStore.getEventsByType('ClipAddedToTrack');
      const trackIds = new Set<string>();

      // This is a simplified implementation
      // In reality, we'd need to analyze clip time ranges from events
      for (const event of clipEvents) {
        if (event.aggregateId) {
          trackIds.add(event.aggregateId);
        }
      }

      const tracks: Track[] = [];
      for (const trackIdStr of trackIds) {
        const trackId = TrackId.fromString(trackIdStr);
        const track = await this.findById(trackId);
        if (track) {
          // Check if track has clips in the time range
          const clipsInRange = track.getClipsInRange({
            start: startTime,
            end: endTime,
            length: endTime - startTime
          } as any);
          
          if (clipsInRange.length > 0) {
            tracks.push(track);
          }
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error finding tracks in time range:', error);
      return [];
    }
  }

  async countByOwnerId(ownerId: PeerId): Promise<number> {
    try {
      const tracks = await this.findByOwnerId(ownerId);
      return tracks.length;
    } catch (error) {
      console.error('Error counting tracks by owner:', error);
      return 0;
    }
  }

  async findTracksWithClips(): Promise<Track[]> {
    try {
      const clipEvents = await this.eventStore.getEventsByType('ClipAddedToTrack');
      const trackIds = new Set<string>();

      for (const event of clipEvents) {
        if (event.aggregateId) {
          trackIds.add(event.aggregateId);
        }
      }

      const tracks: Track[] = [];
      for (const trackIdStr of trackIds) {
        const trackId = TrackId.fromString(trackIdStr);
        const track = await this.findById(trackId);
        if (track && track.hasClips()) {
          tracks.push(track);
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error finding tracks with clips:', error);
      return [];
    }
  }

  async findEmptyTracks(): Promise<Track[]> {
    try {
      const allTrackEvents = await this.eventStore.getEventsByType('TrackCreated');
      const tracks: Track[] = [];

      for (const event of allTrackEvents) {
        if (event.aggregateId) {
          const trackId = TrackId.fromString(event.aggregateId);
          const track = await this.findById(trackId);
          if (track && track.isEmpty()) {
            tracks.push(track);
          }
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error finding empty tracks:', error);
      return [];
    }
  }

  // Event sourcing specific methods

  /**
   * Load track at a specific version (point in time)
   */
  async findByIdAtVersion(id: TrackId, version: number): Promise<Track | null> {
    try {
      const events = await this.eventStore.getEventsForAggregateToVersion(
        id.toString(),
        version
      );
      
      if (events.length === 0) {
        return null;
      }

      return Track.fromHistory(id, events);
    } catch (error) {
      console.error('Error loading track at version:', error);
      throw DomainError.trackNotFound(id.toString());
    }
  }

  /**
   * Get all events for a track
   */
  async getTrackEvents(id: TrackId): Promise<any[]> {
    try {
      return await this.eventStore.getEventsForAggregate(id.toString());
    } catch (error) {
      console.error('Error getting track events:', error);
      return [];
    }
  }

  /**
   * Save snapshot for performance optimization
   */
  async saveSnapshot(track: Track): Promise<void> {
    try {
      const events = await this.eventStore.getEventsForAggregate(track.trackId.toString());
      const version = events.length;

      const snapshot = {
        aggregateId: track.trackId.toString(),
        aggregateType: 'Track',
        version,
        data: {
          trackId: track.trackId.toString(),
          ownerId: track.ownerId.toString(),
          trackType: track.trackType.toString(),
          metadata: track.metadata,
          clipCount: track.clipCount,
          // Add other relevant state for snapshot
        },
        timestamp: new Date()
      };

      await this.eventStore.saveSnapshot(track.trackId.toString(), snapshot, version);
    } catch (error) {
      console.error('Error saving track snapshot:', error);
      throw error;
    }
  }

  // Helper methods

  private isUndoableEvent(event: any): event is UndoableEvent {
    return typeof event.createUndoEvent === 'function';
  }

  /**
   * Rebuild read models from events (for maintenance)
   */
  async rebuildReadModels(): Promise<void> {
    try {
      // This would rebuild any read model projections
      // from the event store for performance optimization
      console.log('Rebuilding read models from events...');
      
      // In a real implementation, this would:
      // 1. Clear existing read models
      // 2. Replay all events
      // 3. Rebuild projections for efficient queries
      
    } catch (error) {
      console.error('Error rebuilding read models:', error);
      throw error;
    }
  }

  private createTrackFromEvents(events: DomainEvent[]): Track {
    if (events.length === 0) {
      throw DomainError.trackNotFound('No events found');
    }

    // Get the first event which should be TrackCreated
    const firstEvent = events[0];
    if (firstEvent.eventName !== 'TrackCreated') {
      throw DomainError.operationNotPermitted('createTrackFromEvents', 'First event must be TrackCreated');
    }

    // Type-safe event casting
    const trackCreatedEvent = firstEvent as TrackCreatedEvent;
    
    // Use Track.fromHistory to reconstruct the track from events
    return Track.fromHistory(trackCreatedEvent.trackId, events);
  }
} 