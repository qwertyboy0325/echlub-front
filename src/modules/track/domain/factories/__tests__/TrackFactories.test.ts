import { AudioTrackFactory, MidiTrackFactory, BusTrackFactory, TrackFactoryRegistry } from '../TrackFactories';
import { TrackId } from '../../value-objects/track/TrackId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { TrackType } from '../../value-objects/track/TrackType';
import { AudioTrack } from '../../entities/AudioTrack';
import { MidiTrack } from '../../entities/MidiTrack';
import { BusTrack } from '../../entities/BusTrack';
import { PluginReference } from '../../value-objects/plugin/PluginReference';

describe('音軌工廠', () => {
  let audioFactory: AudioTrackFactory;
  let midiFactory: MidiTrackFactory;
  let busFactory: BusTrackFactory;
  let registry: TrackFactoryRegistry;
  let trackId: TrackId;
  let routing: TrackRouting;
  let plugin: PluginReference;

  beforeEach(() => {
    audioFactory = new AudioTrackFactory();
    midiFactory = new MidiTrackFactory();
    busFactory = new BusTrackFactory();
    registry = new TrackFactoryRegistry(audioFactory, midiFactory, busFactory);
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    plugin = new PluginReference('plugin-1');
  });

  describe('AudioTrackFactory', () => {
    it('應該創建音頻音軌', () => {
      const track = audioFactory.create(trackId, 'Test Audio', routing);
      
      expect(track).toBeInstanceOf(AudioTrack);
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Audio');
      expect(track.getRouting()).toBe(routing);
      expect(track.getVersion()).toBe(1);

      track.addPlugin(plugin);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin);
      expect(track.getVersion()).toBe(2);
    });

    it('應該複製音頻音軌', () => {
      const sourceTrack = audioFactory.create(trackId, 'Source Audio', routing);
      const initialVersion = sourceTrack.getVersion();
      sourceTrack.setVolume(0.5);
      sourceTrack.setMuted(true);
      sourceTrack.setSolo(true);
      expect(sourceTrack.getVersion()).toBe(initialVersion + 3);

      const newId = TrackId.create();
      const clonedTrack = audioFactory.clone(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(AudioTrack);
      expect(clonedTrack.getId()).toBe(newId.toString());
      expect(clonedTrack.getName()).toBe('Copy of Source Audio');
      expect(clonedTrack.getRouting()).toEqual(sourceTrack.getRouting());
      expect(clonedTrack.getVolume()).toBe(0.5);
      expect(clonedTrack.isMuted()).toBe(true);
      expect(clonedTrack.isSolo()).toBe(true);
      expect(clonedTrack.getVersion()).toBe(initialVersion + 3);
    });

    it('複製時應該拒絕錯誤的音軌類型', () => {
      const sourceTrack = midiFactory.create(trackId, 'Wrong Type');
      const newId = TrackId.create();

      expect(() => audioFactory.clone(sourceTrack, newId))
        .toThrow('Source track must be an AudioTrack');
    });
  });

  describe('MidiTrackFactory', () => {
    it('應該創建 MIDI 音軌', () => {
      const track = midiFactory.create(trackId, 'Test MIDI', routing);
      
      expect(track).toBeInstanceOf(MidiTrack);
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test MIDI');
      expect(track.getRouting()).toBe(routing);
      expect(track.getVersion()).toBe(1);

      track.addPlugin(plugin);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin);
      expect(track.getVersion()).toBe(2);
    });

    it('應該複製 MIDI 音軌', () => {
      const sourceTrack = midiFactory.create(trackId, 'Source MIDI', routing);
      const initialVersion = sourceTrack.getVersion();
      sourceTrack.setVolume(0.7);
      sourceTrack.setMuted(true);
      sourceTrack.setSolo(true);
      expect(sourceTrack.getVersion()).toBe(initialVersion + 3);

      const newId = TrackId.create();
      const clonedTrack = midiFactory.clone(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(MidiTrack);
      expect(clonedTrack.getId()).toBe(newId.toString());
      expect(clonedTrack.getName()).toBe('Copy of Source MIDI');
      expect(clonedTrack.getRouting()).toEqual(sourceTrack.getRouting());
      expect(clonedTrack.getVolume()).toBe(0.7);
      expect(clonedTrack.isMuted()).toBe(true);
      expect(clonedTrack.isSolo()).toBe(true);
      expect(clonedTrack.getVersion()).toBe(initialVersion + 3);
    });

    it('複製時應該拒絕錯誤的音軌類型', () => {
      const sourceTrack = audioFactory.create(trackId, 'Wrong Type');
      const newId = TrackId.create();

      expect(() => midiFactory.clone(sourceTrack, newId))
        .toThrow('Source track must be a MidiTrack');
    });
  });

  describe('BusTrackFactory', () => {
    it('應該創建總線音軌', () => {
      const track = busFactory.create(trackId, 'Test Bus', routing);
      
      expect(track).toBeInstanceOf(BusTrack);
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Bus');
      expect(track.getRouting()).toBe(routing);
      expect(track.getVersion()).toBe(1);

      track.addPlugin(plugin);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin);
      expect(track.getVersion()).toBe(2);
    });

    it('應該複製總線音軌', () => {
      const sourceTrack = busFactory.create(trackId, 'Source Bus', routing);
      const initialVersion = sourceTrack.getVersion();
      sourceTrack.setVolume(0.3);
      sourceTrack.setMuted(true);
      sourceTrack.setSolo(true);
      expect(sourceTrack.getVersion()).toBe(initialVersion + 3);

      const newId = TrackId.create();
      const clonedTrack = busFactory.clone(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(BusTrack);
      expect(clonedTrack.getId()).toBe(newId.toString());
      expect(clonedTrack.getName()).toBe('Copy of Source Bus');
      expect(clonedTrack.getRouting()).toEqual(sourceTrack.getRouting());
      expect(clonedTrack.getVolume()).toBe(0.3);
      expect(clonedTrack.isMuted()).toBe(true);
      expect(clonedTrack.isSolo()).toBe(true);
      expect(clonedTrack.getVersion()).toBe(initialVersion + 3);
    });

    it('複製時應該拒絕錯誤的音軌類型', () => {
      const sourceTrack = audioFactory.create(trackId, 'Wrong Type');
      const newId = TrackId.create();

      expect(() => busFactory.clone(sourceTrack, newId))
        .toThrow('Source track must be a BusTrack');
    });
  });

  describe('TrackFactoryRegistry', () => {
    it('應該返回正確的工廠', () => {
      expect(registry.getFactory(TrackType.AUDIO)).toBe(audioFactory);
      expect(registry.getFactory(TrackType.MIDI)).toBe(midiFactory);
      expect(registry.getFactory(TrackType.BUS)).toBe(busFactory);
    });

    it('應該拋出錯誤當工廠類型不存在', () => {
      const invalidType = 'invalid' as any;
      expect(() => registry.getFactory(invalidType))
        .toThrow('No factory registered for track type: invalid');
    });

    it('應該使用正確的工廠創建音軌', () => {
      const audioTrack = registry.createTrack(TrackType.AUDIO, trackId, 'Audio Track', routing);
      expect(audioTrack).toBeInstanceOf(AudioTrack);
      expect(audioTrack.getVersion()).toBe(1);

      audioTrack.addPlugin(plugin);
      expect(audioTrack.getVersion()).toBe(2);

      const midiTrack = registry.createTrack(TrackType.MIDI, trackId, 'MIDI Track', routing);
      expect(midiTrack).toBeInstanceOf(MidiTrack);
      expect(midiTrack.getVersion()).toBe(1);

      const busTrack = registry.createTrack(TrackType.BUS, trackId, 'Bus Track', routing);
      expect(busTrack).toBeInstanceOf(BusTrack);
      expect(busTrack.getVersion()).toBe(1);
    });

    it('應該使用正確的工廠複製音軌', () => {
      const sourceTrack = audioFactory.create(trackId, 'Source Track');
      expect(sourceTrack.getVersion()).toBe(1);

      sourceTrack.setVolume(0.5);
      expect(sourceTrack.getVersion()).toBe(2);

      const newId = TrackId.create();
      const clonedTrack = registry.cloneTrack(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(AudioTrack);
      expect(clonedTrack.getId()).toBe(newId.toString());
      expect(clonedTrack.getName()).toBe('Copy of Source Track');
      expect(clonedTrack.getVolume()).toBe(0.5);

      expect(clonedTrack.getVersion()).toBe(sourceTrack.getVersion());
    });
  });
}); 