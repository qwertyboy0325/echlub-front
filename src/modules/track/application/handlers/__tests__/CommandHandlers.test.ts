import { Container } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { AudioClipId } from '../../../domain/value-objects/AudioClipId';
import { PluginReference } from '../../../domain/value-objects/PluginReference';
import { IPluginReference } from '../../../domain/interfaces/IPluginReference';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { BusTrack } from '../../../domain/entities/BusTrack';
import { CreateTrackCommand } from '../../commands/CreateTrackCommand';
import { RenameTrackCommand } from '../../commands/RenameTrackCommand';
import { AddClipToTrackCommand } from '../../commands/AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../../commands/RemoveClipFromTrackCommand';
import { ChangeTrackRoutingCommand } from '../../commands/ChangeTrackRoutingCommand';
import { AddPluginToTrackCommand } from '../../commands/AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../../commands/RemovePluginFromTrackCommand';
import { AddInputTrackToBusCommand } from '../../commands/AddInputTrackToBusCommand';
import { RemoveInputTrackFromBusCommand } from '../../commands/RemoveInputTrackFromBusCommand';
import { CreateTrackCommandHandler } from '../CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../RemovePluginFromTrackCommandHandler';
import { AddInputTrackToBusCommandHandler } from '../AddInputTrackToBusCommandHandler';
import { RemoveInputTrackFromBusCommandHandler } from '../RemoveInputTrackFromBusCommandHandler';
import { TrackFactoryRegistry } from '../../../domain/factories/TrackFactories';
import { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { PluginReferenceAdapter } from '../../../infrastructure/adapters/PluginReferenceAdapter';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';

describe('命令處理器', () => {
  let container: Container;
  let repository: jest.Mocked<ITrackRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let factoryRegistry: jest.Mocked<TrackFactoryRegistry>;
  let pluginAdapter: jest.Mocked<PluginReferenceAdapter>;
  let trackId: TrackId;
  let routing: TrackRouting;
  let clipId: AudioClipId;
  let pluginRef: IPluginReference;
  let pluginInstanceId: PluginInstanceId;
  let track: AudioTrack;
  let busTrack: BusTrack;

  beforeEach(() => {
    container = new Container();
    
    // Mock repository
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    // Mock event bus
    eventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      publish: jest.fn()
    };

    // Mock factory registry
    factoryRegistry = {
      createTrack: jest.fn(),
      cloneTrack: jest.fn(),
      getFactory: jest.fn()
    } as any;

    // Mock plugin adapter
    pluginAdapter = {
      toPluginReference: jest.fn((id) => ({
        id: 'plugin-1',
        equals: (other: any) => other && other.id === 'plugin-1',
        toString: () => 'plugin-1'
      }))
    } as any;

    // Setup test data
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    clipId = AudioClipId.fromString('audio-clip-1');
    pluginInstanceId = PluginInstanceId.fromString('plugin-1');
    pluginRef = {
      id: 'plugin-1',
      equals: (other: any) => other && other.id === 'plugin-1',
      toString: () => 'plugin-1'
    };
    track = new AudioTrack(trackId, 'Test Track', routing);
    busTrack = new BusTrack(trackId, 'Test Bus', routing);

    // Register mocks
    container.bind(TrackTypes.TrackRepository).toConstantValue(repository);
    container.bind(TrackTypes.EventBus).toConstantValue(eventBus);
    container.bind(TrackTypes.TrackFactoryRegistry).toConstantValue(factoryRegistry);
    container.bind(TrackTypes.PluginReferenceAdapter).toConstantValue(pluginAdapter);

    // Register handlers
    container.bind(CreateTrackCommandHandler).toSelf();
    container.bind(RenameTrackCommandHandler).toSelf();
    container.bind(AddClipToTrackCommandHandler).toSelf();
    container.bind(RemoveClipFromTrackCommandHandler).toSelf();
    container.bind(ChangeTrackRoutingCommandHandler).toSelf();
    container.bind(AddPluginToTrackCommandHandler).toSelf();
    container.bind(RemovePluginFromTrackCommandHandler).toSelf();
    container.bind(AddInputTrackToBusCommandHandler).toSelf();
    container.bind(RemoveInputTrackFromBusCommandHandler).toSelf();
  });

  describe('CreateTrackCommandHandler', () => {
    it('應該創建新音軌並發布事件', async () => {
      const handler = container.get(CreateTrackCommandHandler);
      const command = new CreateTrackCommand('Test Track', TrackType.AUDIO);
      
      factoryRegistry.createTrack.mockReturnValue(track);
      
      const result = await handler.handle(command);
      
      expect(factoryRegistry.createTrack).toHaveBeenCalledWith(
        TrackType.AUDIO,
        expect.any(TrackId),
        'Test Track'
      );
      expect(repository.create).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
      expect(result).toBeInstanceOf(TrackId);
    });
  });

  describe('RenameTrackCommandHandler', () => {
    it('應該重命名音軌並發布事件', async () => {
      const handler = container.get(RenameTrackCommandHandler);
      const command = new RenameTrackCommand(trackId, 'New Name');
      
      repository.findById.mockResolvedValue(track);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(track.getName()).toBe('New Name');
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當音軌不存在時應該拋出錯誤', async () => {
      const handler = container.get(RenameTrackCommandHandler);
      const command = new RenameTrackCommand(trackId, 'New Name');
      
      repository.findById.mockResolvedValue(undefined);
      
      await expect(handler.handle(command))
        .rejects.toThrow(`Track with id ${trackId} not found`);
    });
  });

  describe('AddClipToTrackCommandHandler', () => {
    it('應該添加片段到音軌並發布事件', async () => {
      const handler = container.get(AddClipToTrackCommandHandler);
      const command = new AddClipToTrackCommand(trackId, clipId);
      
      repository.findById.mockResolvedValue(track);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('RemoveClipFromTrackCommandHandler', () => {
    it('應該從音軌移除片段並發布事件', async () => {
      const handler = container.get(RemoveClipFromTrackCommandHandler);
      const command = new RemoveClipFromTrackCommand(trackId, clipId);
      
      repository.findById.mockResolvedValue(track);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('ChangeTrackRoutingCommandHandler', () => {
    it('應該更新音軌路由並發布事件', async () => {
      const handler = container.get(ChangeTrackRoutingCommandHandler);
      const newRouting = new TrackRouting('new-input', 'new-output');
      const command = new ChangeTrackRoutingCommand(trackId, newRouting);
      
      repository.findById.mockResolvedValue(track);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(track.getRouting()).toBe(newRouting);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('AddPluginToTrackCommandHandler', () => {
    it('應該添加插件到音軌並發布事件', async () => {
      const handler = container.get(AddPluginToTrackCommandHandler);
      const command = new AddPluginToTrackCommand(trackId, pluginRef);
      
      repository.findById.mockResolvedValue(track);
      pluginAdapter.toPluginReference.mockReturnValue(pluginRef);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: expect.any(String),
          aggregateId: trackId.toString(),
          timestamp: expect.any(Date),
          payload: expect.objectContaining({
            pluginId: pluginInstanceId.toString()
          })
        })
      );
    });
  });

  describe('RemovePluginFromTrackCommandHandler', () => {
    it('應該從音軌移除插件並發布事件', async () => {
      const handler = container.get(RemovePluginFromTrackCommandHandler);
      const command = new RemovePluginFromTrackCommand(trackId, pluginRef);
      
      repository.findById.mockResolvedValue(track);
      pluginAdapter.toPluginReference.mockReturnValue(pluginRef);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(track);
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('AddInputTrackToBusCommandHandler', () => {
    it('應該添加輸入音軌到總線音軌並發布事件', async () => {
      const handler = container.get(AddInputTrackToBusCommandHandler);
      const inputTrackId = TrackId.create();
      const command = new AddInputTrackToBusCommand(trackId, inputTrackId);
      
      repository.findById.mockResolvedValue(busTrack);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(busTrack);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('當音軌不是總線音軌時應該拋出錯誤', async () => {
      const handler = container.get(AddInputTrackToBusCommandHandler);
      const inputTrackId = TrackId.create();
      const command = new AddInputTrackToBusCommand(trackId, inputTrackId);
      
      repository.findById.mockResolvedValue(track);
      
      await expect(handler.handle(command))
        .rejects.toThrow('Track is not a bus track');
    });
  });

  describe('RemoveInputTrackFromBusCommandHandler', () => {
    it('應該從總線音軌移除輸入音軌並發布事件', async () => {
      const handler = container.get(RemoveInputTrackFromBusCommandHandler);
      const inputTrackId = TrackId.create();
      const command = new RemoveInputTrackFromBusCommand(trackId, inputTrackId);
      
      repository.findById.mockResolvedValue(busTrack);
      
      await handler.handle(command);
      
      expect(repository.findById).toHaveBeenCalledWith(trackId);
      expect(repository.save).toHaveBeenCalledWith(busTrack);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'track:input:removed',
          aggregateId: trackId.toString(),
          timestamp: expect.any(Date),
          payload: expect.objectContaining({
            inputTrackId: inputTrackId.toString()
          })
        })
      );
    });
  });
}); 