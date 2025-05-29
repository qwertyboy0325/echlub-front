import { injectable, inject } from 'inversify';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { Track } from '../../domain/aggregates/Track';
import { PeerId } from '../../domain/events/TrackEvents';
import { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import type { EventStore } from '../events/EventStore';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import { DomainError } from '../../domain/errors/DomainError';
import { DomainEvent } from '../../../../core/events/DomainEvent';
import { ClipId } from '../../domain/value-objects/ClipId';

/**
 * Event Sourced Track Repository Implementation
 * Uses EventStore for persistence and event replay
 */
@injectable()
export class EventSourcedTrackRepository implements TrackRepository {
  constructor(
    @inject(MusicArrangementTypes.EventStore)
    private eventStore: EventStore,
    @inject(MusicArrangementTypes.ClipRepository)
    private clipRepository: ClipRepository
  ) {}

  async findById(id: TrackId): Promise<Track | null> {
    try {
      console.log(`EventSourcedTrackRepository.findById: Looking for track ${id.toString()}`);
      
      const events = await this.eventStore.getEventsForAggregate(id.toString());
      console.log(`EventSourcedTrackRepository.findById: Found ${events.length} events for track ${id.toString()}`);
      
      if (events.length === 0) {
        console.log(`EventSourcedTrackRepository.findById: No events found for track ${id.toString()}`);
        return null;
      }

      // Log the events for debugging
      events.forEach((event, index) => {
        console.log(`  Event ${index + 1}: ${event.eventName} - ${JSON.stringify(event).substring(0, 100)}...`);
      });

      // Reconstruct track from events
      console.log(`EventSourcedTrackRepository.findById: Reconstructing track from ${events.length} events`);
      const track = Track.fromHistory(id, events);
      
      console.log(`EventSourcedTrackRepository.findById: Successfully reconstructed track ${track.name} with ${track.clipCount} clips`);
      return track;
    } catch (error) {
      console.error(`EventSourcedTrackRepository.findById: Error finding track ${id.toString()}:`, error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      // Don't throw trackNotFound error, just return null
      // This allows the caller to handle the case appropriately
      return null;
    }
  }

  async save(track: Track): Promise<void> {
    try {
      const uncommittedEvents = track.getUncommittedEvents();
      
      if (uncommittedEvents.length === 0) {
        return; // Nothing to save
      }

      // Get current version for optimistic concurrency
      const existingEvents = await this.eventStore.getEventsForAggregate(track.trackId.toString());
      const expectedVersion = existingEvents.length;

      // Save events to event store
      await this.eventStore.saveEvents(
        track.trackId.toString(),
        uncommittedEvents,
        expectedVersion
      );

      // Mark events as committed
      track.clearUncommittedEvents();
      
    } catch (error) {
      console.error('Error saving track:', error);
      throw DomainError.operationNotPermitted('save', `Failed to save track: ${error}`);
    }
  }

  async delete(id: TrackId): Promise<void> {
    try {
      // In event sourcing, we don't actually delete events
      // Instead, we could raise a TrackDeletedEvent
      // For now, we'll throw an error as deletion should be handled differently
      throw DomainError.operationNotPermitted('delete', 'Track deletion not supported in event sourced repository');
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
    // In event sourcing, clips are part of the track's event stream
    // So we just save the track normally
    await this.save(track);
  }

  async loadWithClips(id: TrackId): Promise<Track | null> {
    // First, load the track using event sourcing
    const track = await this.findById(id);
    if (!track) {
      return null;
    }

    // Then, load all clips that belong to this track
    // We need to find ClipAddedToTrackEvent events to know which clips belong to this track
    try {
      const events = await this.eventStore.getEventsForAggregate(id.toString());
      
      // Find all ClipAddedToTrackEvent events
      const clipAddedEvents = events.filter(event => event.eventName === 'ClipAddedToTrack');
      
      // Load each clip from the clip repository and add it to the track's state
      for (const event of clipAddedEvents) {
        const clipAddedEvent = event as any;
        
        // Handle both ClipId object and string cases
        let clipId: ClipId;
        if (typeof clipAddedEvent.clipId === 'string') {
          clipId = ClipId.fromString(clipAddedEvent.clipId);
        } else if (clipAddedEvent.clipId && typeof clipAddedEvent.clipId.toString === 'function') {
          clipId = ClipId.fromString(clipAddedEvent.clipId.toString());
        } else {
          console.warn(`Invalid clipId in ClipAddedToTrackEvent:`, clipAddedEvent.clipId);
          continue;
        }
        
        try {
          const clip = await this.clipRepository.findById(clipId);
          if (clip) {
            // Add the clip to the track's state
            track.addClipToState(clip);
          } else {
            console.warn(`Clip not found in repository: ${clipId.toString()}`);
          }
        } catch (error) {
          console.warn(`Failed to load clip ${clipId.toString()}:`, error);
          // Continue loading other clips even if one fails
        }
      }
      
      return track;
    } catch (error) {
      console.error('Error loading clips for track:', error);
      // Return the track without clips rather than failing completely
      return track;
    }
  }

  async findByOwnerId(ownerId: PeerId): Promise<Track[]> {
    try {
      // This is a complex query that would require indexing in a real implementation
      // For now, we'll implement a basic version that searches through events
      const allEvents = await this.eventStore.getEventsByType('TrackCreated');
      
      const trackIds = new Set<string>();
      
      // Find tracks created by this owner
      for (const event of allEvents) {
        if ((event as any).ownerId?.toString() === ownerId.toString()) {
          trackIds.add((event as any).trackId.toString());
        }
      }

      // Load each track
      const tracks: Track[] = [];
      for (const trackIdStr of trackIds) {
        const trackId = TrackId.fromString(trackIdStr);
        const track = await this.findById(trackId);
        if (track) {
          tracks.push(track);
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error finding tracks by owner:', error);
      throw DomainError.operationNotPermitted('findByOwnerId', `Failed to find tracks: ${error}`);
    }
  }

  async findByType(trackType: string): Promise<Track[]> {
    try {
      // Similar to findByOwnerId, this would require proper indexing
      const allEvents = await this.eventStore.getEventsByType('TrackCreated');
      
      const trackIds = new Set<string>();
      
      for (const event of allEvents) {
        if ((event as any).trackType?.toString() === trackType) {
          trackIds.add((event as any).trackId.toString());
        }
      }

      const tracks: Track[] = [];
      for (const trackIdStr of trackIds) {
        const trackId = TrackId.fromString(trackIdStr);
        const track = await this.findById(trackId);
        if (track) {
          tracks.push(track);
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error finding tracks by type:', error);
      throw DomainError.operationNotPermitted('findByType', `Failed to find tracks: ${error}`);
    }
  }

  async findTracksInTimeRange(startTime: number, endTime: number): Promise<Track[]> {
    try {
      // This would require complex event analysis in a real implementation
      // For now, return empty array as this is a complex query
      console.warn('findTracksInTimeRange not fully implemented in event sourced repository');
      return [];
    } catch (error) {
      console.error('Error finding tracks in time range:', error);
      throw DomainError.operationNotPermitted('findTracksInTimeRange', `Failed to find tracks: ${error}`);
    }
  }

  async countByOwnerId(ownerId: PeerId): Promise<number> {
    try {
      const tracks = await this.findByOwnerId(ownerId);
      return tracks.length;
    } catch (error) {
      console.error('Error counting tracks by owner:', error);
      throw DomainError.operationNotPermitted('countByOwnerId', `Failed to count tracks: ${error}`);
    }
  }

  async findTracksWithClips(): Promise<Track[]> {
    try {
      // In event sourcing, we'd need to analyze ClipAddedToTrack events
      const clipEvents = await this.eventStore.getEventsByType('ClipAddedToTrack');
      
      const trackIds = new Set<string>();
      for (const event of clipEvents) {
        trackIds.add((event as any).trackId.toString());
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
      throw DomainError.operationNotPermitted('findTracksWithClips', `Failed to find tracks: ${error}`);
    }
  }

  async findEmptyTracks(): Promise<Track[]> {
    try {
      // Find all tracks and filter for empty ones
      const allTrackEvents = await this.eventStore.getEventsByType('TrackCreated');
      
      const tracks: Track[] = [];
      for (const event of allTrackEvents) {
        const trackId = TrackId.fromString((event as any).trackId.toString());
        const track = await this.findById(trackId);
        if (track && track.isEmpty()) {
          tracks.push(track);
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error finding empty tracks:', error);
      throw DomainError.operationNotPermitted('findEmptyTracks', `Failed to find tracks: ${error}`);
    }
  }

  /**
   * Get track at specific version (useful for undo/redo)
   */
  async getTrackAtVersion(id: TrackId, version: number): Promise<Track | null> {
    try {
      const events = await this.eventStore.getEventsForAggregateToVersion(id.toString(), version);
      
      if (events.length === 0) {
        return null;
      }

      return Track.fromHistory(id, events);
    } catch (error) {
      console.error('Error getting track at version:', error);
      throw DomainError.trackNotFound(id.toString());
    }
  }

  /**
   * Get current version of a track
   */
  async getTrackVersion(id: TrackId): Promise<number> {
    try {
      const events = await this.eventStore.getEventsForAggregate(id.toString());
      return events.length;
    } catch (error) {
      console.error('Error getting track version:', error);
      return 0;
    }
  }
} 