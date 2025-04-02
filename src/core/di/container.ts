/**
 * 依賴注入容器配置
 */

import { Container } from 'inversify';
import { TYPES } from './types';
import { EventBus, StateManager, AudioEngine, TrackRepository, ClipRepository, StateStore, StateSelector, BaseService } from './types';
import {
    EventBusImpl,
    UIEventBusImpl,
    DomainEventBusImpl,
    StateManagerImpl,
    StateStoreImpl,
    StateSelectorImpl,
    AudioEngineImpl,
    TrackRepositoryImpl,
    ClipRepositoryImpl
} from './implementations';
import { EventTranslator } from './implementations/EventTranslator';

// 創建依賴注入容器
const container = new Container();

// 註冊服務
export function registerServices(): void {
    // 註冊事件總線
    container.bind<EventBus>(TYPES.EventBus).to(EventBusImpl).inSingletonScope();
    container.bind<EventBus>(TYPES.UIEventBus).to(EventBusImpl).inSingletonScope();
    container.bind<EventBus>(TYPES.DomainEventBus).to(EventBusImpl).inSingletonScope();
    
    // 註冊事件轉換器
    container.bind<EventTranslator>(TYPES.EventTranslator).to(EventTranslator).inSingletonScope();

    // 註冊狀態管理
    container.bind<StateManager>(TYPES.StateManager).to(StateManagerImpl).inSingletonScope();
    container.bind<StateStore>(TYPES.StateStore).to(StateStoreImpl).inSingletonScope();
    container.bind<StateSelector>(TYPES.StateSelector).to(StateSelectorImpl).inSingletonScope();

    // 註冊音頻引擎
    container.bind<AudioEngine>(TYPES.AudioEngine).to(AudioEngineImpl).inSingletonScope();

    // 註冊倉儲
    container.bind<TrackRepository>(TYPES.TrackRepository).to(TrackRepositoryImpl).inSingletonScope();
    container.bind<ClipRepository>(TYPES.ClipRepository).to(ClipRepositoryImpl).inSingletonScope();
}

// 獲取服務實例
export function getService<T>(type: symbol): T {
    return container.get<T>(type);
}

// 初始化所有服務
export async function initializeServices(): Promise<void> {
    const services = container.getAll<BaseService>(TYPES.BaseService);
    for (const service of services) {
        await service.initialize();
    }
}

// 銷毀所有服務
export async function destroyServices(): Promise<void> {
    const services = container.getAll<BaseService>(TYPES.BaseService);
    for (const service of services) {
        await service.destroy();
    }
}

export { container }; 