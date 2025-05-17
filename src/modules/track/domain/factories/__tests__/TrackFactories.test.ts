import { AudioTrackFactory, InstrumentTrackFactory, BusTrackFactory, TrackFactoryRegistry } from '../TrackFactories';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { TrackType } from '../../value-objects/TrackType';
import { AudioTrack } from '../../entities/AudioTrack';
import { InstrumentTrack } from '../../entities/InstrumentTrack';
import { BusTrack } from '../../entities/BusTrack';
import { PluginReference } from '../../value-objects/PluginReference';

describe('音軌工廠', () => {
  let audioFactory: AudioTrackFactory;
  let instrumentFactory: InstrumentTrackFactory;
  let busFactory: BusTrackFactory;
  let registry: TrackFactoryRegistry;
  let trackId: TrackId;
  let routing: TrackRouting;
  let plugin: PluginReference;

  beforeEach(() => {
    audioFactory = new AudioTrackFactory();
    instrumentFactory = new InstrumentTrackFactory();
    busFactory = new BusTrackFactory();
    registry = new TrackFactoryRegistry(audioFactory, instrumentFactory, busFactory);
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    plugin = PluginReference.create('plugin-1');
  });

  describe('AudioTrackFactory', () => {
    it('應該創建音頻音軌', () => {
      const track = audioFactory.create(trackId, 'Test Audio', routing, [plugin]);
      
      expect(track).toBeInstanceOf(AudioTrack);
      expect(track.getTrackId()).toBe(trackId);
      expect(track.getName()).toBe('Test Audio');
      expect(track.getRouting()).toBe(routing);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin);
    });

    it('應該複製音頻音軌', () => {
      const sourceTrack = audioFactory.create(trackId, 'Source Audio', routing, [plugin]);
      sourceTrack.setVolume(0.5);
      sourceTrack.setMute(true);
      sourceTrack.setSolo(true);

      const newId = TrackId.create();
      const clonedTrack = audioFactory.clone(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(AudioTrack);
      expect(clonedTrack.getTrackId()).toBe(newId);
      expect(clonedTrack.getName()).toBe('Copy of Source Audio');
      expect(clonedTrack.getRouting()).toEqual(sourceTrack.getRouting());
      expect(clonedTrack.getPlugins()).toEqual(sourceTrack.getPlugins());
      expect(clonedTrack.getVolume()).toBe(0.5);
      expect(clonedTrack.isMuted()).toBe(true);
      expect(clonedTrack.isSolo()).toBe(true);
    });

    it('複製時應該拒絕錯誤的音軌類型', () => {
      const sourceTrack = instrumentFactory.create(trackId, 'Wrong Type');
      const newId = TrackId.create();

      expect(() => audioFactory.clone(sourceTrack, newId))
        .toThrow('Source track must be an AudioTrack');
    });
  });

  describe('InstrumentTrackFactory', () => {
    it('應該創建樂器音軌', () => {
      const track = instrumentFactory.create(trackId, 'Test Instrument', routing, [plugin]);
      
      expect(track).toBeInstanceOf(InstrumentTrack);
      expect(track.getTrackId()).toBe(trackId);
      expect(track.getName()).toBe('Test Instrument');
      expect(track.getRouting()).toBe(routing);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin);
    });

    it('應該複製樂器音軌', () => {
      const sourceTrack = instrumentFactory.create(trackId, 'Source Instrument', routing, [plugin]);
      sourceTrack.setVolume(0.7);
      sourceTrack.setMute(true);
      sourceTrack.setSolo(true);

      const newId = TrackId.create();
      const clonedTrack = instrumentFactory.clone(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(InstrumentTrack);
      expect(clonedTrack.getTrackId()).toBe(newId);
      expect(clonedTrack.getName()).toBe('Copy of Source Instrument');
      expect(clonedTrack.getRouting()).toEqual(sourceTrack.getRouting());
      expect(clonedTrack.getPlugins()).toEqual(sourceTrack.getPlugins());
      expect(clonedTrack.getVolume()).toBe(0.7);
      expect(clonedTrack.isMuted()).toBe(true);
      expect(clonedTrack.isSolo()).toBe(true);
    });

    it('複製時應該拒絕錯誤的音軌類型', () => {
      const sourceTrack = audioFactory.create(trackId, 'Wrong Type');
      const newId = TrackId.create();

      expect(() => instrumentFactory.clone(sourceTrack, newId))
        .toThrow('Source track must be an InstrumentTrack');
    });
  });

  describe('BusTrackFactory', () => {
    it('應該創建總線音軌', () => {
      const track = busFactory.create(trackId, 'Test Bus', routing, [plugin]);
      
      expect(track).toBeInstanceOf(BusTrack);
      expect(track.getTrackId()).toBe(trackId);
      expect(track.getName()).toBe('Test Bus');
      expect(track.getRouting()).toBe(routing);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin);
    });

    it('應該複製總線音軌', () => {
      const sourceTrack = busFactory.create(trackId, 'Source Bus', routing, [plugin]);
      sourceTrack.setVolume(0.3);
      sourceTrack.setMute(true);
      sourceTrack.setSolo(true);

      const newId = TrackId.create();
      const clonedTrack = busFactory.clone(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(BusTrack);
      expect(clonedTrack.getTrackId()).toBe(newId);
      expect(clonedTrack.getName()).toBe('Copy of Source Bus');
      expect(clonedTrack.getRouting()).toEqual(sourceTrack.getRouting());
      expect(clonedTrack.getPlugins()).toEqual(sourceTrack.getPlugins());
      expect(clonedTrack.getVolume()).toBe(0.3);
      expect(clonedTrack.isMuted()).toBe(true);
      expect(clonedTrack.isSolo()).toBe(true);
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
      expect(registry.getFactory(TrackType.INSTRUMENT)).toBe(instrumentFactory);
      expect(registry.getFactory(TrackType.BUS)).toBe(busFactory);
    });

    it('應該拋出錯誤當工廠類型不存在', () => {
      const invalidType = 'invalid' as any;
      expect(() => registry.getFactory(invalidType))
        .toThrow('No factory registered for track type: invalid');
    });

    it('應該使用正確的工廠創建音軌', () => {
      const audioTrack = registry.createTrack(TrackType.AUDIO, trackId, 'Audio Track', routing, [plugin]);
      expect(audioTrack).toBeInstanceOf(AudioTrack);

      const instrumentTrack = registry.createTrack(TrackType.INSTRUMENT, trackId, 'Instrument Track', routing, [plugin]);
      expect(instrumentTrack).toBeInstanceOf(InstrumentTrack);

      const busTrack = registry.createTrack(TrackType.BUS, trackId, 'Bus Track', routing, [plugin]);
      expect(busTrack).toBeInstanceOf(BusTrack);
    });

    it('應該使用正確的工廠複製音軌', () => {
      const sourceTrack = audioFactory.create(trackId, 'Source Track');
      const newId = TrackId.create();
      const clonedTrack = registry.cloneTrack(sourceTrack, newId);

      expect(clonedTrack).toBeInstanceOf(AudioTrack);
      expect(clonedTrack.getTrackId()).toBe(newId);
      expect(clonedTrack.getName()).toBe('Copy of Source Track');
    });
  });
}); 
