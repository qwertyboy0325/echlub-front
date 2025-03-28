/**
 * Error Handler
 * Manages error handling and reporting
 */
export class ErrorHandler {
    private static instance: ErrorHandler | null = null;
    private listeners: Set<(error: Error) => void> = new Set();
    
    private constructor() {}
    
    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    
    handleError(error: Error | null): void {
        if (!error) {
            const unknownError = new Error('Unknown error');
            console.error('Unknown error');
            this.listeners.forEach(listener => listener(unknownError));
            return;
        }
        
        console.error(`Error: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        
        // Notify all listeners
        this.listeners.forEach(listener => listener(error));
    }
    
    addListener(listener: (error: Error) => void): void {
        this.listeners.add(listener);
    }
    
    removeListener(listener: (error: Error) => void): void {
        this.listeners.delete(listener);
    }
    
    destroy(): void {
        this.listeners.clear();
        ErrorHandler.instance = null;
    }
} 