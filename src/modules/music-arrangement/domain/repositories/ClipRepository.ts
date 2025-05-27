import { Clip } from '../entities/Clip';
import { AudioClip } from '../entities/AudioClip';
import { MidiClip } from '../entities/MidiClip';
import { ClipId } from '../value-objects/ClipId';
import { TrackId } from '../value-objects/TrackId';
import { ClipType } from '../value-objects/ClipType';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';

/**
 * Clip Repository Interface
 * 
 * Note: This repository does NOT extend IRepository<Clip, ClipId> because:
 * 1. IRepository is designed for AggregateRoot entities only
 * 2. Clip is an Entity, not an AggregateRoot
 * 3. Clips are managed through the Track aggregate
 * 
 * This follows the DDD principle that only AggregateRoots should have repositories.
 * Clips are accessed and persisted through their owning Track aggregate.
 * 
 * However, we provide this interface for infrastructure concerns like:
 * - Querying clips across multiple tracks
 * - Performance optimizations (direct clip access)
 * - Reporting and analytics
 */
export interface ClipRepository {
  /**
   * Find clip by ID
   * @param id The clip ID
   * @returns Promise of clip or null if not found
   */
  findById(id: ClipId): Promise<Clip | null>;

  /**
   * Save clip
   * @param clip The clip to save
   */
  save(clip: Clip): Promise<void>;

  /**
   * Delete clip by ID
   * @param id The clip ID
   */
  delete(id: ClipId): Promise<void>;

  /**
   * Check if clip exists
   * @param id The clip ID
   * @returns Promise of boolean indicating existence
   */
  exists(id: ClipId): Promise<boolean>;

  /**
   * Find clips by track ID
   * @param trackId The track ID
   * @returns Promise of clips belonging to the track
   */
  findByTrackId(trackId: TrackId): Promise<Clip[]>;

  /**
   * Find clips by type
   * @param type The clip type (AUDIO or MIDI)
   * @returns Promise of clips of the specified type
   */
  findByType(type: ClipType): Promise<Clip[]>;

  /**
   * Find clips in a time range
   * @param range The time range to search
   * @returns Promise of clips that intersect with the time range
   */
  findInTimeRange(range: TimeRangeVO): Promise<Clip[]>;

  /**
   * Find clips at a specific time point
   * @param timePoint The time point in seconds
   * @returns Promise of clips that contain the time point
   */
  findAtTime(timePoint: number): Promise<Clip[]>;

  /**
   * Find audio clips by source ID
   * @param sourceId The audio source ID
   * @returns Promise of audio clips using the source
   */
  findAudioClipsBySourceId(sourceId: string): Promise<AudioClip[]>;

  /**
   * Find MIDI clips by instrument ID
   * @param instrumentId The instrument ID
   * @returns Promise of MIDI clips using the instrument
   */
  findMidiClipsByInstrumentId(instrumentId: string): Promise<MidiClip[]>;

  /**
   * Count clips by track
   * @param trackId The track ID
   * @returns Promise of clip count for the track
   */
  countByTrackId(trackId: TrackId): Promise<number>;

  /**
   * Find clips by name pattern
   * @param pattern The name pattern to search
   * @returns Promise of clips matching the pattern
   */
  findByNamePattern(pattern: string): Promise<Clip[]>;

  /**
   * Find clips by tags
   * @param tags The tags to search for
   * @returns Promise of clips containing any of the tags
   */
  findByTags(tags: string[]): Promise<Clip[]>;

  /**
   * Find overlapping clips
   * @param range The time range to check for overlaps
   * @param excludeClipId Optional clip ID to exclude from search
   * @returns Promise of clips that overlap with the range
   */
  findOverlapping(range: TimeRangeVO, excludeClipId?: ClipId): Promise<Clip[]>;

  /**
   * Delete clips by track ID
   * Used when deleting a track
   * @param trackId The track ID
   */
  deleteByTrackId(trackId: TrackId): Promise<void>;
} 