import { BusTrack, SendSetting, ReturnSetting } from '../BusTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';
import { AudioClipId } from '../../value-objects/AudioClipId';

describe('BusTrack', () => {
  let track: BusTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    track = new BusTrack(trackId, 'Test Bus Track', routing);
  });

  describe('片段管理限制', () => {
    it('嘗試添加片段應該拋出錯誤', () => {
      const clipId = AudioClipId.create();
      expect(() => track.addClip(clipId)).toThrow('Bus tracks cannot have clips');
    });

    it('嘗試移除片段應該拋出錯誤', () => {
      const clipId = AudioClipId.create();
      expect(() => track.removeClip(clipId)).toThrow('Bus tracks cannot have clips');
    });
  });

  describe('發送設置管理', () => {
    const sendSetting: SendSetting = {
      id: 'send-1',
      targetTrackId: 'track-1',
      level: 0.8,
      pan: 0.0
    };

    it('應該能夠添加發送設置', () => {
      track.addSendSetting(sendSetting);
      expect(track.getSendSettings()).toContainEqual(sendSetting);
    });

    it('不應該重複添加相同的發送設置', () => {
      track.addSendSetting(sendSetting);
      track.addSendSetting(sendSetting);
      expect(track.getSendSettings()).toHaveLength(1);
    });

    it('應該能夠移除發送設置', () => {
      track.addSendSetting(sendSetting);
      track.removeSendSetting(sendSetting.id);
      expect(track.getSendSettings()).toHaveLength(0);
    });
  });

  describe('返回設置管理', () => {
    const returnSetting: ReturnSetting = {
      id: 'return-1',
      sourceTrackId: 'track-1',
      level: 0.8,
      pan: 0.0
    };

    it('應該能夠添加返回設置', () => {
      track.addReturnSetting(returnSetting);
      expect(track.getReturnSettings()).toContainEqual(returnSetting);
    });

    it('不應該重複添加相同的返回設置', () => {
      track.addReturnSetting(returnSetting);
      track.addReturnSetting(returnSetting);
      expect(track.getReturnSettings()).toHaveLength(1);
    });

    it('應該能夠移除返回設置', () => {
      track.addReturnSetting(returnSetting);
      track.removeReturnSetting(returnSetting.id);
      expect(track.getReturnSettings()).toHaveLength(0);
    });
  });

  describe('輸入音軌管理', () => {
    let inputTrackId: TrackId;

    beforeEach(() => {
      inputTrackId = TrackId.create();
    });

    it('應該能夠添加輸入音軌', () => {
      track.addInputTrack(inputTrackId);
      expect(track.getInputTracks()).toContainEqual(inputTrackId);
    });

    it('不應該重複添加相同的輸入音軌', () => {
      track.addInputTrack(inputTrackId);
      track.addInputTrack(inputTrackId);
      expect(track.getInputTracks()).toHaveLength(1);
    });

    it('應該能夠移除輸入音軌', () => {
      track.addInputTrack(inputTrackId);
      track.removeInputTrack(inputTrackId);
      expect(track.getInputTracks()).toHaveLength(0);
    });

    it('移除不存在的輸入音軌不應該改變版本號', () => {
      const initialVersion = track.getVersion();
      track.removeInputTrack(inputTrackId);
      expect(track.getVersion()).toBe(initialVersion);
    });
  });

  describe('插件管理', () => {
    it('應該在構造時添加插件', () => {
      const pluginId = PluginInstanceId.fromString('plugin-1');
      const track = new BusTrack(
        trackId,
        'Test Bus Track',
        routing,
        [pluginId]
      );
      expect(track.getPlugins()).toHaveLength(1);
    });
  });

  describe('JSON序列化', () => {
    it('應該正確序列化所有屬性', () => {
      const inputTrackId = TrackId.create();
      track.addInputTrack(inputTrackId);

      const sendSetting: SendSetting = {
        id: 'send-1',
        targetTrackId: 'track-1',
        level: 0.8,
        pan: 0.0
      };
      track.addSendSetting(sendSetting);

      const returnSetting: ReturnSetting = {
        id: 'return-1',
        sourceTrackId: 'track-1',
        level: 0.8,
        pan: 0.0
      };
      track.addReturnSetting(returnSetting);

      const json = track.toJSON();
      expect(json).toHaveProperty('inputTracks', [inputTrackId.toString()]);
      expect(json).toHaveProperty('trackId', trackId.toString());
      expect(json).toHaveProperty('name', 'Test Bus Track');
      expect(json).toHaveProperty('routing', routing);
    });
  });
}); 