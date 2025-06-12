/**
 * Performance Optimization Utilities for DAW Interface
 * Provides throttling, debouncing, and memoization utilities
 */

// Performance timing constants
export const PERFORMANCE_CONSTANTS = {
  RENDER_THROTTLE: 16, // ~60fps
  STATE_UPDATE_DEBOUNCE: 8, // ~120fps max for state updates
  COMMAND_BATCH_SIZE: 3, // Process max 3 commands at once
  SCENE_UPDATE_THROTTLE: 16, // Scene render throttle
  SLOW_COMMAND_THRESHOLD: 50, // Log commands taking longer than 50ms
};

/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function calls to delay execution until after calls have stopped
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Memoize function results to avoid recalculation
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static operationStats: Map<string, {
    times: number[];
    categories: string[];
    startTime: number;
  }> = new Map();
  
  static startTiming(key: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(key, duration);
      
      if (duration > PERFORMANCE_CONSTANTS.SLOW_COMMAND_THRESHOLD) {
        console.warn(`🐌 Slow operation '${key}': ${duration.toFixed(2)}ms`);
      }
    };
  }

  static startOperation(operationType: string, category: string = 'general'): () => void {
    const start = performance.now();
    const operationId = `${operationType}-${Date.now()}-${Math.random()}`;
    
    this.operationStats.set(operationId, {
      times: [],
      categories: [category],
      startTime: start
    });
    
    return () => {
      const duration = performance.now() - start;
      this.recordOperation(operationType, duration, category);
      this.operationStats.delete(operationId);
    };
  }

  static recordOperation(operationType: string, duration: number, category: string = 'general'): void {
    const key = `${category}:${operationType}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const values = this.metrics.get(key)!;
    values.push(duration);
    
    // Keep only last 1000 measurements for accurate percentile calculation
    if (values.length > 1000) {
      values.shift();
    }
    
    this.recordMetric(operationType, duration);
  }
  
  static recordMetric(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const values = this.metrics.get(key)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  static getOperationStats(): Record<string, {
    average: number;
    median: number;
    p1: number; // 1% low
    p99: number; // 99th percentile
    min: number;
    max: number;
    count: number;
    category: string;
  }> {
    const result: Record<string, any> = {};
    
    for (const [key, values] of this.metrics) {
      if (values.length > 0 && key.includes(':')) {
        const [category, operation] = key.split(':');
        const sorted = [...values].sort((a, b) => a - b);
        
        result[operation] = {
          category,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          median: this.getPercentile(values, 50),
          p1: this.getPercentile(values, 1), // 1% low
          p99: this.getPercentile(values, 99),
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }
    
    return result;
  }
  
  static getAverageMetric(key: string): number {
    const values = this.metrics.get(key);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  static getMetrics(): Record<string, { average: number; latest: number; count: number }> {
    const result: Record<string, { average: number; latest: number; count: number }> = {};
    
    for (const [key, values] of this.metrics) {
      if (values.length > 0) {
        result[key] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          latest: values[values.length - 1],
          count: values.length
        };
      }
    }
    
    return result;
  }

  static getCategoryBreakdown(): Record<string, {
    totalOperations: number;
    averageTime: number;
    p1Low: number;
    p99High: number; // 99th percentile (1% max)
    operations: string[];
  }> {
    const categories: Record<string, any> = {};
    
    for (const [key, values] of this.metrics) {
      if (key.includes(':')) {
        const [category] = key.split(':');
        const operation = key.split(':')[1];
        
        if (!categories[category]) {
          categories[category] = {
            totalOperations: 0,
            totalTime: 0,
            allTimes: [],
            operations: new Set()
          };
        }
        
        categories[category].totalOperations += values.length;
        categories[category].totalTime += values.reduce((a, b) => a + b, 0);
        categories[category].allTimes.push(...values);
        categories[category].operations.add(operation);
      }
    }
    
    const result: Record<string, any> = {};
    for (const [category, data] of Object.entries(categories)) {
      result[category] = {
        totalOperations: data.totalOperations,
        averageTime: data.totalTime / data.totalOperations,
        p1Low: this.getPercentile(data.allTimes, 1),
        p99High: this.getPercentile(data.allTimes, 99), // 99th percentile (worst case)
        operations: Array.from(data.operations)
      };
    }
    
    return result;
  }
  
  static reset(): void {
    this.metrics.clear();
    this.operationStats.clear();
  }
}

/**
 * Command queue for batching operations
 */
export class CommandQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  
  async add(command: () => Promise<void>): Promise<void> {
    this.queue.push(command);
    this.processQueue();
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const endTiming = PerformanceMonitor.startTiming('command-queue-batch');
    
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, PERFORMANCE_CONSTANTS.COMMAND_BATCH_SIZE);
        await Promise.all(batch.map(cmd => cmd()));
        
        // Yield to main thread between batches
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } finally {
      this.isProcessing = false;
      endTiming();
    }
  }
}

/**
 * Scene state optimization utilities
 */
export function isSceneUpdateSignificant(
  prevState: any | null,
  newState: any
): boolean {
  if (!prevState) return true;
  
  // Check for significant changes that require re-render
  const significantChanges = [
    prevState.tracks?.length !== newState.tracks?.length,
    prevState.clips?.length !== newState.clips?.length,
    prevState.playhead?.currentTime !== newState.playhead?.currentTime,
    prevState.playhead?.isPlaying !== newState.playhead?.isPlaying,
    prevState.selection?.clips?.length !== newState.selection?.clips?.length,
    prevState.shouldRedrawGrid !== newState.shouldRedrawGrid,
    prevState.shouldRedrawWaveforms !== newState.shouldRedrawWaveforms,
    Math.abs((prevState.lastUpdateTimestamp || 0) - (newState.lastUpdateTimestamp || 0)) > 100
  ];
  
  return significantChanges.some(Boolean);
}

/**
 * PIXI.js specific optimizations
 */
export const PixiOptimizations = {
  // Throttle PIXI updates to match display refresh rate
  throttlePixiUpdates: throttle((renderer: any, sceneState: any) => {
    if (renderer && renderer.updateScene) {
      renderer.updateScene(sceneState);
    }
  }, PERFORMANCE_CONSTANTS.RENDER_THROTTLE),
  
  // Batch PIXI operations
  batchPixiOperations: (operations: Array<() => void>) => {
    // Group operations and execute in single frame
    operations.forEach(op => op());
  }
};

/**
 * React component optimization utilities
 */
export const ReactOptimizations = {
  // Shallow comparison for React.memo
  shallowEqual: (prevProps: any, nextProps: any): boolean => {
    const keys1 = Object.keys(prevProps);
    const keys2 = Object.keys(nextProps);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  },
  
  // Stable reference factory
  createStableHandler: <T extends (...args: any[]) => any>(
    handler: T,
    deps: any[]
  ): T => {
    // This would be used with useCallback in actual React component
    return handler;
  }
};

/**
 * Memory management utilities
 */
export const MemoryManager = {
  // Cleanup function for removing event listeners and timers
  cleanup: (cleanupFunctions: Array<() => void>) => {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
  },
  
  // Monitor memory usage (where available)
  getMemoryUsage: (): number => {
    const performance = window.performance as any;
    return performance.memory?.usedJSHeapSize || 0;
  },
  
  // Trigger garbage collection hint
  requestGC: () => {
    if ('gc' in window) {
      (window as any).gc();
    }
  }
}; 