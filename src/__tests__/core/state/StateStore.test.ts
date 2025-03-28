import { StateStore } from '../../../core/state/StateStore';

describe('StateStore', () => {
    let stateStore: StateStore;
    
    beforeEach(() => {
        stateStore = StateStore.getInstance();
        stateStore.clear();
    });
    
    test('should be singleton', () => {
        const instance1 = StateStore.getInstance();
        const instance2 = StateStore.getInstance();
        
        expect(instance1).toBe(instance2);
    });
    
    test('should set and get state', () => {
        const state = { test: 'data' };
        
        stateStore.setState('test', state);
        const retrievedState = stateStore.getState('test');
        
        expect(retrievedState).toEqual(state);
    });
    
    test('should update state', () => {
        const initialState = { test: 'data' };
        const updatedState = { test: 'updated data' };
        
        stateStore.setState('test', initialState);
        stateStore.setState('test', updatedState);
        
        const retrievedState = stateStore.getState('test');
        expect(retrievedState).toEqual(updatedState);
    });
    
    test('should handle non-existent state', () => {
        const retrievedState = stateStore.getState('test');
        expect(retrievedState).toBeUndefined();
    });
    
    test('should remove state', () => {
        const state = { test: 'data' };
        
        stateStore.setState('test', state);
        stateStore.removeState('test');
        
        const retrievedState = stateStore.getState('test');
        expect(retrievedState).toBeUndefined();
    });
    
    test('should clear all state', () => {
        const state1 = { test1: 'data1' };
        const state2 = { test2: 'data2' };
        
        stateStore.setState('test1', state1);
        stateStore.setState('test2', state2);
        stateStore.clear();
        
        const retrievedState1 = stateStore.getState('test1');
        const retrievedState2 = stateStore.getState('test2');
        
        expect(retrievedState1).toBeUndefined();
        expect(retrievedState2).toBeUndefined();
    });
}); 