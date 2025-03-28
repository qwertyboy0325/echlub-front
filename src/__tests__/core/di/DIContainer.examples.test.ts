import 'reflect-metadata';
import { DIContainer } from '../../../core/di/DIContainer';
import { Injectable, Inject } from '../../../core/di/decorators';
import { BaseComponent, LifecycleHooks } from '../../../core/di/lifecycle';
import { ServiceScope } from '../../../core/di/ServiceScope';

describe('DIContainer Examples', () => {
    let container: DIContainer;

    beforeEach(() => {
        container = new DIContainer();
    });

    describe('Basic Service Registration', () => {
        test('should register and resolve basic services', () => {
            class AudioEngine {
                constructor(
                    private context: AudioContext,
                    private eventBus: EventBus
                ) {}
            }

            class EventBus {}
            class AudioContext {}

            // 註冊基礎服務
            container.register('AudioEngine', AudioEngine, ServiceScope.Transient);
            container.register('EventBus', EventBus, ServiceScope.Transient);
            container.register('AudioContext', AudioContext, ServiceScope.Transient);

            const engine = container.resolve<AudioEngine>('AudioEngine');
            expect(engine).toBeInstanceOf(AudioEngine);
        });

        test('should register and resolve singleton services', () => {
            class AudioContext {
                public value = Math.random();
            }

            container.registerSingleton('AudioContext', AudioContext);
            const instance1 = container.resolve<AudioContext>('AudioContext');
            const instance2 = container.resolve<AudioContext>('AudioContext');

            expect(instance1).toBe(instance2);
            expect(instance1.value).toBe(instance2.value);
        });

        test('should register and resolve factory services', () => {
            class AudioBuffer {
                constructor(public context: AudioContext) {}
            }

            class AudioContext {}

            container.register('AudioContext', AudioContext, ServiceScope.Singleton);

            container.registerFactory('AudioBuffer', (container) => {
                return new AudioBuffer(container.resolve('AudioContext'));
            });

            const buffer1 = container.resolve<AudioBuffer>('AudioBuffer');
            const buffer2 = container.resolve<AudioBuffer>('AudioBuffer');

            expect(buffer1).not.toBe(buffer2);
            expect(buffer1.context).toBe(buffer2.context);
        });
    });

    describe('Decorator-based Registration', () => {
        test('should use decorators for service registration', () => {
            class AudioEngine {
                constructor(
                    private context: AudioContext,
                    private eventBus: EventBus
                ) {}
            }

            class EventBus {}
            class AudioContext {}

            container.registerSingleton('AudioEngine', AudioEngine);
            container.registerSingleton('EventBus', EventBus);
            container.registerSingleton('AudioContext', AudioContext);

            const engine = container.resolve<AudioEngine>('AudioEngine');
            expect(engine).toBeInstanceOf(AudioEngine);
        });
    });

    describe('Lifecycle Management', () => {
        test('should handle component lifecycle', () => {
            const initSpy = jest.fn();
            const destroySpy = jest.fn();

            class AudioEngine extends BaseComponent {
                constructor(
                    private context: AudioContext,
                    private eventBus: EventBus
                ) {
                    super();
                }

                onInit(): void {
                    initSpy();
                }

                onDestroy(): void {
                    destroySpy();
                }
            }

            class EventBus extends BaseComponent {
                onInit(): void {
                    initSpy();
                }
            }

            class AudioContext extends BaseComponent {
                onInit(): void {
                    initSpy();
                }
            }

            container.registerSingleton('AudioEngine', AudioEngine);
            container.registerSingleton('EventBus', EventBus);
            container.registerSingleton('AudioContext', AudioContext);

            const engine = container.resolve<AudioEngine>('AudioEngine');
            expect(initSpy).toHaveBeenCalledTimes(3);

            container.destroy();
            expect(destroySpy).toHaveBeenCalled();
        });
    });

    describe('Complete Example', () => {
        test('should demonstrate complete DI usage', () => {
            const lifecycleSpy = jest.fn();

            class AudioEngine extends BaseComponent {
                constructor(
                    private context: AudioContext,
                    private eventBus: EventBus
                ) {
                    super();
                }

                onInit(): void {
                    lifecycleSpy('AudioEngine initialized');
                }

                onDestroy(): void {
                    lifecycleSpy('AudioEngine destroyed');
                }
            }

            class EventBus extends BaseComponent {
                onInit(): void {
                    lifecycleSpy('EventBus initialized');
                }
            }

            class AudioContext extends BaseComponent {
                onInit(): void {
                    lifecycleSpy('AudioContext initialized');
                }
            }

            // 註冊服務
            container.registerSingleton('AudioEngine', AudioEngine);
            container.registerSingleton('EventBus', EventBus);
            container.registerSingleton('AudioContext', AudioContext);

            // 解析服務
            const engine = container.resolve<AudioEngine>('AudioEngine');
            expect(engine).toBeInstanceOf(AudioEngine);

            // 驗證生命週期
            expect(lifecycleSpy).toHaveBeenCalledTimes(3);
            expect(lifecycleSpy).toHaveBeenCalledWith('AudioContext initialized');
            expect(lifecycleSpy).toHaveBeenCalledWith('EventBus initialized');
            expect(lifecycleSpy).toHaveBeenCalledWith('AudioEngine initialized');

            // 清理
            container.destroy();
            expect(lifecycleSpy).toHaveBeenCalledWith('AudioEngine destroyed');
        });
    });
}); 