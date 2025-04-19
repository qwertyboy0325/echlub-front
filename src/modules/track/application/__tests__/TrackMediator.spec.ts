import { Container } from 'inversify';
import { TrackMediator } from '../mediators/TrackMediator';
import { TrackTypes } from '../../di/TrackTypes';
import { CreateTrackCommandHandler } from '../handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../handlers/RemovePluginFromTrackCommandHandler';
import { TrackId } from '../../domain/value-objects/TrackId';
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { RenameTrackCommand } from '../commands/RenameTrackCommand';
import { TrackType } from '../../domain/value-objects/TrackType';
import { AddClipToTrackCommand } from '../commands/AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../commands/RemoveClipFromTrackCommand';
import { ChangeTrackRoutingCommand } from '../commands/ChangeTrackRoutingCommand';
import { AddPluginToTrackCommand } from '../commands/AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../commands/RemovePluginFromTrackCommand';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TrackRouting } from '../../domain/value-objects/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';

describe('TrackMediator', () => {
  let container: Container;
  let trackMediator: TrackMediator;
  let mockCreateHandler: jest.Mocked<CreateTrackCommandHandler>;
  let mockRenameHandler: jest.Mocked<RenameTrackCommandHandler>;
  let mockAddClipHandler: jest.Mocked<AddClipToTrackCommandHandler>;
  let mockRemoveClipHandler: jest.Mocked<RemoveClipFromTrackCommandHandler>;
  let mockChangeRoutingHandler: jest.Mocked<ChangeTrackRoutingCommandHandler>;
  let mockAddPluginHandler: jest.Mocked<AddPluginToTrackCommandHandler>;
  let mockRemovePluginHandler: jest.Mocked<RemovePluginFromTrackCommandHandler>;

  beforeEach(() => {
    container = new Container();
    
    // 設置 mock handlers
    mockCreateHandler = { handle: jest.fn() } as any;
    mockRenameHandler = { handle: jest.fn() } as any;
    mockAddClipHandler = { handle: jest.fn() } as any;
    mockRemoveClipHandler = { handle: jest.fn() } as any;
    mockChangeRoutingHandler = { handle: jest.fn() } as any;
    mockAddPluginHandler = { handle: jest.fn() } as any;
    mockRemovePluginHandler = { handle: jest.fn() } as any;

    // 綁定 mock handlers
    container.bind(TrackTypes.CreateTrackCommandHandler).toConstantValue(mockCreateHandler);
    container.bind(TrackTypes.RenameTrackCommandHandler).toConstantValue(mockRenameHandler);
    container.bind(TrackTypes.AddClipToTrackCommandHandler).toConstantValue(mockAddClipHandler);
    container.bind(TrackTypes.RemoveClipFromTrackCommandHandler).toConstantValue(mockRemoveClipHandler);
    container.bind(TrackTypes.ChangeTrackRoutingCommandHandler).toConstantValue(mockChangeRoutingHandler);
    container.bind(TrackTypes.AddPluginToTrackCommandHandler).toConstantValue(mockAddPluginHandler);
    container.bind(TrackTypes.RemovePluginFromTrackCommandHandler).toConstantValue(mockRemovePluginHandler);

    container.bind(TrackMediator).toSelf();
    trackMediator = container.get(TrackMediator);
  });

  describe('createTrack', () => {
    it('應該將命令委託給 CreateTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const command = new CreateTrackCommand('Test Track', TrackType.AUDIO);
      
      mockCreateHandler.handle.mockResolvedValue(trackId);

      const result = await trackMediator.createTrack(command);

      expect(result).toBe(trackId);
      expect(mockCreateHandler.handle).toHaveBeenCalledWith(command);
    });

    it('應該正確處理不同類型的音軌創建', async () => {
      const trackId = TrackId.create();
      const types = [TrackType.AUDIO, TrackType.INSTRUMENT, TrackType.BUS];

      for (const type of types) {
        const command = new CreateTrackCommand(`Test ${type} Track`, type);
        mockCreateHandler.handle.mockResolvedValue(trackId);

        const result = await trackMediator.createTrack(command);

        expect(result).toBe(trackId);
        expect(mockCreateHandler.handle).toHaveBeenCalledWith(command);
      }
    });
  });

  describe('renameTrack', () => {
    it('應該將命令委託給 RenameTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const command = new RenameTrackCommand(trackId, 'New Name');

      await trackMediator.renameTrack(command);

      expect(mockRenameHandler.handle).toHaveBeenCalledWith(command);
    });

    it('應該正確處理重命名操作', async () => {
      const trackId = TrackId.create();
      const command = new RenameTrackCommand(trackId, 'New Track Name');
      mockRenameHandler.handle.mockResolvedValue();

      await trackMediator.renameTrack(command);

      expect(mockRenameHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: trackId,
          newName: 'New Track Name'
        })
      );
    });
  });

  describe('addClipToTrack', () => {
    it('應該將命令委託給 AddClipToTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const clipId = ClipId.create();
      const command = new AddClipToTrackCommand(trackId, clipId);

      mockAddClipHandler.handle.mockResolvedValue();

      await trackMediator.addClipToTrack(command);

      expect(mockAddClipHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('removeClipFromTrack', () => {
    it('應該將命令委託給 RemoveClipFromTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const clipId = ClipId.create();
      const command = new RemoveClipFromTrackCommand(trackId, clipId);

      mockRemoveClipHandler.handle.mockResolvedValue();

      await trackMediator.removeClipFromTrack(command);

      expect(mockRemoveClipHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('changeTrackRouting', () => {
    it('應該將命令委託給 ChangeTrackRoutingCommandHandler', async () => {
      const trackId = TrackId.create();
      const routing = new TrackRouting(null, null);
      const command = new ChangeTrackRoutingCommand(trackId, routing);

      mockChangeRoutingHandler.handle.mockResolvedValue();

      await trackMediator.changeTrackRouting(command);

      expect(mockChangeRoutingHandler.handle).toHaveBeenCalledWith(command);
    });

    it('應該正確處理不同的路由設置', async () => {
      const trackId = TrackId.create();
      const routings = [
        new TrackRouting(null, null),
        new TrackRouting(null, TrackId.create()),
        new TrackRouting(null, TrackId.create())
      ];

      for (const routing of routings) {
        const command = new ChangeTrackRoutingCommand(trackId, routing);
        mockChangeRoutingHandler.handle.mockResolvedValue();

        await trackMediator.changeTrackRouting(command);

        expect(mockChangeRoutingHandler.handle).toHaveBeenCalledWith(
          expect.objectContaining({
            trackId: trackId,
            routing: routing
          })
        );
      }
    });
  });

  describe('addPluginToTrack', () => {
    it('應該將命令委託給 AddPluginToTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const pluginId = PluginInstanceId.create();
      const command = new AddPluginToTrackCommand(trackId, pluginId);

      mockAddPluginHandler.handle.mockResolvedValue();

      await trackMediator.addPluginToTrack(command);

      expect(mockAddPluginHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('removePluginFromTrack', () => {
    it('應該將命令委託給 RemovePluginFromTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const pluginId = PluginInstanceId.create();
      const command = new RemovePluginFromTrackCommand(trackId, pluginId);

      mockRemovePluginHandler.handle.mockResolvedValue();

      await trackMediator.removePluginFromTrack(command);

      expect(mockRemovePluginHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('錯誤處理', () => {
    it('應該正確傳播來自 handler 的錯誤', async () => {
      const trackId = TrackId.create();
      const command = new CreateTrackCommand('Test Track', TrackType.AUDIO);
      const error = new Error('Handler error');
      
      mockCreateHandler.handle.mockRejectedValue(error);

      await expect(trackMediator.createTrack(command)).rejects.toThrow(error);
    });
  });
}); 