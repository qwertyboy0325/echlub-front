import { ErrorHandler } from '../../../core/error/ErrorHandler';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;
    
    beforeEach(() => {
        errorHandler = ErrorHandler.getInstance();
    });
    
    test('should be singleton', () => {
        const instance1 = ErrorHandler.getInstance();
        const instance2 = ErrorHandler.getInstance();
        
        expect(instance1).toBe(instance2);
    });
    
    test('should handle errors', () => {
        const error = new Error('Test error');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        errorHandler.handleError(error);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toContain('Test error');
        
        consoleSpy.mockRestore();
    });
    
    test('should notify listeners', () => {
        const error = new Error('Test error');
        const listener = jest.fn();
        
        errorHandler.addListener(listener);
        errorHandler.handleError(error);
        
        expect(listener).toHaveBeenCalledWith(error);
    });
    
    test('should remove listeners', () => {
        const error = new Error('Test error');
        const listener = jest.fn();
        
        errorHandler.addListener(listener);
        errorHandler.removeListener(listener);
        errorHandler.handleError(error);
        
        expect(listener).not.toHaveBeenCalled();
    });
    
    test('should handle multiple listeners', () => {
        const error = new Error('Test error');
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        
        errorHandler.addListener(listener1);
        errorHandler.addListener(listener2);
        errorHandler.handleError(error);
        
        expect(listener1).toHaveBeenCalledWith(error);
        expect(listener2).toHaveBeenCalledWith(error);
    });
    
    test('should handle null errors', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const listener = jest.fn();
        
        errorHandler.addListener(listener);
        errorHandler.handleError(null as unknown as Error);
        
        expect(consoleSpy).toHaveBeenCalledWith('Unknown error');
        expect(listener).toHaveBeenCalledWith(expect.any(Error));
        expect(listener.mock.calls[0][0].message).toBe('Unknown error');
        
        consoleSpy.mockRestore();
    });

    test('should handle error stack trace', () => {
        const error = new Error('Test error');
        error.stack = 'Test stack trace';
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        errorHandler.handleError(error);
        
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy.mock.calls[0][0]).toContain('Test error');
        expect(consoleSpy.mock.calls[1][0]).toBe('Test stack trace');
        
        consoleSpy.mockRestore();
    });

    test('should handle error without stack trace', () => {
        const error = new Error('Test error');
        delete error.stack;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        errorHandler.handleError(error);
        
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy.mock.calls[0][0]).toContain('Test error');
        
        consoleSpy.mockRestore();
    });

    test('should execute listeners in order', () => {
        const error = new Error('Test error');
        const executionOrder: number[] = [];
        const listener1 = jest.fn(() => executionOrder.push(1));
        const listener2 = jest.fn(() => executionOrder.push(2));
        const listener3 = jest.fn(() => executionOrder.push(3));
        
        errorHandler.addListener(listener1);
        errorHandler.addListener(listener2);
        errorHandler.addListener(listener3);
        errorHandler.handleError(error);
        
        expect(executionOrder).toEqual([1, 2, 3]);
    });

    test('should destroy instance and clear listeners', () => {
        const error = new Error('Test error');
        const listener = jest.fn();
        
        errorHandler.addListener(listener);
        errorHandler.destroy();
        errorHandler.handleError(error);
        
        expect(listener).not.toHaveBeenCalled();
        
        // Verify new instance is created after destroy
        const newInstance = ErrorHandler.getInstance();
        expect(newInstance).not.toBe(errorHandler);
    });
}); 