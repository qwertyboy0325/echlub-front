import { Container } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { AddInputTrackToBusCommandHandler } from '../AddInputTrackToBusCommandHandler';
import { AddInputTrackToBusCommand } from '../../commands/AddInputTrackToBusCommand';
import { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { BusTrack } from '../../../domain/entities/BusTrack';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { InputTrackAddedToBusEvent } from '../../../domain/events/InputTrackAddedToBusEvent';

describe('AddInputTrackToBusCommandHandler', () => {
  let container: Container;
  let handler: AddInputTrackToBusCommandHandler;
  let mockRepository: jest.Mocked<ITrackRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    container = new Container();

    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn()
    } as any;

    container.bind(TrackTypes.TrackRepository).toConstantValue(mockRepository);
    container.bind(TrackTypes.EventBus).toConstantValue(mockEventBus);
    container.bind(AddInputTrackToBusCommandHandler).toSelf();

    handler = container.get(AddInputTrackToBusCommandHandler);
  });

  it('應該將輸入軌道添加到總線軌道', async () => {
    const busTrackId = TrackId.create();
    const inputTrackId = TrackId.create();
    const busTrack = new BusTrack(busTrackId, 'Test Bus', new TrackRouting(null, null));
    const command = new AddInputTrackToBusCommand(busTrackId, inputTrackId);

    mockRepository.findById.mockResolvedValue(busTrack);
    mockRepository.save.mockResolvedValue();
    mockEventBus.publish.mockResolvedValue();

    await handler.handle(command);

    expect(mockRepository.findById).toHaveBeenCalledWith(busTrackId);
    expect(mockRepository.save).toHaveBeenCalledWith(busTrack);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(InputTrackAddedToBusEvent)
    );
    expect(busTrack.getInputTracks()).toContainEqual(inputTrackId);
  });

  it('當總線軌道不存在時應該拋出錯誤', async () => {
    const busTrackId = TrackId.create();
    const inputTrackId = TrackId.create();
    const command = new AddInputTrackToBusCommand(busTrackId, inputTrackId);

    mockRepository.findById.mockResolvedValue(undefined);

    await expect(handler.handle(command))
      .rejects
      .toThrow(`Bus track with id ${busTrackId} not found`);
  });

  it('當軌道不是總線軌道時應該拋出錯誤', async () => {
    const busTrackId = TrackId.create();
    const inputTrackId = TrackId.create();
    const command = new AddInputTrackToBusCommand(busTrackId, inputTrackId);

    // 模擬返回非總線軌道
    mockRepository.findById.mockResolvedValue({} as any);

    await expect(handler.handle(command))
      .rejects
      .toThrow('Track is not a bus track');
  });
}); 
