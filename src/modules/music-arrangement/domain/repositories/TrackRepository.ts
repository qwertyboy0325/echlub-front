import { IRepository } from '../../../../core/repositories/IRepository';
import { Track } from '../aggregates/Track';
import { TrackId } from '../value-objects/TrackId';
import { PeerId } from '../aggregates/Track'; // Import from Track for now

/**
 * Track Repository Interface
 * Extends core IRepository with track-specific operations
 */
export interface TrackRepository extends IRepository<Track, TrackId> {
  /**
   * Find tracks by owner ID
   * @param ownerId The owner's peer ID
   * @returns Promise of tracks owned by the peer
   */
  findByOwnerId(ownerId: PeerId): Promise<Track[]>;

  /**
   * Save track with all its clips
   * Ensures transactional consistency between track and clips
   * @param track The track to save with clips
   */
  saveWithClips(track: Track): Promise<void>;

  /**
   * Load track with all its clips
   * Eager loads all clips for the track
   * @param id The track ID
   * @returns Promise of track with clips loaded
   */
  loadWithClips(id: TrackId): Promise<Track | null>;

  /**
   * Find tracks by type
   * @param trackType The track type to filter by
   * @returns Promise of tracks of the specified type
   */
  findByType(trackType: string): Promise<Track[]>;

  /**
   * Find tracks in a time range
   * @param startTime Start time in seconds
   * @param endTime End time in seconds
   * @returns Promise of tracks that have clips in the time range
   */
  findTracksInTimeRange(startTime: number, endTime: number): Promise<Track[]>;

  /**
   * Count tracks by owner
   * @param ownerId The owner's peer ID
   * @returns Promise of track count
   */
  countByOwnerId(ownerId: PeerId): Promise<number>;

  /**
   * Find tracks with clips
   * @returns Promise of tracks that have at least one clip
   */
  findTracksWithClips(): Promise<Track[]>;

  /**
   * Find empty tracks
   * @returns Promise of tracks that have no clips
   */
  findEmptyTracks(): Promise<Track[]>;
} 