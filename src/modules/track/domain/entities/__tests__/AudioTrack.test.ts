import { AudioTrack } from '../AudioTrack';
import { TrackId } from '../../value-objects/track/TrackId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { ClipId } from '../../value-objects/clips/ClipId';
import { TrackType } from '../../value-objects/track/TrackType';
import { PluginReference } from '../../value-objects/plugin/PluginReference';

describe('AudioTrack', () => {
  let trackId: TrackId;
  let routing: TrackRouting;
  let track: AudioTrack;
  let plugin1: PluginReference;
  let plugin2: PluginReference;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    plugin1 = new PluginReference('plugin-1');
    plugin2 = new PluginReference('plugin-2');

    track = new AudioTrack(
      trackId,
      'Test Audio Track',
      routing,
      {
        isMuted: false,
        isSolo: false,
        volume: 0.8,
        plugins: [plugin1],
        version: 1
      }
    );
  });

  describe('建構函式', () => {
    it('應該正確初始化基本屬性', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Audio Track');
      expect(track.getType()).toBe(TrackType.AUDIO);
      expect(track.getAudioClips()).toHaveLength(0);
    });

    it('應該正確初始化預設插件', () => {
      const plugins = [plugin1, plugin2];
      const trackWithPlugins = new AudioTrack(
        trackId,
        'Test Track',
        routing,
        {
          plugins,
          version: 1
        }
      );
      expect(trackWithPlugins.getPlugins()).toHaveLength(2);
      expect(trackWithPlugins.getPlugins()).toContainEqual(plugin1);
      expect(trackWithPlugins.getPlugins()).toContainEqual(plugin2);
    });

    it('應該在參數無效時拋出錯誤', () => {
      expect(() => new AudioTrack(null as any, 'Test Track', routing))
        .toThrow('Track ID cannot be null');
      expect(() => new AudioTrack(trackId, '', routing))
        .toThrow('Track name cannot be empty');
      expect(() => new AudioTrack(trackId, 'Test Track', null as any))
        .toThrow('Track routing cannot be null');
    });
  });

  describe('片段管理', () => {
    let clipId1: ClipId;
    let clipId2: ClipId;

    beforeEach(() => {
      clipId1 = ClipId.create();
      clipId2 = ClipId.create();
    });

    it('應該正確添加音頻片段', () => {
      track.addClip(clipId1);
      expect(track.getAudioClips()).toHaveLength(1);
      expect(track.getAudioClips()[0].equals(clipId1)).toBe(true);
    });

    it('應該忽略重複的音頻片段', () => {
      track.addClip(clipId1);
      track.addClip(clipId1);
      expect(track.getAudioClips()).toHaveLength(1);
    });

    it('應該正確移除音頻片段', () => {
      track.addClip(clipId1);
      track.addClip(clipId2);
      track.removeClip(clipId1);
      expect(track.getAudioClips()).toHaveLength(1);
      expect(track.getAudioClips()[0].equals(clipId2)).toBe(true);
    });

    it('應該在移除不存在的片段時不拋出錯誤', () => {
      expect(() => track.removeClip(clipId1)).not.toThrow();
    });

    it('應該在添加非 ClipId 實例時拋出錯誤', () => {
      expect(() => track.addClip(null as any))
        .toThrow('Only audio clips can be added to audio tracks');
    });

    it('應該在移除非 ClipId 實例時拋出錯誤', () => {
      expect(() => track.removeClip(null as any))
        .toThrow('Only audio clips can be removed from audio tracks');
    });
  });

  describe('插件管理', () => {
    it('應該能夠添加插件', () => {
      track.addPlugin(plugin2);
      expect(track.getPlugins()).toContainEqual(plugin2);
      expect(track.getVersion()).toBe(2);
    });

    it('添加重複插件時應該拋出錯誤', () => {
      expect(() => track.addPlugin(plugin1))
        .toThrow('Plugin already exists in track');
    });

    it('應該能夠移除插件', () => {
      track.removePlugin(plugin1);
      expect(track.getPlugins()).not.toContainEqual(plugin1);
      expect(track.getVersion()).toBe(2);
    });
  });

  describe('序列化', () => {
    it('應該能夠正確序列化為 JSON', () => {
      const json = track.toJSON();
      expect(json).toEqual({
        id: trackId.toString(),
        name: 'Test Audio Track',
        type: 'audio',
        routing: routing.toJSON(),
        plugins: [plugin1.toJSON()],
        audioClips: [],
        isMuted: false,
        isSolo: false,
        volume: 0.8,
        version: 1
      });
    });
  });
}); 