import { injectable } from 'inversify';

interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
}

interface PerformanceReport {
    metrics: PerformanceMetric[];
    summary: {
        averageFPS: number;
        averageLatency: number;
        peakMemoryUsage: number;
    };
}

@injectable()
export class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private frameCount: number = 0;
    private lastFrameTime: number = 0;
    private startTime: number = 0;
    
    constructor() {
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
    }
    
    recordFrame(): void {
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        
        this.metrics.push({
            name: 'frameTime',
            value: frameTime,
            timestamp: currentTime
        });
        
        this.frameCount++;
        this.lastFrameTime = currentTime;
        
        // 限制指標數量，只保留最近1000個
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }
    
    recordEventLatency(eventName: string, latency: number): void {
        this.metrics.push({
            name: `eventLatency:${eventName}`,
            value: latency,
            timestamp: performance.now()
        });
    }
    
    recordMemoryUsage(): void {
        if (performance.memory) {
            this.metrics.push({
                name: 'memoryUsage',
                value: performance.memory.usedJSHeapSize,
                timestamp: performance.now()
            });
        }
    }
    
    generateReport(): PerformanceReport {
        const frameTimes = this.metrics.filter(m => m.name === 'frameTime').map(m => m.value);
        const eventLatencies = this.metrics.filter(m => m.name.startsWith('eventLatency:')).map(m => m.value);
        const memoryUsages = this.metrics.filter(m => m.name === 'memoryUsage').map(m => m.value);
        
        const totalTime = performance.now() - this.startTime;
        const averageFPS = (this.frameCount / totalTime) * 1000;
        
        return {
            metrics: this.metrics,
            summary: {
                averageFPS,
                averageLatency: eventLatencies.reduce((a, b) => a + b, 0) / eventLatencies.length,
                peakMemoryUsage: Math.max(...memoryUsages)
            }
        };
    }
    
    clear(): void {
        this.metrics = [];
        this.frameCount = 0;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
    }
} 