import { Container } from 'inversify';
import { TrackModule } from '../../di/TrackModule';
import { TrackService } from '../../application/services/TrackService';
import { TrackTypes } from '../../di/TrackTypes';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackType } from '../../domain/value-objects/TrackType';
import { TrackRouting } from '../../domain/value-objects/TrackRouting';
import { AudioClipId } from '../../domain/value-objects/AudioClipId';
import { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../core/event-bus/IEventBus';
import { AudioTrack } from '../../domain/entities/AudioTrack';
import { BusTrack } from '../../domain/entities/BusTrack';
import { InstrumentTrack } from '../../domain/entities/InstrumentTrack';
import { PluginReference } from '../../domain/value-objects/PluginReference';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { IDomainEvent } from '../../domain/interfaces/IDomainEvent';

// 創建模擬的 EventBus 實現
class MockEventBus implements IEventBus {
  private handlers: Map<string, Function[]> = new Map();

  async publish(event: IDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  async emit(eventName: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(eventName) || [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }

  on(eventName: string, listener: Function): this {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(listener);
    this.handlers.set(eventName, handlers);
    return this;
  }

  off(eventName: string, listener: Function): this {
    const handlers = this.handlers.get(eventName) || [];
    const index = handlers.indexOf(listener);
    if (index > -1) {
      handlers.splice(index, 1);
    }
    this.handlers.set(eventName, handlers);
    return this;
  }

  once(eventName: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.off(eventName, onceWrapper);
      listener.apply(this, args);
    };
    return this.on(eventName, onceWrapper);
  }

  subscribe(eventType: string, handler: Function): void {
    this.on(eventType, handler);
  }

  unsubscribe(eventType: string, handler: Function): void {
    this.off(eventType, handler);
  }
}

describe('Track Module Integration Tests', () => {
  let container: Container;
  let trackService: TrackService;
  let repository: ITrackRepository;
  let eventBus: IEventBus;

  beforeEach(() => {
    container = new Container();

    // 綁定模擬的 EventBus
    container.bind<IEventBus>(TrackTypes.EventBus).toConstantValue(new MockEventBus());

    // 配置 TrackModule
    TrackModule.configure(container);

    // 獲取服務實例
    trackService = container.get<TrackService>(TrackTypes.TrackService);
    repository = container.get<ITrackRepository>(TrackTypes.TrackRepository);
    eventBus = container.get<IEventBus>(TrackTypes.EventBus);
  });

  describe('音軌生命週期測試', () => {
    it('應該能夠創建、修改和刪除音頻音軌', async () => {
      // 1. 創建音軌
      const trackId = await trackService.createTrack('Test Audio Track', 'audio');
      let track = await repository.findById(trackId);
      expect(track).toBeInstanceOf(AudioTrack);
      expect(track?.getName()).toBe('Test Audio Track');

      // 2. 重命名音軌
      await trackService.renameTrack(trackId, 'Updated Audio Track');
      track = await repository.findById(trackId);
      expect(track?.getName()).toBe('Updated Audio Track');

      // 3. 添加音頻片段
      const clipId = AudioClipId.fromString('test-clip-1');
      await trackService.addClipToTrack(trackId, clipId);
      const audioTrack = await repository.findById(trackId);
      expect(audioTrack).toBeInstanceOf(AudioTrack);
      if (audioTrack instanceof AudioTrack) {
        expect(audioTrack.getAudioClips()).toContainEqual(clipId);
      }

      // 4. 更新路由
      const newRouting = new TrackRouting('input-2', 'output-2');
      await trackService.setTrackRouting(trackId, newRouting);
      track = await repository.findById(trackId);
      expect(track?.getRouting()).toEqual(newRouting);

      // 5. 更新音量和靜音狀態
      await trackService.updateTrackVolume(trackId, 0.8);
      await trackService.toggleMute(trackId);
      track = await repository.findById(trackId);
      expect(track?.getVolume()).toBe(0.8);
      expect(track?.isMuted()).toBe(true);
    });

    it('應該能夠創建和管理總線音軌', async () => {
      // 1. 創建總線音軌
      const busTrackId = await trackService.createTrack('Test Bus Track', 'bus');
      let track = await repository.findById(busTrackId);
      expect(track).toBeInstanceOf(BusTrack);

      // 2. 創建輸入音軌
      const inputTrackId = await trackService.createTrack('Input Track', 'audio');

      // 3. 添加輸入音軌到總線
      await trackService.addInputTrackToBus(busTrackId, inputTrackId);
      track = await repository.findById(busTrackId);
      expect(track).toBeInstanceOf(BusTrack);
      if (track instanceof BusTrack) {
        expect(track.getInputTracks()).toContainEqual(inputTrackId);
      }

      // 4. 移除輸入音軌
      await trackService.removeInputTrackFromBus(busTrackId, inputTrackId);
      track = await repository.findById(busTrackId);
      expect(track).toBeInstanceOf(BusTrack);
      if (track instanceof BusTrack) {
        expect(track.getInputTracks()).not.toContainEqual(inputTrackId);
      }
    });

    it('應該能夠管理插件', async () => {
      // 1. 創建音軌
      const trackId = await trackService.createTrack('Plugin Test Track', 'audio');

      // 2. 添加插件
      const pluginRef = PluginReference.create('test-plugin-1');
      await trackService.addPluginToTrack(trackId, pluginRef);
      let track = await repository.findById(trackId);
      expect(track?.getPlugins()).toContainEqual(pluginRef);

      // 3. 移除插件
      await trackService.removePluginFromTrack(trackId, pluginRef);
      track = await repository.findById(trackId);
      expect(track?.getPlugins()).not.toContainEqual(pluginRef);
    });
  });

  describe('錯誤處理測試', () => {
    it('應該在創建無效音軌時拋出錯誤', async () => {
      await expect(trackService.createTrack('', 'audio'))
        .rejects
        .toThrow();
    });

    it('應該在音軌不存在時拋出錯誤', async () => {
      const nonExistentId = TrackId.create();
      await expect(trackService.renameTrack(nonExistentId, 'New Name'))
        .rejects
        .toThrow();
    });

    it('應該在設置負音量時拋出錯誤', async () => {
      const trackId = await trackService.createTrack('Volume Test Track', 'audio');
      await expect(trackService.updateTrackVolume(trackId, -1))
        .rejects
        .toThrow('Volume cannot be negative');
    });
  });

  describe('事件發布測試', () => {
    it('應該在音軌操作時發布相應事件', async () => {
      const publishSpy = jest.spyOn(eventBus, 'publish');

      // 創建音軌（會發布 TrackCreatedEvent 兩次）
      const trackId = await trackService.createTrack('Event Test Track', 'audio');
      expect(publishSpy).toHaveBeenCalledTimes(2);

      // 更新音軌（會發布 TrackRenamedEvent 和 TrackUpdatedEvent）
      await trackService.renameTrack(trackId, 'Updated Track');
      expect(publishSpy).toHaveBeenCalledTimes(4);

      // 驗證事件類型
      const eventTypes = publishSpy.mock.calls.map(call => (call[0] as IDomainEvent).eventType);
      expect(eventTypes).toContain('track:created');
      expect(eventTypes).toContain('track:renamed');
      expect(eventTypes).toContain('track:updated');

      publishSpy.mockRestore();
    });
  });

  describe('複雜場景測試', () => {
    it('應該能夠創建完整的混音設置', async () => {
      // 1. 創建多個音軌
      const audioTrackId = await trackService.createTrack('Audio Track', 'audio');
      const instrumentTrackId = await trackService.createTrack('Instrument Track', 'instrument');
      const busTrackId = await trackService.createTrack('Bus Track', 'bus');

      // 2. 設置路由
      const audioRouting = new TrackRouting('audio-in', 'bus-in');
      const instrumentRouting = new TrackRouting('midi-in', 'bus-in');
      const busRouting = new TrackRouting('bus-in', 'master-out');

      await trackService.setTrackRouting(audioTrackId, audioRouting);
      await trackService.setTrackRouting(instrumentTrackId, instrumentRouting);
      await trackService.setTrackRouting(busTrackId, busRouting);

      // 3. 添加到總線
      await trackService.addInputTrackToBus(busTrackId, audioTrackId);
      await trackService.addInputTrackToBus(busTrackId, instrumentTrackId);

      // 4. 設置音量和狀態
      await trackService.updateTrackVolume(audioTrackId, 0.8);
      await trackService.updateTrackVolume(instrumentTrackId, 0.7);
      await trackService.updateTrackVolume(busTrackId, 0.9);

      // 5. 驗證最終狀態
      const track = await repository.findById(busTrackId);
      expect(track).toBeInstanceOf(BusTrack);
      if (track instanceof BusTrack) {
        expect(track.getInputTracks()).toHaveLength(2);
        expect(track.getVolume()).toBe(0.9);
        expect(track.getRouting()).toEqual(busRouting);
      }
    });
  });
}); 