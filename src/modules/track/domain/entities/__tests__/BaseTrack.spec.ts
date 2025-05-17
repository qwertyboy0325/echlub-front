import { BaseTrack } from '../BaseTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { TrackType } from '../../value-objects/TrackType';
import { ClipId } from '../../value-objects/ClipId';
import { PluginReference } from '../../value-objects/PluginReference';

// 創建一個具體的 BaseTrack 實現用於測試
class TestTrack extends BaseTrack {
  addClip(_clipId: ClipId): void {
    this.incrementVersion();
  }

  removeClip(_clipId: ClipId): void {
    this.incrementVersion();
  }
}

describe('BaseTrack', () => {
  let track: TestTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    track = new TestTrack(trackId, 'Test Track', routing, TrackType.AUDIO);
  });

  describe('基本屬性', () => {
    it('應該正確初始化基本屬性', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.AUDIO);
      expect(track.getVersion()).toBe(0);
    });

    it('應該正確管理版本號', () => {
      const initialVersion = track.getVersion();
      track.incrementVersion();
      expect(track.getVersion()).toBe(initialVersion + 1);
    });
  });

  describe('插件管理', () => {
    it('應該能夠添加插件', () => {
      const plugin = PluginReference.create('plugin-1');
      track.addPlugin(plugin);
      expect(track.getPlugins()).toContainEqual(plugin);
      expect(track.getVersion()).toBe(1);
    });

    it('不應該重複添加相同的插件', () => {
      const plugin = PluginReference.create('plugin-1');
      track.addPlugin(plugin);
      track.addPlugin(plugin);
      expect(track.getPlugins()).toHaveLength(1);
    });

    it('應該能夠移除插件', () => {
      const plugin = PluginReference.create('plugin-1');
      track.addPlugin(plugin);
      track.removePlugin(plugin);
      expect(track.getPlugins()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });

    it('移除不存在的插件不應該改變版本號', () => {
      const plugin = PluginReference.create('plugin-1');
      const initialVersion = track.getVersion();
      track.removePlugin(plugin);
      expect(track.getVersion()).toBe(initialVersion);
    });
  });

  describe('路由管理', () => {
    it('應該能夠更新路由', () => {
      const newRouting = new TrackRouting('input-2', 'output-2');
      track.updateRouting(newRouting);
      expect(track.getRouting()).toBe(newRouting);
      expect(track.getVersion()).toBe(1);
    });
  });

  describe('名稱管理', () => {
    it('應該能夠重命名音軌', () => {
      track.rename('New Name');
      expect(track.getName()).toBe('New Name');
      expect(track.getVersion()).toBe(1);
    });
  });

  describe('靜音和獨奏', () => {
    it('應該能夠設置靜音狀態', () => {
      track.setMute(true);
      expect(track.isMuted()).toBe(true);
      expect(track.getVersion()).toBe(1);
    });

    it('應該能夠設置獨奏狀態', () => {
      track.setSolo(true);
      expect(track.isSolo()).toBe(true);
      expect(track.getVersion()).toBe(1);
    });
  });

  describe('音量控制', () => {
    it('應該能夠設置有效的音量', () => {
      track.setVolume(0.5);
      expect(track.getVolume()).toBe(0.5);
      expect(track.getVersion()).toBe(1);
    });

    it('設置負音量應該拋出錯誤', () => {
      expect(() => track.setVolume(-1)).toThrow('Volume cannot be negative');
    });
  });

  describe('狀態管理', () => {
    it('應該返回正確的狀態對象', () => {
      const plugin = PluginReference.create('plugin-1');
      track.addPlugin(plugin);
      track.setMute(true);
      track.setSolo(true);
      track.setVolume(0.7);

      const state = track.getState();
      expect(state).toEqual({
        name: 'Test Track',
        routing: routing,
        mute: true,
        solo: true,
        volume: 0.7,
        plugins: [plugin]
      });
    });
  });

  describe('JSON序列化', () => {
    it('應該正確序列化為JSON', () => {
      const plugin = PluginReference.create('plugin-1');
      track.addPlugin(plugin);
      track.setMute(true);
      track.setSolo(true);
      track.setVolume(0.7);

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
          volume: 0.7,
          plugins: [plugin]
        }
      });
    });
  });
}); 
