import { InstrumentTrack } from '../InstrumentTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { MidiClipId } from '../../value-objects/MidiClipId';
import { AudioClipId } from '../../value-objects/AudioClipId';
import { TrackType } from '../../value-objects/TrackType';

describe('InstrumentTrack', () => {
  let track: InstrumentTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    track = new InstrumentTrack(trackId, 'Test Instrument Track', routing);
  });

  describe('基本屬性', () => {
    it('應該正確初始化', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Instrument Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.INSTRUMENT);
      expect(track.getMidiClips()).toHaveLength(0);
    });
  });

  describe('MIDI片段管理', () => {
    let midiClip: MidiClipId;
    let audioClip: AudioClipId;

    beforeEach(() => {
      midiClip = MidiClipId.create();
      audioClip = AudioClipId.create();
    });

    it('應該能添加MIDI片段', () => {
      track.addClip(midiClip);
      expect(track.getMidiClips()).toContainEqual(midiClip);
      expect(track.getVersion()).toBe(1);
    });

    it('不應該添加音頻片段', () => {
      expect(() => track.addClip(audioClip)).toThrow('Only MIDI clips can be added to instrument tracks');
      expect(track.getMidiClips()).toHaveLength(0);
      expect(track.getVersion()).toBe(0);
    });

    it('應該能移除MIDI片段', () => {
      track.addClip(midiClip);
      track.removeClip(midiClip);
      expect(track.getMidiClips()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });

    it('移除音頻片段時應拋出錯誤', () => {
      expect(() => track.removeClip(audioClip)).toThrow('Only MIDI clips can be removed from instrument tracks');
      expect(track.getVersion()).toBe(0);
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為JSON', () => {
      const midiClip = MidiClipId.create();
      track.addClip(midiClip);

      const json = track.toJSON();
      expect(json).toEqual({
        ...track.toJSON(),
        midiClips: [midiClip.toString()]
      });
    });
  });
}); 