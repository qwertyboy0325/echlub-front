import { Container } from 'inversify';
import { TYPES } from '../../../core/di/types';
import type { IAudioEngine } from '../../../core/di/types';
import type { IEventBus } from '../../../core/di/types';
import type { IAudioContext } from '../../../core/di/types';
import { registerServices } from '../../../core/di/container';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    registerServices(container);
  });

  it('should register and resolve dependencies', () => {
    const audioEngine = container.get<IAudioEngine>(TYPES.AudioEngine);
    const eventBus = container.get<IEventBus>(TYPES.EventBus);
    const audioContext = container.get<IAudioContext>(TYPES.AudioContext);

    expect(audioEngine).toBeDefined();
    expect(eventBus).toBeDefined();
    expect(audioContext).toBeDefined();
  });
}); 