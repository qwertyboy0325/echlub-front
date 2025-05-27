import { injectable } from 'inversify';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { Clip } from '../../domain/entities/Clip';
import { AudioClip } from '../../domain/entities/AudioClip';
import { MidiClip } from '../../domain/entities/MidiClip';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackId } from '../../domain/value-objects/TrackId';
import { ClipType } from '../../domain/value-objects/ClipType';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';

/**
 * Clip Repository Implementation
 * Implements ClipRepository interface with in-memory storage for development
 */
@injectable()
export class ClipRepositoryImpl implements ClipRepository {
  // In-memory storage for development/testing
  private clips: Map<string, Clip> = new Map();
  // Track the relationship between clips and tracks
  private clipToTrack: Map<string, string> = new Map();

  async findById(id: ClipId): Promise<Clip | null> {
    try {
      const clip = this.clips.get(id.toString());
      console.log(`Finding clip by ID: ${id.toString()}`);
      return clip || null;
    } catch (error) {
      console.error('Error finding clip by ID:', error);
      throw error;
    }
  }

  async save(clip: Clip): Promise<void> {
    try {
      const clipIdStr = clip.clipId.toString();
      this.clips.set(clipIdStr, clip);
      console.log(`Saving clip: ${clipIdStr}`);
    } catch (error) {
      console.error('Error saving clip:', error);
      throw error;
    }
  }

  // Additional method to save clip with track relationship
  async saveWithTrack(clip: Clip, trackId: TrackId): Promise<void> {
    try {
      const clipIdStr = clip.clipId.toString();
      this.clips.set(clipIdStr, clip);
      this.clipToTrack.set(clipIdStr, trackId.toString());
      console.log(`Saving clip: ${clipIdStr} for track: ${trackId.toString()}`);
    } catch (error) {
      console.error('Error saving clip with track:', error);
      throw error;
    }
  }

  async delete(id: ClipId): Promise<void> {
    try {
      const clipIdStr = id.toString();
      this.clips.delete(clipIdStr);
      this.clipToTrack.delete(clipIdStr);
      console.log(`Deleting clip: ${clipIdStr}`);
    } catch (error) {
      console.error('Error deleting clip:', error);
      throw error;
    }
  }

  async exists(id: ClipId): Promise<boolean> {
    try {
      const exists = this.clips.has(id.toString());
      console.log(`Checking if clip exists: ${id.toString()} - ${exists}`);
      return exists;
    } catch (error) {
      console.error('Error checking clip existence:', error);
      throw error;
    }
  }

  async findByTrackId(trackId: TrackId): Promise<Clip[]> {
    try {
      const trackIdStr = trackId.toString();
      const clips = Array.from(this.clips.entries())
        .filter(([clipId, _]) => this.clipToTrack.get(clipId) === trackIdStr)
        .map(([_, clip]) => clip);
      console.log(`Finding clips by track ID: ${trackIdStr} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding clips by track ID:', error);
      throw error;
    }
  }

  async findByType(type: ClipType): Promise<Clip[]> {
    try {
      const clips = Array.from(this.clips.values()).filter(
        clip => clip.getType() === type
      );
      console.log(`Finding clips by type: ${type} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding clips by type:', error);
      throw error;
    }
  }

  async findInTimeRange(range: TimeRangeVO): Promise<Clip[]> {
    try {
      const clips = Array.from(this.clips.values()).filter(clip => {
        return clip.range.intersects(range);
      });
      console.log(`Finding clips in time range: ${range.start}-${range.end} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding clips in time range:', error);
      throw error;
    }
  }

  async findAtTime(timePoint: number): Promise<Clip[]> {
    try {
      const clips = Array.from(this.clips.values()).filter(clip => {
        return clip.contains(timePoint);
      });
      console.log(`Finding clips at time: ${timePoint} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding clips at time:', error);
      throw error;
    }
  }

  async findAudioClipsBySourceId(sourceId: string): Promise<AudioClip[]> {
    try {
      const audioClips = Array.from(this.clips.values())
        .filter(clip => clip instanceof AudioClip && clip.sourceId === sourceId) as AudioClip[];
      console.log(`Finding audio clips by source ID: ${sourceId} - found ${audioClips.length}`);
      return audioClips;
    } catch (error) {
      console.error('Error finding audio clips by source ID:', error);
      throw error;
    }
  }

  async findMidiClipsByInstrumentId(instrumentId: string): Promise<MidiClip[]> {
    try {
      const midiClips = Array.from(this.clips.values())
        .filter(clip => clip instanceof MidiClip && clip.instrumentId === instrumentId) as MidiClip[];
      console.log(`Finding MIDI clips by instrument ID: ${instrumentId} - found ${midiClips.length}`);
      return midiClips;
    } catch (error) {
      console.error('Error finding MIDI clips by instrument ID:', error);
      throw error;
    }
  }

  async countByTrackId(trackId: TrackId): Promise<number> {
    try {
      const trackIdStr = trackId.toString();
      const count = Array.from(this.clipToTrack.values()).filter(
        tId => tId === trackIdStr
      ).length;
      console.log(`Counting clips by track ID: ${trackIdStr} - count: ${count}`);
      return count;
    } catch (error) {
      console.error('Error counting clips by track ID:', error);
      throw error;
    }
  }

  async findByNamePattern(pattern: string): Promise<Clip[]> {
    try {
      const regex = new RegExp(pattern, 'i');
      const clips = Array.from(this.clips.values()).filter(
        clip => regex.test(clip.name)
      );
      console.log(`Finding clips by name pattern: ${pattern} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding clips by name pattern:', error);
      throw error;
    }
  }

  async findByTags(tags: string[]): Promise<Clip[]> {
    try {
      const clips = Array.from(this.clips.values()).filter(clip =>
        tags.some(tag => clip.metadata.tags.includes(tag))
      );
      console.log(`Finding clips by tags: ${tags.join(', ')} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding clips by tags:', error);
      throw error;
    }
  }

  async findOverlapping(range: TimeRangeVO, excludeClipId?: ClipId): Promise<Clip[]> {
    try {
      const clips = Array.from(this.clips.values()).filter(clip => {
        // Exclude the specified clip if provided
        if (excludeClipId && clip.clipId.toString() === excludeClipId.toString()) {
          return false;
        }
        
        return clip.range.intersects(range);
      });
      console.log(`Finding overlapping clips in range: ${range.start}-${range.end} - found ${clips.length}`);
      return clips;
    } catch (error) {
      console.error('Error finding overlapping clips:', error);
      throw error;
    }
  }

  async deleteByTrackId(trackId: TrackId): Promise<void> {
    try {
      const trackIdStr = trackId.toString();
      const clipsToDelete = Array.from(this.clipToTrack.entries()).filter(
        ([_, tId]) => tId === trackIdStr
      );
      
      for (const [clipId, _] of clipsToDelete) {
        this.clips.delete(clipId);
        this.clipToTrack.delete(clipId);
      }
      
      console.log(`Deleted ${clipsToDelete.length} clips for track: ${trackIdStr}`);
    } catch (error) {
      console.error('Error deleting clips by track ID:', error);
      throw error;
    }
  }
} 