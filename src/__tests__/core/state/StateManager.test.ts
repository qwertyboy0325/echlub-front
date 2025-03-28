/// <reference types="jest" />
import { jest, expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { StateManager } from '../../../core/state/StateManager';
import { StateSlice } from '../../../core/state/StateSlice';
import { ErrorHandler } from '../../../core/error/ErrorHandler';

// Define test state types
interface TestState {
    value: string;
    count: number;
}

describe('StateManager', () => {
    let stateManager: StateManager;
    let errorHandler: ErrorHandler;
    let errorListener: jest.Mock;
    
    beforeEach(() => {
        stateManager = StateManager.getInstance();
        stateManager.destroy(); // Clear slices before each test
        errorHandler = ErrorHandler.getInstance();
        errorListener = jest.fn();
        errorHandler.addListener(errorListener);
    });
    
    afterEach(() => {
        errorHandler.removeListener(errorListener);
    });
    
    describe('Singleton Pattern', () => {
        test('should maintain single instance', () => {
            const instance1 = StateManager.getInstance();
            const instance2 = StateManager.getInstance();
            
            expect(instance1).toBe(instance2);
        });
    });
    
    describe('State Slice Management', () => {
        test('should register and retrieve state slice', () => {
            const initialState: TestState = { value: 'test', count: 0 };
            const stateSlice = new StateSlice<TestState>('test', initialState);
            
            stateManager.registerSlice('test', stateSlice);
            const retrievedSlice = stateManager.getSlice<TestState>('test');
            
            expect(retrievedSlice).toBeDefined();
            expect(retrievedSlice?.getState()).toEqual(initialState);
        });
        
        test('should handle non-existent slice', () => {
            const slice = stateManager.getSlice<TestState>('non-existent');
            
            expect(slice).toBeUndefined();
        });
        
        test('should unregister slice', () => {
            const initialState: TestState = { value: 'test', count: 0 };
            const stateSlice = new StateSlice<TestState>('test', initialState);
            
            stateManager.registerSlice('test', stateSlice);
            stateManager.unregisterSlice('test');
            
            const retrievedSlice = stateManager.getSlice<TestState>('test');
            
            expect(retrievedSlice).toBeUndefined();
        });
    });
    
    describe('State Updates', () => {
        test('should notify subscribers of state changes', () => {
            const initialState: TestState = { value: 'test', count: 0 };
            const stateSlice = new StateSlice<TestState>('test', initialState);
            const subscriber = jest.fn();
            
            stateManager.registerSlice('test', stateSlice);
            stateSlice.subscribe(subscriber);
            
            stateSlice.setState({ value: 'updated', count: 1 });
            
            expect(subscriber).toHaveBeenCalledWith({ value: 'updated', count: 1 });
        });
        
        test('should handle multiple subscribers', () => {
            const initialState: TestState = { value: 'test', count: 0 };
            const stateSlice = new StateSlice<TestState>('test', initialState);
            const subscriber1 = jest.fn();
            const subscriber2 = jest.fn();
            
            stateManager.registerSlice('test', stateSlice);
            stateSlice.subscribe(subscriber1);
            stateSlice.subscribe(subscriber2);
            
            stateSlice.setState({ value: 'updated', count: 1 });
            
            expect(subscriber1).toHaveBeenCalledWith({ value: 'updated', count: 1 });
            expect(subscriber2).toHaveBeenCalledWith({ value: 'updated', count: 1 });
        });
        
        test('should handle subscriber errors gracefully', () => {
            const initialState: TestState = { value: 'test', count: 0 };
            const stateSlice = new StateSlice<TestState>('test', initialState);
            const subscriber = jest.fn().mockImplementation(() => {
                throw new Error('Subscriber error');
            });
            
            stateManager.registerSlice('test', stateSlice);
            stateSlice.subscribe(subscriber);
            
            stateSlice.setState({ value: 'updated', count: 1 });
            
            expect(errorListener).toHaveBeenCalledWith(expect.any(Error));
            expect((errorListener.mock.calls[0][0] as Error).message).toBe('Subscriber error');
        });
    });
    
    describe('State Persistence', () => {
        test('should maintain state across updates', () => {
            const initialState: TestState = { value: 'test', count: 0 };
            const stateSlice = new StateSlice<TestState>('test', initialState);
            
            stateManager.registerSlice('test', stateSlice);
            
            stateSlice.setState({ value: 'first', count: 1 });
            stateSlice.setState({ value: 'second', count: 2 });
            
            const finalState = stateSlice.getState();
            
            expect(finalState).toEqual({ value: 'second', count: 2 });
        });
        
        test('should handle complex state updates', () => {
            interface ComplexState {
                user: {
                    id: number;
                    name: string;
                };
                settings: {
                    theme: string;
                    notifications: boolean;
                };
            }
            
            const initialState: ComplexState = {
                user: { id: 1, name: 'Test User' },
                settings: { theme: 'light', notifications: true }
            };
            
            const stateSlice = new StateSlice<ComplexState>('complex', initialState);
            stateManager.registerSlice('complex', stateSlice);
            
            stateSlice.setState({
                user: { id: 1, name: 'Updated User' },
                settings: { theme: 'dark', notifications: false }
            });
            
            const updatedState = stateSlice.getState();
            
            expect(updatedState.user.name).toBe('Updated User');
            expect(updatedState.settings.theme).toBe('dark');
            expect(updatedState.settings.notifications).toBe(false);
        });
    });
    
    describe('Cleanup', () => {
        test('should destroy all slices on cleanup', () => {
            const slice1 = new StateSlice<TestState>('test1', { value: 'test1', count: 0 });
            const slice2 = new StateSlice<TestState>('test2', { value: 'test2', count: 0 });
            
            stateManager.registerSlice('test1', slice1);
            stateManager.registerSlice('test2', slice2);
            
            stateManager.destroy();
            
            expect(stateManager.getSlice('test1')).toBeUndefined();
            expect(stateManager.getSlice('test2')).toBeUndefined();
        });
    });
}); 