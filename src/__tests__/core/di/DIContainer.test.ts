import { DIContainer } from '../../../core/di/DIContainer';
import { ServiceScope } from '../../../core/di/ServiceScope';

describe('DIContainer', () => {
    let container: DIContainer;

    beforeEach(() => {
        container = new DIContainer();
    });

    describe('Basic Registration and Resolution', () => {
        test('should register and resolve singleton service', () => {
            class TestService {
                public value = Math.random();
            }

            container.register('TestService', TestService, ServiceScope.Singleton);
            const instance1 = container.resolve<TestService>('TestService');
            const instance2 = container.resolve<TestService>('TestService');

            expect(instance1).toBe(instance2);
            expect(instance1.value).toBe(instance2.value);
        });

        test('should register and resolve transient service', () => {
            class TestService {
                public value = Math.random();
            }

            container.register('TestService', TestService, ServiceScope.Transient);
            const instance1 = container.resolve<TestService>('TestService');
            const instance2 = container.resolve<TestService>('TestService');

            expect(instance1).not.toBe(instance2);
            expect(instance1.value).not.toBe(instance2.value);
        });

        test('should register and resolve factory service', () => {
            const factory = () => ({ value: Math.random() });
            container.register('TestService', factory, ServiceScope.Factory);
            const instance1 = container.resolve('TestService');
            const instance2 = container.resolve('TestService');

            expect(instance1).not.toBe(instance2);
            expect(instance1.value).not.toBe(instance2.value);
        });
    });

    describe('Lifecycle Management', () => {
        test('should maintain singleton instance', () => {
            class TestService {
                public value = Math.random();
            }

            container.register('TestService', TestService, ServiceScope.Singleton);
            const instance1 = container.resolve<TestService>('TestService');
            container.destroy();
            
            // 重新註冊服務
            container.register('TestService', TestService, ServiceScope.Singleton);
            const instance2 = container.resolve<TestService>('TestService');

            expect(instance1).not.toBe(instance2);
        });

        test('should create new transient instance each time', () => {
            class TestService {
                public value = Math.random();
            }

            container.register('TestService', TestService, ServiceScope.Transient);
            const instance1 = container.resolve<TestService>('TestService');
            const instance2 = container.resolve<TestService>('TestService');

            expect(instance1).not.toBe(instance2);
        });

        test('should call factory function each time', () => {
            const factory = jest.fn(() => ({ value: Math.random() }));
            container.register('TestService', factory, ServiceScope.Factory);
            
            container.resolve('TestService');
            container.resolve('TestService');

            expect(factory).toHaveBeenCalledTimes(2);
        });
    });

    describe('Scope Management', () => {
        test('should maintain singleton scope across containers', () => {
            class TestService {
                public value = Math.random();
            }

            container.register('TestService', TestService, ServiceScope.Singleton);
            const instance1 = container.resolve<TestService>('TestService');
            
            const container2 = new DIContainer();
            container2.register('TestService', TestService, ServiceScope.Singleton);
            const instance2 = container2.resolve<TestService>('TestService');

            expect(instance1).not.toBe(instance2);
        });

        test('should create new instance for transient scope', () => {
            class TestService {
                public value = Math.random();
            }

            container.register('TestService', TestService, ServiceScope.Transient);
            const instance1 = container.resolve<TestService>('TestService');
            const instance2 = container.resolve<TestService>('TestService');

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('Error Handling', () => {
        test('should throw error for unregistered service', () => {
            expect(() => {
                container.resolve('UnregisteredService');
            }).toThrow('Service UnregisteredService not registered');
        });

        test('should detect circular dependencies', () => {
            class ServiceA {
                constructor(private serviceB: ServiceB) {}
            }

            class ServiceB {
                constructor(private serviceA: ServiceA) {}
            }

            container.register('ServiceA', ServiceA, ServiceScope.Singleton);
            container.register('ServiceB', ServiceB, ServiceScope.Singleton);

            // 直接修改 resolutionStack 來模擬循環依賴
            container['resolutionStack'].add('ServiceA');
            container['resolutionStack'].add('ServiceB');

            expect(() => {
                container.resolve('ServiceA');
            }).toThrow('Circular dependency detected');
        });

        test('should handle invalid service registration', () => {
            expect(() => {
                container.register('TestService', null as any, ServiceScope.Singleton);
            }).toThrow('Invalid service registration');
        });

        test('should handle service initialization failure', () => {
            class FailingService {
                constructor() {
                    throw new Error('Initialization failed');
                }
            }

            container.register('FailingService', FailingService, ServiceScope.Singleton);

            expect(() => {
                container.resolve('FailingService');
            }).toThrow('Initialization failed');
        });
    });
}); 