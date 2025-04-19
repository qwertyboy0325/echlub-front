import { AudioTrack } from '../AudioTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { AudioClipId } from '../../value-objects/AudioClipId';
import { MidiClipId } from '../../value-objects/MidiClipId';
import { TrackType } from '../../value-objects/TrackType';

describe('AudioTrack', () => {
  let track: AudioTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    track = new AudioTrack(trackId, 'Test Audio Track', routing);
  });

  describe('基本屬性', () => {
    it('應該正確初始化', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Audio Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.AUDIO);
      expect(track.getAudioClips()).toHaveLength(0);
    });
  });

  describe('音頻片段管理', () => {
    let audioClip: AudioClipId;
    let midiClip: MidiClipId;

    beforeEach(() => {
      audioClip = AudioClipId.create();
      midiClip = MidiClipId.create();
    });

    it('應該能添加音頻片段', () => {
      track.addClip(audioClip);
      expect(track.getAudioClips()).toContainEqual(audioClip);
      expect(track.getVersion()).toBe(1);
    });

    it('不應該添加MIDI片段', () => {
      expect(() => track.addClip(midiClip)).toThrow('Only audio clips can be added to audio tracks');
      expect(track.getAudioClips()).toHaveLength(0);
      expect(track.getVersion()).toBe(0);
    });

    it('應該能移除音頻片段', () => {
      track.addClip(audioClip);
      track.removeClip(audioClip);
      expect(track.getAudioClips()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });

    it('移除MIDI片段時應拋出錯誤', () => {
      expect(() => track.removeClip(midiClip)).toThrow('Only audio clips can be removed from audio tracks');
      expect(track.getVersion()).toBe(0);
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為JSON', () => {
      const audioClip = AudioClipId.create();
      track.addClip(audioClip);

      const json = track.toJSON();
      expect(json).toEqual({
        ...track.toJSON(),
        audioClips: [audioClip.toString()]
      });
    });
  });
}); 