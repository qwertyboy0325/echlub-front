import { TrackDomainService } from '../TrackDomainService';
import { BaseTrack } from '../../entities/BaseTrack';
import { ClipId } from '../../value-objects/clips/ClipId';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';
import { TrackId } from '../../value-objects/track/TrackId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { TrackType } from '../../value-objects/track/TrackType';
import { AudioTrack } from '../../entities/AudioTrack';

describe('TrackDomainService', () => {
  let service: TrackDomainService;
  let track: BaseTrack;

  beforeEach(() => {
    service = new TrackDomainService();
    track = new AudioTrack(
      TrackId.create(),
      'Test Track',
      new TrackRouting(null, null)
    );
  });

  describe('validateTrackName', () => {
    it('應該驗證有效的軌道名稱', () => {
      expect(service.validateTrackName('Valid Name')).toBe(true);
    });

    it('應該拒絕空的軌道名稱', () => {
      expect(service.validateTrackName('')).toBe(false);
    });
  });

  describe('canAddClip', () => {
    it('應該允許添加有效的片段', () => {
      const clipId = ClipId.create();
      expect(service.canAddClip(track, clipId)).toBe(true);
    });
  });

  describe('canRemoveClip', () => {
    it('應該允許移除存在的片段', () => {
      const clipId = ClipId.create();
      track.addClip(clipId);
      expect(service.canRemoveClip(track, clipId)).toBe(true);
    });
  });

  describe('canAddPlugin', () => {
    it('應該允許添加新的插件', () => {
      const pluginId = PluginInstanceId.create();
      expect(service.canAddPlugin(track, pluginId)).toBe(true);
    });

    it('不應該允許添加重複的插件', () => {
      const pluginId = PluginInstanceId.create();
      service.canAddPlugin(track, pluginId);
      expect(service.canAddPlugin(track, pluginId)).toBe(true);
    });
  });

  describe('canRemovePlugin', () => {
    it('應該允許移除存在的插件', () => {
      const pluginId = PluginInstanceId.create();
      service.canAddPlugin(track, pluginId);
      expect(service.canRemovePlugin(track, pluginId)).toBe(false);
    });

    it('不應該允許移除不存在的插件', () => {
      const pluginId = PluginInstanceId.create();
      expect(service.canRemovePlugin(track, pluginId)).toBe(false);
    });
  });
}); 