import { TrackId } from '../../domain/value-objects/track/TrackId';

export interface CreateClipParams {
  startTime: number;
  duration: number;
  // 音頻片段特有
  sampleId?: string;
  offset?: number;
  // MIDI片段特有
  timeSignature?: {
    numerator: number;
    denominator: number;
  };
}

export class CreateClipInTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly params: CreateClipParams
  ) {}
} 