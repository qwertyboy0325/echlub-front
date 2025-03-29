import { Container, injectable, inject } from "inversify";
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
    context: IAudioContext;
    eventBus: IEventBus;
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
class EventBus implements IEventBus {
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
class AudioEngine implements IAudioEngine {
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

describe("Inversify DI Example", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inSingletonScope();
        container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
        container.bind<IAudioEngine>(TYPES.AudioEngine).to(AudioEngine).inSingletonScope();
    });

    afterEach(() => {
        container.unbindAll();
    });

    test("should resolve dependencies correctly", () => {
        const engine = container.get<IAudioEngine>(TYPES.AudioEngine);
        expect(engine).toBeInstanceOf(AudioEngine);
        expect(engine.context).toBeInstanceOf(AudioContext);
        expect(engine.eventBus).toBeInstanceOf(EventBus);
    });

    test("should maintain singleton instances", () => {
        const engine1 = container.get<IAudioEngine>(TYPES.AudioEngine);
        const engine2 = container.get<IAudioEngine>(TYPES.AudioEngine);
        expect(engine1).toBe(engine2);
    });

    test("should handle lifecycle methods", () => {
        const initSpy = jest.spyOn(console, "log");
        container.get<IAudioEngine>(TYPES.AudioEngine);
        expect(initSpy).toHaveBeenCalledWith("AudioContext constructed");
        expect(initSpy).toHaveBeenCalledWith("AudioContext initialized");
        expect(initSpy).toHaveBeenCalledWith("EventBus constructed");
        expect(initSpy).toHaveBeenCalledWith("EventBus initialized");
        expect(initSpy).toHaveBeenCalledWith("AudioEngine constructed");
        expect(initSpy).toHaveBeenCalledWith("AudioEngine initialized");
    });
}); 