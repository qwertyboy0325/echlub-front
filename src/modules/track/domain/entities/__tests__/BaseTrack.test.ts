import { BaseTrack } from '../BaseTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { TrackType } from '../../value-objects/TrackType';
import { PluginReference } from '../../value-objects/PluginReference';
import { ClipId } from '../../value-objects/ClipId';

// 創建一個測試用的具體 Track 類
class TestTrack extends BaseTrack {
  addClip(clipId: ClipId): void {
    this.incrementVersion();
  }

  removeClip(clipId: ClipId): void {
    this.incrementVersion();
  }
}

describe('BaseTrack', () => {
  let track: TestTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    track = new TestTrack(trackId, 'Test Track', routing, TrackType.AUDIO);
  });

  describe('基本屬性和方法', () => {
    it('應該正確初始化基本屬性', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.AUDIO);
      expect(track.getVersion()).toBe(0);
    });

    it('應該正確更新版本號', () => {
      track.incrementVersion();
      expect(track.getVersion()).toBe(1);
    });

    it('應該正確重命名', () => {
      track.rename('New Name');
      expect(track.getName()).toBe('New Name');
      expect(track.getVersion()).toBe(1);
    });
  });

  describe('插件管理', () => {
    let plugin: PluginReference;

    beforeEach(() => {
      plugin = PluginReference.create('test-plugin');
    });

    it('應該能添加插件', () => {
      track.addPlugin(plugin);
      expect(track.getPlugins()).toContainEqual(plugin);
      expect(track.getVersion()).toBe(1);
    });

    it('不應重複添加相同插件', () => {
      track.addPlugin(plugin);
      track.addPlugin(plugin);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getVersion()).toBe(1);
    });

    it('應該能移除插件', () => {
      track.addPlugin(plugin);
      track.removePlugin(plugin);
      expect(track.getPlugins()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });
  });

  describe('路由管理', () => {
    it('應該能更新路由', () => {
      const newRouting = new TrackRouting('new-input', 'new-output');
      track.updateRouting(newRouting);
      expect(track.getRouting()).toBe(newRouting);
      expect(track.getVersion()).toBe(1);
    });
  });

  describe('音量控制', () => {
    it('應該能設置音量', () => {
      track.setVolume(0.5);
      expect(track.getVolume()).toBe(0.5);
      expect(track.getVersion()).toBe(1);
    });

    it('不應接受負音量', () => {
      expect(() => track.setVolume(-1)).toThrow('Volume cannot be negative');
    });
  });

  describe('靜音和獨奏', () => {
    it('應該能切換靜音狀態', () => {
      track.setMute(true);
      expect(track.isMuted()).toBe(true);
      expect(track.getVersion()).toBe(1);

      track.setMute(false);
      expect(track.isMuted()).toBe(false);
      expect(track.getVersion()).toBe(2);
    });

    it('應該能切換獨奏狀態', () => {
      track.setSolo(true);
      expect(track.isSolo()).toBe(true);
      expect(track.getVersion()).toBe(1);

      track.setSolo(false);
      expect(track.isSolo()).toBe(false);
      expect(track.getVersion()).toBe(2);
    });
  });

  describe('序列化', () => {
    it('應該能正確序列化為 JSON', () => {
      const plugin = PluginReference.create('test-plugin');
      track.addPlugin(plugin);
      track.setVolume(0.8);
      track.setMute(true);
      track.setSolo(true);

      const json = track.toJSON();
      expect(json).toEqual({
        trackId: trackId.toString(),
        name: 'Test Track',
        routing: routing,
        type: TrackType.AUDIO.toString(),
        version: track.getVersion(),
        plugins: [plugin.toString()],
        state: {
          name: 'Test Track',
          routing: routing,
          mute: true,
          solo: true,
          volume: 0.8,
          plugins: [plugin]
        }
      });
    });
  });
}); 