import { PerformanceMonitor } from './PerformanceOptimizations';

/**
 * Music Arrangement Performance Integration
 * 专门为Music Arrangement模块提供性能监控功能
 */
export class MusicArrangementPerformance {
  
  /**
   * 监控轨道创建性能
   */
  static trackCreation<T>(operation: () => Promise<T>, operationName: string = 'createTrack'): Promise<T> {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'music-arrangement');
    
    return operation()
      .then(result => {
        endTiming();
        return result;
      })
      .catch(error => {
        endTiming();
        throw error;
      });
  }

  /**
   * 监控MIDI Clip创建性能
   */
  static clipCreation<T>(operation: () => Promise<T>, operationName: string = 'createMidiClip'): Promise<T> {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'music-arrangement');
    
    return operation()
      .then(result => {
        endTiming();
        return result;
      })
      .catch(error => {
        endTiming();
        throw error;
      });
  }

  /**
   * 监控MIDI音符添加性能
   */
  static noteCreation<T>(operation: () => Promise<T>, operationName: string = 'addMidiNote'): Promise<T> {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'music-arrangement');
    
    return operation()
      .then(result => {
        endTiming();
        return result;
      })
      .catch(error => {
        endTiming();
        throw error;
      });
  }

  /**
   * 监控播放相关操作性能
   */
  static playbackOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'playback');
    
    return operation()
      .then(result => {
        endTiming();
        return result;
      })
      .catch(error => {
        endTiming();
        throw error;
      });
  }

  /**
   * 监控UI交互操作性能
   */
  static uiOperation<T>(operation: () => T, operationName: string): T {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'ui');
    
    try {
      const result = operation();
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  /**
   * 监控Domain层操作性能
   */
  static domainOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'domain');
    
    return operation()
      .then(result => {
        endTiming();
        return result;
      })
      .catch(error => {
        endTiming();
        throw error;
      });
  }

  /**
   * 监控Integration层操作性能
   */
  static integrationOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const endTiming = PerformanceMonitor.startOperation(operationName, 'integration');
    
    return operation()
      .then(result => {
        endTiming();
        return result;
      })
      .catch(error => {
        endTiming();
        throw error;
      });
  }

  /**
   * 获取Music Arrangement相关的性能统计
   */
  static getPerformanceStats(): {
    trackOperations: any;
    clipOperations: any;
    noteOperations: any;
    playbackOperations: any;
    uiOperations: any;
    categoryBreakdown: any;
  } {
    const operationStats = PerformanceMonitor.getOperationStats();
    const categoryStats = PerformanceMonitor.getCategoryBreakdown();

    return {
      trackOperations: Object.entries(operationStats)
        .filter(([key]) => key.includes('Track') || key.includes('track'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      
      clipOperations: Object.entries(operationStats)
        .filter(([key]) => key.includes('Clip') || key.includes('clip'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      
      noteOperations: Object.entries(operationStats)
        .filter(([key]) => key.includes('Note') || key.includes('note') || key.includes('Midi'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      
      playbackOperations: Object.entries(operationStats)
        .filter(([key]) => key.includes('Playback') || key.includes('play'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      
      uiOperations: Object.entries(operationStats)
        .filter(([key]) => operationStats[key].category === 'ui')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      
      categoryBreakdown: categoryStats
    };
  }

  /**
   * 生成性能报告
   */
  static generatePerformanceReport(): string {
    const stats = this.getPerformanceStats();
    const report = ['=== Music Arrangement Performance Report ===\n'];

    // Track Operations
    if (Object.keys(stats.trackOperations).length > 0) {
      report.push('🎛️ Track Operations:');
      Object.entries(stats.trackOperations).forEach(([op, data]: [string, any]) => {
        report.push(`  ${op}: avg ${data.average?.toFixed(1)}ms, 1%low ${data.p1?.toFixed(1)}ms (${data.count} ops)`);
      });
      report.push('');
    }

    // Clip Operations
    if (Object.keys(stats.clipOperations).length > 0) {
      report.push('🎵 Clip Operations:');
      Object.entries(stats.clipOperations).forEach(([op, data]: [string, any]) => {
        report.push(`  ${op}: avg ${data.average?.toFixed(1)}ms, 1%low ${data.p1?.toFixed(1)}ms (${data.count} ops)`);
      });
      report.push('');
    }

    // Note Operations
    if (Object.keys(stats.noteOperations).length > 0) {
      report.push('🎹 Note Operations:');
      Object.entries(stats.noteOperations).forEach(([op, data]: [string, any]) => {
        report.push(`  ${op}: avg ${data.average?.toFixed(1)}ms, 1%low ${data.p1?.toFixed(1)}ms (${data.count} ops)`);
      });
      report.push('');
    }

    // Playback Operations
    if (Object.keys(stats.playbackOperations).length > 0) {
      report.push('⏯️ Playback Operations:');
      Object.entries(stats.playbackOperations).forEach(([op, data]: [string, any]) => {
        report.push(`  ${op}: avg ${data.average?.toFixed(1)}ms, 1%low ${data.p1?.toFixed(1)}ms (${data.count} ops)`);
      });
      report.push('');
    }

         // Category Summary
     report.push('📊 Category Summary:');
     Object.entries(stats.categoryBreakdown).forEach(([category, data]: [string, any]) => {
       report.push(`  ${category}: avg ${data.averageTime?.toFixed(1)}ms, 1%low ${data.p1Low?.toFixed(1)}ms, 99th ${data.p99High?.toFixed(1)}ms (${data.totalOperations} total ops)`);
     });

    return report.join('\n');
  }

  /**
   * 清除所有性能统计数据
   */
  static resetStats(): void {
    PerformanceMonitor.reset();
    console.log('🧹 Music Arrangement performance statistics cleared');
  }

  /**
   * 批量监控多个操作
   */
  static async batchOperation<T>(
    operations: Array<{ name: string; operation: () => Promise<any>; category?: string }>,
    batchName: string = 'batchOperation'
  ): Promise<T[]> {
    const batchEndTiming = PerformanceMonitor.startOperation(batchName, 'batch');
    
    try {
      const results = await Promise.all(
        operations.map(async ({ name, operation, category = 'general' }) => {
          const endTiming = PerformanceMonitor.startOperation(name, category);
          try {
            const result = await operation();
            endTiming();
            return result;
          } catch (error) {
            endTiming();
            throw error;
          }
        })
      );
      
      batchEndTiming();
      return results;
    } catch (error) {
      batchEndTiming();
      throw error;
    }
  }
} 