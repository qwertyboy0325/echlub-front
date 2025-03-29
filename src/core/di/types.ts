import { Container } from "inversify";

// 定義 Token
export const TYPES = {
    AudioContext: Symbol.for("AudioContext"),
    EventBus: Symbol.for("EventBus"),
    AudioEngine: Symbol.for("AudioEngine")
};

// 定義介面
export interface IAudioContext {
    onInit(): void;
    onDestroy(): void;
}

export interface IEventBus {
    onInit(): void;
    onDestroy(): void;
}

export interface IAudioEngine {
    onInit(): void;
    onDestroy(): void;
    context: IAudioContext;
    eventBus: IEventBus;
}

// 導出容器實例
export const container = new Container(); 