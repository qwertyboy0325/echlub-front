import { container } from "./types";
import { TYPES } from "./types";
import { injectable, inject } from "inversify";
import type { IAudioContext, IEventBus, IAudioEngine } from "./types";

// 實現類別
@injectable()
export class AudioContext implements IAudioContext {
    constructor() {
        console.log("AudioContext constructed");
        this.onInit();
    }

    onInit(): void {
        console.log("AudioContext initialized");
    }

    onDestroy(): void {
        console.log("AudioContext destroyed");
    }
}

@injectable()
export class EventBus implements IEventBus {
    constructor() {
        console.log("EventBus constructed");
        this.onInit();
    }

    onInit(): void {
        console.log("EventBus initialized");
    }

    onDestroy(): void {
        console.log("EventBus destroyed");
    }
}

@injectable()
export class AudioEngine implements IAudioEngine {
    constructor(
        @inject(TYPES.AudioContext) public context: IAudioContext,
        @inject(TYPES.EventBus) public eventBus: IEventBus
    ) {
        console.log("AudioEngine constructed");
        this.onInit();
    }

    onInit(): void {
        console.log("AudioEngine initialized");
    }

    onDestroy(): void {
        console.log("AudioEngine destroyed");
    }
}

// 導出註冊函數
export function registerServices(): void {
    container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inSingletonScope();
    container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
    container.bind<IAudioEngine>(TYPES.AudioEngine).to(AudioEngine).inSingletonScope();
} 