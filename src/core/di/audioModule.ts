import { ContainerModule } from 'inversify';
import { TYPES } from './types';
import { AudioEngine } from '../audio/AudioEngine';
import { AudioRepository } from '../../domain/repositories/AudioRepository';

export const audioModule = new ContainerModule((bind) => {
  // 綁定音頻引擎
  bind<AudioEngine>(TYPES.AudioEngine)
    .to(AudioEngine)
    .inSingletonScope();

  // 綁定音頻上下文
  bind<AudioContext>(TYPES.AudioContext)
    .toDynamicValue(() => new AudioContext())
    .inSingletonScope();

  // 綁定音頻倉庫
  bind<AudioRepository>(TYPES.AudioRepository)
    .to(AudioRepository)
    .inSingletonScope();
}); 