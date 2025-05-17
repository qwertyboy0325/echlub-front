import { AudioTrack } from '../AudioTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { AudioClipId } from '../../value-objects/AudioClipId';

describe('AudioTrack', () => {
  let track: AudioTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    track = new AudioTrack(trackId, 'Test Audio Track', routing);
  });

  describe('片段管理', () => {
    it('應該能夠添加音頻片段', () => {
      const clipId = AudioClipId.fromString('audio-clip-1');
      track.addClip(clipId);
      expect(track.getAudioClips()).toContainEqual(clipId);
    });

    it('不應該重複添加相同的音頻片段', () => {
      const clipId = AudioClipId.fromString('audio-clip-1');
      track.addClip(clipId);
      track.addClip(clipId);
      expect(track.getAudioClips()).toHaveLength(1);
    });

    it('應該能夠移除音頻片段', () => {
      const clipId = AudioClipId.fromString('audio-clip-1');
      track.addClip(clipId);
      track.removeClip(clipId);
      expect(track.getAudioClips()).toHaveLength(0);
    });
  });

  describe('JSON序列化', () => {
    it('應該正確序列化音頻片段', () => {
      const clipId1 = AudioClipId.fromString('audio-clip-1');
      const clipId2 = AudioClipId.fromString('audio-clip-2');
      track.addClip(clipId1);
      track.addClip(clipId2);

      const json = track.toJSON() as any;
      expect(json).toHaveProperty('audioClips');
      expect(json.audioClips).toEqual([
        clipId1.toString(),
        clipId2.toString()
      ]);
    });

    it('應該包含基礎音軌屬性', () => {
      const json = track.toJSON();
      expect(json).toHaveProperty('trackId', trackId.toString());
      expect(json).toHaveProperty('name', 'Test Audio Track');
      expect(json).toHaveProperty('routing', routing);
    });
  });
}); 
