import 'reflect-metadata';
import { Container } from 'inversify';
import { ClipModule } from '../../di/ClipModule';
import { ClipTypes } from '../../di/ClipTypes';
import { CreateAudioClipCommand } from '../../application/commands/ClipCommands';
import { CreateAudioClipCommandHandler } from '../../application/handlers/CreateAudioClipCommandHandler';
import { IClipRepository } from '../../domain/repositories/IClipRepository';
import { AudioClip } from '../../domain/entities/AudioClip';
import { IEventBus } from '../../../../core/event-bus/IEventBus';
import { AudioClipCreatedEvent } from '../../domain/events/ClipEvents';

describe('CreateAudioClipCommandHandler Integration', () => {
  let container: Container;
  let handler: CreateAudioClipCommandHandler;
  let repository: IClipRepository;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    container = new Container();
    
    // Mock event bus
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    
    // Configure container
    container.bind<IEventBus>(ClipTypes.EventBus).toConstantValue(eventBus);
    ClipModule.configure(container);
    
    // Get instances
    handler = container.get<CreateAudioClipCommandHandler>(ClipTypes.CreateAudioClipCommandHandler);
    repository = container.get<IClipRepository>(ClipTypes.ClipRepository);
  });

  it('should create audio clip and publish event', async () => {
    // Arrange
    const command = new CreateAudioClipCommand(
      'test-sample-1',
      0,
      10,
      2
    );

    // Act
    const clipId = await handler.handle(command);

    // Assert
    const clip = await repository.findById(clipId);
    expect(clip).toBeDefined();
    expect(clip).toBeInstanceOf(AudioClip);
    
    if (clip instanceof AudioClip) {
      expect(clip.getSampleId()).toBe(command.sampleId);
      expect(clip.getStartTime()).toBe(command.startTime);
      expect(clip.getDuration()).toBe(command.duration);
      expect(clip.getOffset()).toBe(command.offset);
    }

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(AudioClipCreatedEvent)
    );
    
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0] as AudioClipCreatedEvent;
    expect(publishedEvent.clipId).toBe(clipId);
    expect(publishedEvent.sampleId).toBe(command.sampleId);
    expect(publishedEvent.startTime).toBe(command.startTime);
    expect(publishedEvent.duration).toBe(command.duration);
  });

  it('should handle multiple clip creations', async () => {
    const commands = [
      new CreateAudioClipCommand('sample-1', 0, 10, 0),
      new CreateAudioClipCommand('sample-2', 10, 5, 1),
      new CreateAudioClipCommand('sample-3', 15, 8, 2)
    ];

    const clipIds = await Promise.all(
      commands.map(cmd => handler.handle(cmd))
    );

    const clips = await Promise.all(
      clipIds.map(id => repository.findById(id))
    );

    expect(clips).toHaveLength(3);
    clips.forEach((clip, index) => {
      expect(clip).toBeDefined();
      expect(clip).toBeInstanceOf(AudioClip);
      if (clip instanceof AudioClip) {
        expect(clip.getSampleId()).toBe(commands[index].sampleId);
      }
    });

 