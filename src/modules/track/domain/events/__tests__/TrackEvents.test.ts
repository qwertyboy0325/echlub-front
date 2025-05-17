import { TrackId } from '../../value-objects/TrackId';
import { TrackType } from '../../value-objects/TrackType';
import { TrackRouting } from '../../value-objects/TrackRouting';
import { BaseTrack } from '../../entities/BaseTrack';
import { AudioTrack } from '../../entities/AudioTrack';
import { TrackCreatedEvent } from '../TrackCreatedEvent';
import { TrackUpdatedEvent } from '../TrackUpdatedEvent';
import { TrackDeletedEvent } from '../TrackDeletedEvent';
import { TrackRenamedEvent } from '../TrackRenamedEvent';
import { TrackRoutingChangedEvent } from '../TrackRoutingChangedEvent';
import { PluginAddedToTrackEvent } from '../PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../PluginRemovedFromTrackEvent';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';
import { PluginReference } from '../../value-objects/PluginReference';

describe('Track Events', () => {
  let trackId: TrackId;
  let track: BaseTrack;
  let routing: TrackRouting;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('master');
    track = new AudioTrack(
      trackId,
      'Test Track',
      routing
    );
  });

  describe('TrackCreatedEvent', () => {
    it('應該正確初始化事件', () => {
      const event = new TrackCreatedEvent(trackId, 'Test Track', TrackType.AUDIO);
      
      expect(event.trackId).toBe(trackId);
      expect(event.name).toBe('Test Track');
      expect(event.type).toBe(TrackType.AUDIO);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('TrackUpdatedEvent', () => {
    it('應該正確初始化事件並包含音軌數據', () => {
      const event = new TrackUpdatedEvent(trackId, track);
      
      expect(event.eventType).toBe('track:updated');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.track).toBe(track);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('TrackDeletedEvent', () => {
    it('應該正確初始化事件', () => {
      const event = new TrackDeletedEvent(trackId);
      
      expect(event.eventType).toBe('track:deleted');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload).toEqual({});
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('TrackRenamedEvent', () => {
    it('應該正確初始化事件並包含新名稱', () => {
      const newName = 'New Track Name';
      const event = new TrackRenamedEvent(trackId, newName);
      
      expect(event.eventType).toBe('track:renamed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.newName).toBe(newName);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('TrackRoutingChangedEvent', () => {
    it('應該正確初始化事件並包含新的路由設置', () => {
      const newRouting = new TrackRouting('bus-1');
      const event = new TrackRoutingChangedEvent(trackId, newRouting);
      
      expect(event.eventType).toBe('track:routing:changed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.routing).toBe(newRouting);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Plugin Events', () => {
    let pluginId: PluginInstanceId;
    let pluginRef: PluginReference;

    beforeEach(() => {
      pluginId = PluginInstanceId.create();
      pluginRef = PluginReference.create(pluginId.toString());
    });

    it('PluginAddedToTrackEvent 應該正確初始化', () => {
      const event = new PluginAddedToTrackEvent(trackId, pluginId);
      
      expect(event.eventType).toBe('track:plugin:added');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.pluginId).toBe(pluginId.toString());
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('PluginRemovedFromTrackEvent 應該正確初始化', () => {
      const event = new PluginRemovedFromTrackEvent(trackId, pluginRef);
      
      expect(event.eventType).toBe('track:plugin:removed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.pluginId).toBe(pluginRef.toString());
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });
}); 
