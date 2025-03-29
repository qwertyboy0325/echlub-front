import { Container, injectable, inject, injectable as Injectable, inject as Inject } from "inversify";
import "reflect-metadata";

// 定義介面
interface IAudioContext {
    onInit(): void;
    onDestroy(): void;
}

interface IEventBus {
    onInit(): void;
    onDestroy(): void;
}

interface IAudioEngine {
    onInit(): void;
    onDestroy(): void;
}

// 定義 Token
const TYPES = {
    AudioContext: Symbol.for("AudioContext"),
    EventBus: Symbol.for("EventBus"),
    AudioEngine: Symbol.for("AudioEngine")
};

// 實現類別
@injectable()
class AudioContext implements IAudioContext {
    constructor() {
        console.log("AudioContext constructed");
    }

    onInit(): void {
        console.log("AudioContext initialized");
    }

    onDestroy(): void {
        console.log("AudioContext destroyed");
    }
}

@injectable()
class EventBus implements IEventBus {
    constructor() {
        console.log("EventBus constructed");
    }

    onInit(): void {
        console.log("EventBus initialized");
    }

    onDestroy(): void {
        console.log("EventBus destroyed");
    }
}

@injectable()
class AudioEngine implements IAudioEngine {
    constructor(
        @inject(TYPES.AudioContext) private context: IAudioContext,
        @inject(TYPES.EventBus) private eventBus: IEventBus
    ) {
        console.log("AudioEngine constructed");
    }

    onInit(): void {
        console.log("AudioEngine initialized");
    }

    onDestroy(): void {
        console.log("AudioEngine destroyed");
    }
}

// 創建容器
const container = new Container();

// 註冊服務
container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inSingletonScope();
container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind<IAudioEngine>(TYPES.AudioEngine).to(AudioEngine).inSingletonScope();

// 使用容器
const engine = container.get<IAudioEngine>(TYPES.AudioEngine);
engine.onInit();

// 清理
container.unbindAll(); 