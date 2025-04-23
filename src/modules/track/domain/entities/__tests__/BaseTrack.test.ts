import { BaseTrack } from '../BaseTrack';
import { TrackId } from '../../value-objects/track/TrackId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { TrackType } from '../../value-objects/track/TrackType';
import { PluginReference } from '../../value-objects/plugin/PluginReference';
import { ClipId } from '../../value-objects/clips/ClipId';

// 創建一個具體的 BaseTrack 實現用於測試
class TestTrack extends BaseTrack {
  private clips: ClipId[] = [];

  addClip(clipId: ClipId): void {
    this.clips.push(clipId);
  }

  removeClip(clipId: ClipId): void {
    this.clips = this.clips.filter(id => !id.equals(clipId));
  }

  getClips(): ClipId[] {
    return [...this.clips];
  }
}

describe('BaseTrack', () => {
  let trackId: TrackId;
  let routing: TrackRouting;
  let track: TestTrack;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    track = new TestTrack(trackId, 'Test Track', routing, TrackType.AUDIO);
  });

  describe('建構函式', () => {
    it('應該正確初始化基本屬性', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.AUDIO);
      expect(track.getVersion()).toBe(1);
      expect(track.getVolume()).toBe(1.0);
      expect(track.isMuted()).toBe(false);
      expect(track.isSolo()).toBe(false);
      expect(track.getPlugins()).toHaveLength(0);
    });

    it('應該在參數無效時拋出錯誤', () => {
      expect(() => new TestTrack(null as any, 'Test Track', routing, TrackType.AUDIO))
        .toThrow('Track ID cannot be null');
      expect(() => new TestTrack(trackId, '', routing, TrackType.AUDIO))
        .toThrow('Track name cannot be empty');
      expect(() => new TestTrack(trackId, 'Test Track', null as any, TrackType.AUDIO))
        .toThrow('Track routing cannot be null');
      expect(() => new TestTrack(trackId, 'Test Track', routing, null as any))
        .toThrow('Track type cannot be null');
    });
  });

  describe('插件管理', () => {
    let plugin1: PluginReference;
    let plugin2: PluginReference;

    beforeEach(() => {
      plugin1 = new PluginReference('plugin-1');
      plugin2 = new PluginReference('plugin-2');
    });

    it('應該正確添加插件', () => {
      track.addPlugin(plugin1);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin1);
    });

    it('應該在添加重複插件時拋出錯誤', () => {
      track.addPlugin(plugin1);
      expect(() => track.addPlugin(plugin1))
        .toThrow('Plugin already exists in track');
    });

    it('應該在超出最大插件數量時拋出錯誤', () => {
      for (let i = 0; i < 10; i++) {
        track.addPlugin(new PluginReference(`plugin-${i}`));
      }
      expect(() => track.addPlugin(new PluginReference('plugin-10')))
        .toThrow('Cannot add more than 10 plugins to a track');
    });

    it('應該正確移除插件', () => {
      track.addPlugin(plugin1);
      track.addPlugin(plugin2);
      expect(track.removePlugin(plugin1)).toBe(true);
      expect(track.getPlugins()).toHaveLength(1);
      expect(track.getPlugins()[0]).toBe(plugin2);
    });

    it('應該在移除不存在的插件時返回 false', () => {
      expect(track.removePlugin(plugin1)).toBe(false);
    });
  });

  describe('音頻控制', () => {
    it('應該正確設置音量', () => {
      track.setVolume(0.5);
      expect(track.getVolume()).toBe(0.5);
    });

    it('應該在音量值無效時拋出錯誤', () => {
      expect(() => track.setVolume(-1)).toThrow('Volume cannot be negative');
      expect(() => track.setVolume(2.1)).toThrow('Volume cannot exceed 2.0 (200%)');
      expect(() => track.setVolume(NaN)).toThrow('Volume must be a number');
    });

    it('應該正確設置靜音狀態', () => {
      track.setMuted(true);
      expect(track.isMuted()).toBe(true);
      track.setMuted(false);
      expect(track.isMuted()).toBe(false);
    });

    it('應該在靜音值無效時拋出錯誤', () => {
      expect(() => track.setMuted(null as any))
        .toThrow('Mute value must be a boolean');
    });

    it('應該正確設置獨奏狀態', () => {
      track.setSolo(true);
      expect(track.isSolo()).toBe(true);
      track.setSolo(false);
      expect(track.isSolo()).toBe(false);
    });

    it('應該在獨奏值無效時拋出錯誤', () => {
      expect(() => track.setSolo(null as any))
        .toThrow('Solo value must be a boolean');
    });
  });

  describe('版本控制', () => {
    it('應該在修改時增加版本號', () => {
      const initialVersion = track.getVersion();
      track.setVolume(0.5);
      expect(track.getVersion()).toBe(initialVersion + 1);
    });

    it('應該在多次修改後正確反映版本號', () => {
      const initialVersion = track.getVersion();
      track.setVolume(0.5);
      track.setMuted(true);
      track.setSolo(true);
      expect(track.getVersion()).toBe(initialVersion + 3);
    });

    it('應該正確驗證版本號', () => {
      const currentVersion = track.getVersion();
      expect(() => track['validateVersion'](currentVersion)).not.toThrow();
      expect(() => track['validateVersion'](currentVersion + 1))
        .toThrow(`Version mismatch. Expected ${currentVersion + 1}, got ${currentVersion}`);
    });
  });

  describe('序列化', () => {
    it('應該返回正確的 JSON 表示', () => {
      const json = track.toJSON() as any;
      expect(json.id).toBe(trackId.toString());
      expect(json.name).toBe('Test Track');
      expect(json.type).toBe('audio');
      expect(json.routing).toEqual(routing.toJSON());
      expect(json.plugins).toEqual([]);
      expect(json.isMuted).toBe(false);
      expect(json.isSolo).toBe(false);
      expect(json.volume).toBe(1.0);
      expect(json.version).toBe(1);
    });
  });
}); 