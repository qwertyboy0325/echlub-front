import { Container } from 'inversify';
import { TrackMediator } from '../TrackMediator';
import { TrackTypes } from '../../../di/TrackTypes';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { AudioClipId } from '../../../domain/value-objects/AudioClipId';
import { CreateTrackCommand } from '../../commands/CreateTrackCommand';
import { RenameTrackCommand } from '../../commands/RenameTrackCommand';
import { AddClipToTrackCommand } from '../../commands/AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../../commands/RemoveClipFromTrackCommand';
import { ChangeTrackRoutingCommand } from '../../commands/ChangeTrackRoutingCommand';
import { AddPluginToTrackCommand } from '../../commands/AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../../commands/RemovePluginFromTrackCommand';
import { AddInputTrackToBusCommand } from '../../commands/AddInputTrackToBusCommand';
import { RemoveInputTrackFromBusCommand } from '../../commands/RemoveInputTrackFromBusCommand';
import { CreateTrackCommandHandler } from '../../handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../../handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../../handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../../handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../../handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../../handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../../handlers/RemovePluginFromTrackCommandHandler';
import { AddInputTrackToBusCommandHandler } from '../../handlers/AddInputTrackToBusCommandHandler';
import { RemoveInputTrackFromBusCommandHandler } from '../../handlers/RemoveInputTrackFromBusCommandHandler';

describe('TrackMediator', () => {
  let container: Container;
  let mediator: TrackMediator;
  let createTrackHandler: jest.Mocked<CreateTrackCommandHandler>;
  let renameTrackHandler: jest.Mocked<RenameTrackCommandHandler>;
  let addClipHandler: jest.Mocked<AddClipToTrackCommandHandler>;
  let removeClipHandler: jest.Mocked<RemoveClipFromTrackCommandHandler>;
  let changeRoutingHandler: jest.Mocked<ChangeTrackRoutingCommandHandler>;
  let addPluginHandler: jest.Mocked<AddPluginToTrackCommandHandler>;
  let removePluginHandler: jest.Mocked<RemovePluginFromTrackCommandHandler>;
  let addInputTrackHandler: jest.Mocked<AddInputTrackToBusCommandHandler>;
  let removeInputTrackHandler: jest.Mocked<RemoveInputTrackFromBusCommandHandler>;

  beforeEach(() => {
    container = new Container();

    // 創建所有處理器的模擬對象
    createTrackHandler = { handle: jest.fn() } as any;
    renameTrackHandler = { handle: jest.fn() } as any;
    addClipHandler = { handle: jest.fn() } as any;
    removeClipHandler = { handle: jest.fn() } as any;
    changeRoutingHandler = { handle: jest.fn() } as any;
    addPluginHandler = { handle: jest.fn() } as any;
    removePluginHandler = { handle: jest.fn() } as any;
    addInputTrackHandler = { handle: jest.fn() } as any;
    removeInputTrackHandler = { handle: jest.fn() } as any;

    // 註冊所有模擬處理器
    container.bind(TrackTypes.CreateTrackCommandHandler).toConstantValue(createTrackHandler);
    container.bind(TrackTypes.RenameTrackCommandHandler).toConstantValue(renameTrackHandler);
    container.bind(TrackTypes.AddClipToTrackCommandHandler).toConstantValue(addClipHandler);
    container.bind(TrackTypes.RemoveClipFromTrackCommandHandler).toConstantValue(removeClipHandler);
    container.bind(TrackTypes.ChangeTrackRoutingCommandHandler).toConstantValue(changeRoutingHandler);
    container.bind(TrackTypes.AddPluginToTrackCommandHandler).toConstantValue(addPluginHandler);
    container.bind(TrackTypes.RemovePluginFromTrackCommandHandler).toConstantValue(removePluginHandler);
    container.bind(TrackTypes.AddInputTrackToBusCommandHandler).toConstantValue(addInputTrackHandler);
    container.bind(TrackTypes.RemoveInputTrackFromBusCommandHandler).toConstantValue(removeInputTrackHandler);

    // 創建 TrackMediator 實例
    container.bind(TrackMediator).toSelf();
    mediator = container.get(TrackMediator);
  });

  describe('createTrack', () => {
    it('應該將命令委託給 CreateTrackCommandHandler', async () => {
      const trackId = TrackId.create();
      const command = new CreateTrackCommand('Test Track', TrackType.AUDIO);
      createTrackHandler.handle.mockResolvedValue(trackId);

      const result = await mediator.createTrack(command);

      expect(createTrackHandler.handle).toHaveBeenCalledWith(command);
      expect(result).toBe(trackId);
    });
  });

  describe('renameTrack', () => {
    it('應該將命令委託給 RenameTrackCommandHandler', async () => {
      const command = new RenameTrackCommand(TrackId.create(), 'New Name');
      await mediator.renameTrack(command);

      expect(renameTrackHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('addClipToTrack', () => {
    it('應該將命令委託給 AddClipToTrackCommandHandler', async () => {
      const command = new AddClipToTrackCommand(
        TrackId.create(),
        AudioClipId.fromString('clip-1')
      );
      await mediator.addClipToTrack(command);

      expect(addClipHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('removeClipFromTrack', () => {
    it('應該將命令委託給 RemoveClipFromTrackCommandHandler', async () => {
      const command = new RemoveClipFromTrackCommand(
        TrackId.create(),
        AudioClipId.fromString('clip-1')
      );
      await mediator.removeClipFromTrack(command);

      expect(removeClipHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('changeTrackRouting', () => {
    it('應該將命令委託給 ChangeTrackRoutingCommandHandler', async () => {
      const command = new ChangeTrackRoutingCommand(
        TrackId.create(),
        new TrackRouting('input-1', 'output-1')
      );
      await mediator.changeTrackRouting(command);

      expect(changeRoutingHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('addPluginToTrack', () => {
    it('應該將命令委託給 AddPluginToTrackCommandHandler', async () => {
      const command = new AddPluginToTrackCommand(TrackId.create(), {
        id: 'plugin-1',
        equals: jest.fn(),
        toString: () => 'plugin-1'
      });
      await mediator.addPluginToTrack(command);

      expect(addPluginHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('removePluginFromTrack', () => {
    it('應該將命令委託給 RemovePluginFromTrackCommandHandler', async () => {
      const command = new RemovePluginFromTrackCommand(TrackId.create(), {
        id: 'plugin-1',
        equals: jest.fn(),
        toString: () => 'plugin-1'
      });
      await mediator.removePluginFromTrack(command);

      expect(removePluginHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('addInputTrackToBus', () => {
    it('應該將命令委託給 AddInputTrackToBusCommandHandler', async () => {
      const command = new AddInputTrackToBusCommand(
        TrackId.create(),
        TrackId.create()
      );
      await mediator.addInputTrackToBus(command);

      expect(addInputTrackHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('removeInputTrackFromBus', () => {
    it('應該將命令委託給 RemoveInputTrackFromBusCommandHandler', async () => {
      const command = new RemoveInputTrackFromBusCommand(
        TrackId.create(),
        TrackId.create()
      );
      await mediator.removeInputTrackFromBus(command);

      expect(removeInputTrackHandler.handle).toHaveBeenCalledWith(command);
    });
  });
}); 
