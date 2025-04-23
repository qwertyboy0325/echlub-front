import { BusTrack } from '../BusTrack';
import { TrackId } from '../../value-objects/track/TrackId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { ClipId } from '../../value-objects/clips/ClipId';
import { TrackType } from '../../value-objects/track/TrackType';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';
import { PluginReference } from '../../value-objects/plugin/PluginReference';

describe('BusTrack', () => {
  let trackId: TrackId;
  let routing: TrackRouting;
  let track: BusTrack;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    track = new BusTrack(trackId, 'Bus Track', routing);
  });

  describe('建構函式', () => {
    it('應該正確初始化基本屬性', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Bus Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.BUS);
      expect(track.getPlugins()).toHaveLength(0);
      expect(track.getSendSettings()).toHaveLength(0);
      expect(track.getReturnSettings()).toHaveLength(0);
      expect(track.getInputTracks()).toHaveLength(0);
    });

    it('應該正確初始化預設插件和設置', () => {
      const plugins = [
        PluginInstanceId.fromString('plugin-1'),
        PluginInstanceId.fromString('plugin-2')
      ];
      const sendSettings = [{
        id: 'send-1',
        targetTrackId: 'track-1',
        level: 0.8,
        pan: 0
      }];
      const returnSettings = [{
        id: 'return-1',
        sourceTrackId: 'track-2',
        level: 0.7,
        pan: -0.5
      }];

      const busTrack = new BusTrack(trackId, 'Bus Track', routing, plugins, sendSettings, returnSettings);
      expect(busTrack.getPlugins()).toHaveLength(2);
      expect(busTrack.getSendSettings()).toHaveLength(1);
      expect(busTrack.getReturnSettings()).toHaveLength(1);
    });
  });

  describe('片段管理', () => {
    it('應該在嘗試添加片段時拋出錯誤', () => {
      const clipId = ClipId.create();
      expect(() => track.addClip(clipId))
        .toThrow('Bus tracks cannot have clips');
    });

    it('應該在嘗試移除片段時拋出錯誤', () => {
      const clipId = ClipId.create();
      expect(() => track.removeClip(clipId))
        .toThrow('Bus tracks cannot have clips');
    });

    it('應該返回空的片段列表', () => {
      expect(track.getClips()).toHaveLength(0);
    });
  });

  describe('發送設置管理', () => {
    const sendSetting = {
      id: 'send-1',
      targetTrackId: 'track-1',
      level: 0.8,
      pan: 0
    };

    it('應該正確添加發送設置', () => {
      track.addSendSetting(sendSetting);
      expect(track.getSendSettings()).toHaveLength(1);
      expect(track.getSendSettings()[0]).toEqual(sendSetting);
    });

    it('應該在發送設置無效時拋出錯誤', () => {
      expect(() => track.addSendSetting({ ...sendSetting, level: -1 }))
        .toThrow('Send level must be between 0 and 1');
      expect(() => track.addSendSetting({ ...sendSetting, pan: 1.5 }))
        .toThrow('Send pan must be between -1 and 1');
    });

    it('應該正確移除發送設置', () => {
      track.addSendSetting(sendSetting);
      expect(track.removeSendSetting(sendSetting.id)).toBe(true);
      expect(track.getSendSettings()).toHaveLength(0);
    });

    it('應該在移除不存在的發送設置時返回 false', () => {
      expect(track.removeSendSetting('non-existent')).toBe(false);
    });
  });

  describe('返回設置管理', () => {
    const returnSetting = {
      id: 'return-1',
      sourceTrackId: 'track-1',
      level: 0.8,
      pan: 0
    };

    it('應該正確添加返回設置', () => {
      track.addReturnSetting(returnSetting);
      expect(track.getReturnSettings()).toHaveLength(1);
      expect(track.getReturnSettings()[0]).toEqual(returnSetting);
    });

    it('應該在返回設置無效時拋出錯誤', () => {
      expect(() => track.addReturnSetting({ ...returnSetting, level: -1 }))
        .toThrow('Return level must be between 0 and 1');
      expect(() => track.addReturnSetting({ ...returnSetting, pan: 1.5 }))
        .toThrow('Return pan must be between -1 and 1');
    });

    it('應該正確移除返回設置', () => {
      track.addReturnSetting(returnSetting);
      expect(track.removeReturnSetting(returnSetting.id)).toBe(true);
      expect(track.getReturnSettings()).toHaveLength(0);
    });

    it('應該在移除不存在的返回設置時返回 false', () => {
      expect(track.removeReturnSetting('non-existent')).toBe(false);
    });
  });

  describe('輸入軌道管理', () => {
    let inputTrackId1: TrackId;
    let inputTrackId2: TrackId;

    beforeEach(() => {
      inputTrackId1 = TrackId.create();
      inputTrackId2 = TrackId.create();
    });

    it('應該正確添加輸入軌道', () => {
      track.addInputTrack(inputTrackId1);
      expect(track.getInputTracks()).toHaveLength(1);
      expect(track.getInputTracks()[0].equals(inputTrackId1)).toBe(true);
    });

    it('應該在添加非 TrackId 實例時拋出錯誤', () => {
      expect(() => track.addInputTrack(null as any))
        .toThrow('Invalid track ID type');
    });

    it('應該正確移除輸入軌道', () => {
      track.addInputTrack(inputTrackId1);
      track.addInputTrack(inputTrackId2);
      expect(track.removeInputTrack(inputTrackId1)).toBe(true);
      expect(track.getInputTracks()).toHaveLength(1);
      expect(track.getInputTracks()[0].equals(inputTrackId2)).toBe(true);
    });

    it('應該在移除不存在的輸入軌道時返回 false', () => {
      expect(track.removeInputTrack(inputTrackId1)).toBe(false);
    });

    it('應該在移除非 TrackId 實例時拋出錯誤', () => {
      expect(() => track.removeInputTrack(null as any))
        .toThrow('Invalid track ID type');
    });
  });

  describe('序列化', () => {
    it('應該返回正確的 JSON 表示', () => {
      const plugin = new PluginReference('plugin-1');
      const inputTrackId = TrackId.create();
      const sendSetting = {
        id: 'send-1',
        targetTrackId: 'track-1',
        level: 0.8,
        pan: 0
      };
      const returnSetting = {
        id: 'return-1',
        sourceTrackId: 'track-2',
        level: 0.7,
        pan: -0.5
      };

      track.addPlugin(plugin);
      track.addInputTrack(inputTrackId);
      track.addSendSetting(sendSetting);
      track.addReturnSetting(returnSetting);

      const json = track.toJSON() as any;
      expect(json).toEqual({
        id: trackId.toString(),
        name: 'Bus Track',
        type: TrackType.BUS.toString(),
        routing: routing.toJSON(),
        plugins: [plugin.toJSON()],
        sendSettings: [sendSetting],
        returnSettings: [returnSetting],
        inputTracks: [inputTrackId.toString()],
        isMuted: false,
        isSolo: false,
        volume: 1,
        version: track.getVersion()
      });
    });
  });

  describe('限制檢查', () => {
    it('應該在超過最大插件數量時拋出錯誤', () => {
      // 添加 10 個插件（最大限制）
      for (let i = 0; i < 10; i++) {
        track.addPlugin(new PluginReference(`plugin-${i}`));
      }
      
      expect(() => track.addPlugin(new PluginReference('plugin-11')))
        .toThrow('Cannot add more than 10 plugins to a track');
    });

    it('應該在超過最大發送設置數量時拋出錯誤', () => {
      // 添加 8 個發送設置（最大限制）
      for (let i = 0; i < 8; i++) {
        track.addSendSetting({
          id: `send-${i}`,
          targetTrackId: `track-${i}`,
          level: 0.8,
          pan: 0
        });
      }
      
      expect(() => track.addSendSetting({
        id: 'send-9',
        targetTrackId: 'track-9',
        level: 0.8,
        pan: 0
      })).toThrow('Cannot add more than 8 send settings');
    });

    it('應該在超過最大返回設置數量時拋出錯誤', () => {
      // 添加 8 個返回設置（最大限制）
      for (let i = 0; i < 8; i++) {
        track.addReturnSetting({
          id: `return-${i}`,
          sourceTrackId: `track-${i}`,
          level: 0.8,
          pan: 0
        });
      }
      
      expect(() => track.addReturnSetting({
        id: 'return-9',
        sourceTrackId: 'track-9',
        level: 0.8,
        pan: 0
      })).toThrow('Cannot add more than 8 return settings');
    });

    it('應該在超過最大輸入軌道數量時拋出錯誤', () => {
      // 添加 16 個輸入軌道（最大限制）
      for (let i = 0; i < 16; i++) {
        track.addInputTrack(TrackId.create());
      }
      
      expect(() => track.addInputTrack(TrackId.create()))
        .toThrow('Cannot add more than 16 input tracks');
    });
  });

  describe('版本控制', () => {
    it('應該在修改時增加版本號', () => {
      const initialVersion = track.getVersion();
      
      track.addPlugin(new PluginReference('plugin-1'));
      expect(track.getVersion()).toBe(initialVersion + 1);
      
      track.addSendSetting({
        id: 'send-1',
        targetTrackId: 'track-1',
        level: 0.8,
        pan: 0
      });
      expect(track.getVersion()).toBe(initialVersion + 2);
      
      track.addReturnSetting({
        id: 'return-1',
        sourceTrackId: 'track-1',
        level: 0.8,
        pan: 0
      });
      expect(track.getVersion()).toBe(initialVersion + 3);
      
      track.addInputTrack(TrackId.create());
      expect(track.getVersion()).toBe(initialVersion + 4);
    });

    it('應該在移除操作時增加版本號', () => {
      const plugin = new PluginReference('plugin-1');
      const inputTrackId = TrackId.create();
      const sendSetting = {
        id: 'send-1',
        targetTrackId: 'track-1',
        level: 0.8,
        pan: 0
      };
      const returnSetting = {
        id: 'return-1',
        sourceTrackId: 'track-1',
        level: 0.8,
        pan: 0
      };

      track.addPlugin(plugin);
      track.addInputTrack(inputTrackId);
      track.addSendSetting(sendSetting);
      track.addReturnSetting(returnSetting);
      
      const versionAfterAdding = track.getVersion();
      
      track.removePlugin(plugin);
      expect(track.getVersion()).toBe(versionAfterAdding + 1);
      
      track.removeInputTrack(inputTrackId);
      expect(track.getVersion()).toBe(versionAfterAdding + 2);
      
      track.removeSendSetting(sendSetting.id);
      expect(track.getVersion()).toBe(versionAfterAdding + 3);
      
      track.removeReturnSetting(returnSetting.id);
      expect(track.getVersion()).toBe(versionAfterAdding + 4);
    });
  });
}); 