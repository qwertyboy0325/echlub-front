import { Container } from 'inversify';
import { eventModule } from './eventModule';
import { audioModule } from './audioModule';
import { storageModule } from './storageModule';
import { dawModule } from './dawModule';
import { TYPES } from './types';
import 'reflect-metadata';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import type { AudioRepository } from '../../domain/repositories/AudioRepository';
import type { Storage } from '../../infrastructure/storage/Storage';
import type { IAudioContext } from './types';
import type { IAudioEngine } from './types';
import type { IEventBus } from './types';
import { LocalStorageService } from '../storage/LocalStorageService';
import { AudioContextWrapper } from '../audio/AudioContextWrapper';
import { AudioEngine } from '../audio/AudioEngine';
import { EventBus } from '../events/EventBus';
import { DAWManager } from '../DAWManager';
import { RenderEngine } from '../../presentation/graphics/RenderEngine';
import { DragSystem } from '../../presentation/graphics/DragSystem';
import { DAWScene } from '../../presentation/graphics/DAWScene';
import { EventMonitor } from '../events/EventMonitor';
import { TrackPresenter } from '../../presentation/presenters/TrackPresenter';
import { DAWRenderer } from '../../presentation/graphics/DAWRenderer';
import { UIEventBus } from '../events/UIEventBus';

// 創建 DI 容器
const container = new Container({
  defaultScope: 'Singleton',
  autoBindInjectable: true
});

// 註冊所有服務
registerServices(container);

// 加載所有模塊
container.load(
  eventModule,   // 事件系統模塊
  dawModule,     // DAW 相關模塊
  audioModule,   // 音頻處理模塊
  storageModule  // 存儲模塊
);

export { container, TYPES };

export function registerServices(container: Container): void {
  // Register Event Buses
  container.bind<IEventBus>(TYPES.EventBus)
    .to(EventBus)
    .inSingletonScope();

  container.bind<UIEventBus>(TYPES.UIEventBus)
    .to(UIEventBus)
    .inSingletonScope();

  // Register Storage
  container.bind<Storage>(TYPES.Storage)
    .to(LocalStorageService)
    .inSingletonScope();

  // Register Core Services
  container.bind<DAWManager>(TYPES.DAWManager)
    .to(DAWManager)
    .inSingletonScope();

  // Register Audio Services
  container.bind<IAudioContext>(TYPES.AudioContext)
    .to(AudioContextWrapper)
    .inSingletonScope();

  container.bind<IAudioEngine>(TYPES.AudioEngine)
    .to(AudioEngine)
    .inSingletonScope();

  // Register Graphics Services
  container.bind<RenderEngine>(TYPES.RenderEngine)
    .to(RenderEngine)
    .inSingletonScope();

  container.bind<DragSystem>(TYPES.DragSystem)
    .to(DragSystem)
    .inSingletonScope();

  container.bind<DAWScene>(TYPES.DAWScene)
    .to(DAWScene)
    .inSingletonScope();

  // Register Event Monitor
  container.bind<EventMonitor>(TYPES.EventMonitor).to(EventMonitor).inSingletonScope();

  // Register Track Presenter
  container.bind<TrackPresenter>(TYPES.TrackPresenter)
    .to(TrackPresenter)
    .inSingletonScope();

  // Register DAWRenderer
  container.bind<(canvas: HTMLCanvasElement, config?: Partial<DAWRendererConfig>) => DAWRenderer>(TYPES.DAWRenderer)
    .toFactory((context) => {
      return (canvas: HTMLCanvasElement, config?: Partial<DAWRendererConfig>) => {
        if (!canvas) {
          throw new Error('[DAWRenderer Factory] Canvas element is required');
        }

        try {
          const uiEventBus = context.container.get<UIEventBus>(TYPES.UIEventBus);
          if (!uiEventBus) {
            throw new Error('[DAWRenderer Factory] UIEventBus not found in container');
          }

          // 默認配置
          const defaultConfig: DAWRendererConfig = {
            width: canvas.clientWidth || window.innerWidth,
            height: canvas.clientHeight || window.innerHeight,
            backgroundColor: 0x1a1a1a,
            bpm: 120
          };

          // 合併配置
          const finalConfig = {
            ...defaultConfig,
            ...config
          };

          console.log('[DAWRenderer Factory] Creating renderer with config:', finalConfig);
          
          return new DAWRenderer(uiEventBus, canvas, finalConfig);
        } catch (error) {
          console.error('[DAWRenderer Factory] Failed to create renderer:', error);
          throw error;
        }
      };
    });
}

// 定義 DAWRenderer 配置接口
export interface DAWRendererConfig {
  width: number;
  height: number;
  backgroundColor?: number;
  bpm: number;
} 