import { injectable } from 'inversify';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { AudioTrack } from '../entities/AudioTrack';
import { TrackType } from '../value-objects/TrackType';

@injectable()
export class TrackFactory {
  createTrack(id: TrackId, name: string, type: TrackType): AudioTrack {
    const routing = new TrackRouting(null, null);
    return new AudioTrack(id, name, routing, type);
  }
} 