import { TrackEventDecorator } from '../TrackEventDecorator';
import { AudioTrack } from '../../entities/AudioTrack';
import { TrackId } from '../../value-objects/track/TrackId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { TrackNameChangedEvent } from '../../events/TrackNameChangedEvent';
import { TrackGainChangedEvent } from '../../events/TrackGainChangedEvent';
import { TrackRoutingChangedEvent } from '../../events/TrackRoutingChangedEvent';
import { TrackMuteChangedEvent } from '../../events/TrackMuteChangedEvent';
import { TrackSoloChangedEvent } from '../../events/TrackSoloChangedEvent';

describe('TrackEventDecorator', () => {
  let track: AudioTrack;
  let eventBus: jest.Mocked<IEventBus>;
  let decorator: TrackEventDecorator;
  let trackId: TrackId;
  let routing: TrackRouting;

  beforeEach(() => {
    // 設置測試環境
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    track = new AudioTrack(trackId, 'Test Track', routing);
    
    // 創建模擬的 EventBus
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    };

    // 創建裝飾器實例
    decorator = new TrackEventDecorator(track, eventBus);
  });

  describe('rename', () => {
    it('應該發布 TrackNameChangedEvent 並更新軌道名稱', async () => {
      const oldName = track.getName();
      const newName = 'New Track Name';

      await decorator.rename(newName);

      // 驗證事件發布
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TrackNameChangedEvent)
      );
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0] as TrackNameChangedEvent;
      expect(publishedEvent.oldName).toBe(oldName);
      expect(publishedEvent.newName).toBe(newName);

      // 驗證軌道名稱已更新
      expect(track.getName()).toBe(newName);
    });
  });

  describe('setVolume', () => {
    it('應該發布 TrackGainChangedEvent 並更新軌道音量', async () => {
      const oldVolume = track.getVolume();
      const newVolume = 0.8;

      await decorator.setVolume(newVolume);

      // 驗證事件發布
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TrackGainChangedEvent)
      );
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0] as TrackGainChangedEvent;
      expect(publishedEvent.oldGain).toBe(oldVolume);
      expect(publishedEvent.newGain).toBe(newVolume);

      // 驗證軌道音量已更新
      expect(track.getVolume()).toBe(newVolume);
    });

    it('當音量超出範圍時應拋出錯誤', async () => {
      await expect(decorator.setVolume(-1)).rejects.toThrow('Volume cannot be negative');
      await expect(decorator.setVolume(2.1)).rejects.toThrow('Volume cannot exceed 2.0 (200%)');
    });
  });

  describe('setRouting', () => {
    it('應該發布 TrackRoutingChangedEvent 並更新軌道路由', async () => {
      const oldRouting = track.getRouting();
      const newRouting = new TrackRouting('new-input', 'new-output');

      await decorator.setRouting(newRouting);

      // 驗證事件發布
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TrackRoutingChangedEvent)
      );
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0] as TrackRoutingChangedEvent;
      expect(publishedEvent.oldRouting).toBe(oldRouting);
      expect(publishedEvent.newRouting).toBe(newRouting);

      // 驗證軌道路由已更新
      expect(track.getRouting()).toBe(newRouting);
    });

    it('當路由為空時應拋出錯誤', async () => {
      await expect(decorator.setRouting(null as any)).rejects.toThrow('Routing cannot be null');
    });
  });

  describe('setMuted', () => {
    it('應該發布 TrackMuteChangedEvent 並更新軌道靜音狀態', async () => {
      const oldMuted = track.isMuted();
      const newMuted = true;

      await decorator.setMuted(newMuted);

      // 驗證事件發布
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TrackMuteChangedEvent)
      );
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0] as TrackMuteChangedEvent;
      expect(publishedEvent.oldMuted).toBe(oldMuted);
      expect(publishedEvent.newMuted).toBe(newMuted);

      // 驗證軌道靜音狀態已更新
      expect(track.isMuted()).toBe(newMuted);
    });
  });

  describe('setSolo', () => {
    it('應該發布 TrackSoloChangedEvent 並更新軌道獨奏狀態', async () => {
      const oldSolo = track.isSolo();
      const newSolo = true;

      await decorator.setSolo(newSolo);

      // 驗證事件發布
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TrackSoloChangedEvent)
      );
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0] as TrackSoloChangedEvent;
      expect(publishedEvent.oldSolo).toBe(oldSolo);
      expect(publishedEvent.newSolo).toBe(newSolo);

      // 驗證軌道獨奏狀態已更新
      expect(track.isSolo()).toBe(newSolo);
    });
  });

  describe('代理方法', () => {
    it('應該正確代理所有只讀方法', () => {
      expect(decorator.getId()).toBe(track.getId());
      expect(decorator.getName()).toBe(track.getName());
      expect(decorator.getVolume()).toBe(track.getVolume());
      expect(decorator.getRouting()).toBe(track.getRouting());
      expect(decorator.isMuted()).toBe(track.isMuted());
      expect(decorator.isSolo()).toBe(track.isSolo());
      expect(decorator.getType()).toBe(track.getType());
      expect(decorator.getClips()).toEqual(track.getClips());
      expect(decorator.getPlugins()).toEqual(track.getPlugins());
      expect(decorator.getVersion()).toBe(track.getVersion());
    });
  });
}); 