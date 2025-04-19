import { BusTrack } from '../BusTrack';
import { TrackId } from '../../value-objects/TrackId';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { AudioClipId } from '../../value-objects/AudioClipId';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';
import { TrackType } from '../../value-objects/TrackType';

describe('BusTrack', () => {
  let track: BusTrack;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    track = new BusTrack(trackId, 'Test Bus Track', routing);
  });

  describe('基本屬性', () => {
    it('應該正確初始化', () => {
      expect(track.getId()).toBe(trackId.toString());
      expect(track.getName()).toBe('Test Bus Track');
      expect(track.getRouting()).toBe(routing);
      expect(track.getType()).toBe(TrackType.BUS);
      expect(track.getInputTracks()).toHaveLength(0);
    });
  });

  describe('片段管理限制', () => {
    it('不應該允許添加片段', () => {
      const clipId = AudioClipId.create();
      expect(() => track.addClip(clipId)).toThrow('Bus tracks cannot have clips');
    });

    it('不應該允許移除片段', () => {
      const clipId = AudioClipId.create();
      expect(() => track.removeClip(clipId)).toThrow('Bus tracks cannot have clips');
    });
  });

  describe('輸入音軌管理', () => {
    let inputTrackId: TrackId;

    beforeEach(() => {
      inputTrackId = TrackId.create();
    });

    it('應該能添加輸入音軌', () => {
      track.addInputTrack(inputTrackId);
      expect(track.getInputTracks()).toContainEqual(inputTrackId);
      expect(track.getVersion()).toBe(1);
    });

    it('不應重複添加相同的輸入音軌', () => {
      track.addInputTrack(inputTrackId);
      track.addInputTrack(inputTrackId);
      expect(track.getInputTracks()).toHaveLength(1);
      expect(track.getVersion()).toBe(1);
    });

    it('應該能移除輸入音軌', () => {
      track.addInputTrack(inputTrackId);
      track.removeInputTrack(inputTrackId);
      expect(track.getInputTracks()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });
  });

  describe('發送設置管理', () => {
    const sendSetting = {
      id: 'send-1',
      targetTrackId: 'target-1',
      level: 0.8,
      pan: 0.0
    };

    it('應該能添加發送設置', () => {
      track.addSendSetting(sendSetting);
      expect(track.getSendSettings()).toContainEqual(sendSetting);
      expect(track.getVersion()).toBe(1);
    });

    it('不應重複添加相同ID的發送設置', () => {
      track.addSendSetting(sendSetting);
      track.addSendSetting(sendSetting);
      expect(track.getSendSettings()).toHaveLength(1);
      expect(track.getVersion()).toBe(1);
    });

    it('應該能移除發送設置', () => {
      track.addSendSetting(sendSetting);
      track.removeSendSetting(sendSetting.id);
      expect(track.getSendSettings()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });
  });

  describe('返回設置管理', () => {
    const returnSetting = {
      id: 'return-1',
      sourceTrackId: 'source-1',
      level: 0.8,
      pan: 0.0
    };

    it('應該能添加返回設置', () => {
      track.addReturnSetting(returnSetting);
      expect(track.getReturnSettings()).toContainEqual(returnSetting);
      expect(track.getVersion()).toBe(1);
    });

    it('不應重複添加相同ID的返回設置', () => {
      track.addReturnSetting(returnSetting);
      track.addReturnSetting(returnSetting);
      expect(track.getReturnSettings()).toHaveLength(1);
      expect(track.getVersion()).toBe(1);
    });

    it('應該能移除返回設置', () => {
      track.addReturnSetting(returnSetting);
      track.removeReturnSetting(returnSetting.id);
      expect(track.getReturnSettings()).toHaveLength(0);
      expect(track.getVersion()).toBe(2);
    });
  });

  describe('序列化', () => {
    it('應該正確序列化為JSON', () => {
      const inputTrackId = TrackId.create();
      track.addInputTrack(inputTrackId);

      const json = track.toJSON();
      expect(json).toEqual({
        ...track.toJSON(),
        inputTracks: [inputTrackId.toString()]
      });
    });
  });
}); 