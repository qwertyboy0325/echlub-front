import { StateSlice } from '../../../core/state/StateSlice';
import { ErrorHandler } from '../../../core/error/ErrorHandler';

interface TestState {
    value: string;
    count: number;
}

describe('StateSlice', () => {
    let stateSlice: StateSlice<TestState>;
    let errorHandler: ErrorHandler;
    let errorListener: jest.Mock;
    
    beforeEach(() => {
        stateSlice = new StateSlice<TestState>('test', {
            value: 'initial',
            count: 0
        });
        errorHandler = ErrorHandler.getInstance();
        errorListener = jest.fn();
        errorHandler.addListener(errorListener);
    });
    
    afterEach(() => {
        errorHandler.removeListener(errorListener);
    });
    
    test('should initialize with initial state', () => {
        expect(stateSlice.getState()).toEqual({
            value: 'initial',
            count: 0
        });
    });
    
    test('should update state', () => {
        stateSlice.setState({
            value: 'updated',
            count: 1
        });
        
        expect(stateSlice.getState()).toEqual({
            value: 'updated',
            count: 1
        });
    });
    
    test('should update partial state', () => {
        stateSlice.setPartialState('value', 'updated');
        
        expect(stateSlice.getState()).toEqual({
            value: 'updated',
            count: 0
        });
    });
    
    test('should subscribe to state changes', () => {
        const subscriber = jest.fn();
        const unsubscribe = stateSlice.subscribe(subscriber);
        
        stateSlice.setPartialState('value', 'updated');
        
        expect(subscriber).toHaveBeenCalledWith({
            value: 'updated',
            count: 0
        });
        
        unsubscribe();
    });
    
    test('should handle multiple subscribers', () => {
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        
        stateSlice.subscribe(subscriber1);
        stateSlice.subscribe(subscriber2);
        
        stateSlice.setPartialState('value', 'updated');
        
        expect(subscriber1).toHaveBeenCalledWith({
            value: 'updated',
            count: 0
        });
        expect(subscriber2).toHaveBeenCalledWith({
            value: 'updated',
            count: 0
        });
    });
    
    test('should unsubscribe from state changes', () => {
        const subscriber = jest.fn();
        const unsubscribe = stateSlice.subscribe(subscriber);
        
        stateSlice.setPartialState('value', 'updated');
        unsubscribe();
        stateSlice.setPartialState('value', 'final');
        
        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenCalledWith({
            value: 'updated',
            count: 0
        });
    });
    
    test('should handle subscriber errors gracefully', () => {
        const subscriber = jest.fn().mockImplementation(() => {
            throw new Error('Subscriber error');
        });
        
        stateSlice.subscribe(subscriber);
        stateSlice.setPartialState('value', 'updated');
        
        expect(errorListener).toHaveBeenCalledWith(expect.any(Error));
        expect(errorListener.mock.calls[0][0].message).toBe('Subscriber error');
    });
    
    test('should handle multiple state updates', () => {
        const subscriber = jest.fn();
        stateSlice.subscribe(subscriber);
        
        stateSlice.setPartialState('value', 'first');
        stateSlice.setPartialState('count', 1);
        stateSlice.setPartialState('value', 'second');
        
        expect(subscriber).toHaveBeenCalledTimes(3);
        expect(subscriber.mock.calls[0][0]).toEqual({
            value: 'first',
            count: 0
        });
        expect(subscriber.mock.calls[1][0]).toEqual({
            value: 'first',
            count: 1
        });
        expect(subscriber.mock.calls[2][0]).toEqual({
            value: 'second',
            count: 1
        });
    });
}); 