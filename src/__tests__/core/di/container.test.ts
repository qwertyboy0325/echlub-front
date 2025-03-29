import { container } from "../../../core/di/types";
import { TYPES } from "../../../core/di/types";
import type { IAudioContext, IEventBus, IAudioEngine } from "../../../core/di/types";
import { registerServices } from "../../../core/di/container";

describe("DI Container", () => {
    let initSpy: jest.SpyInstance;
    let destroySpy: jest.SpyInstance;

    beforeEach(() => {
        initSpy = jest.spyOn(console, "log");
        // 註冊服務
        registerServices();
    });

    afterEach(() => {
        initSpy.mockRestore();
        container.unbindAll();
    });

    describe("Service Resolution", () => {
        test("should resolve dependencies correctly", () => {
            const engine = container.get<IAudioEngine>(TYPES.AudioEngine);
            expect(engine).toBeDefined();
            expect(engine.context).toBeDefined();
            expect(engine.eventBus).toBeDefined();
        });

        test("should maintain singleton instances", () => {
            const engine1 = container.get<IAudioEngine>(TYPES.AudioEngine);
            const engine2 = container.get<IAudioEngine>(TYPES.AudioEngine);
            expect(engine1).toBe(engine2);
        });
    });

    describe("Lifecycle Management", () => {
        test("should initialize services in correct order", () => {
            container.get<IAudioEngine>(TYPES.AudioEngine);

            expect(initSpy).toHaveBeenCalledWith("AudioContext constructed");
            expect(initSpy).toHaveBeenCalledWith("AudioContext initialized");
            expect(initSpy).toHaveBeenCalledWith("EventBus constructed");
            expect(initSpy).toHaveBeenCalledWith("EventBus initialized");
            expect(initSpy).toHaveBeenCalledWith("AudioEngine constructed");
            expect(initSpy).toHaveBeenCalledWith("AudioEngine initialized");
        });

        test("should not reinitialize singleton services", () => {
            const engine1 = container.get<IAudioEngine>(TYPES.AudioEngine);
            const engine2 = container.get<IAudioEngine>(TYPES.AudioEngine);

            const initCalls = initSpy.mock.calls.filter(call => 
                call[0].includes("initialized")
            ).length;

            expect(initCalls).toBe(3); // AudioContext, EventBus, AudioEngine
        });
    });

    describe("Dependency Injection", () => {
        test("should inject correct dependencies", () => {
            const engine = container.get<IAudioEngine>(TYPES.AudioEngine);
            expect(engine.context).toBeDefined();
            expect(engine.eventBus).toBeDefined();
        });

        test("should maintain dependency references", () => {
            const engine1 = container.get<IAudioEngine>(TYPES.AudioEngine);
            const engine2 = container.get<IAudioEngine>(TYPES.AudioEngine);

            expect(engine1.context).toBe(engine2.context);
            expect(engine1.eventBus).toBe(engine2.eventBus);
        });
    });

    describe("Error Handling", () => {
        test("should throw error for unregistered service", () => {
            expect(() => {
                container.get("UnregisteredService");
            }).toThrow();
        });
    });
}); 