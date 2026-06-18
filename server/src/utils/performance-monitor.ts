import { logger } from './logger';

/**
 * Performance monitoring utilities for tracking system performance
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface PerformanceThresholds {
  warning: number; // milliseconds
  critical: number; // milliseconds
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static maxMetrics = 1000; // Keep last 1000 metrics
  private static thresholds: Record<string, PerformanceThresholds> = {
    database: { warning: 1000, critical: 5000 },
    api: { warning: 2000, critical: 10000 },
    service: { warning: 500, critical: 2000 },
    controller: { warning: 1000, critical: 5000 }
  };

  /**
   * Start performance tracking
   */
  static startTracking(operation: string, metadata?: any): PerformanceTracker {
    return new PerformanceTracker(operation, metadata);
  }

  /**
   * Record performance metric
   */
  static recordMetric(metric: PerformanceMetrics): void {
    // Add to metrics array
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check thresholds and log warnings
    this.checkThresholds(metric);
  }

  /**
   * Get performance statistics
   */
  static getStats(operation?: string, timeRange?: { start: Date; end: Date }): any {
    let filteredMetrics = this.metrics;

    // Filter by operation
    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation.includes(operation));
    }

    // Filter by time range
    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return { count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0 };
    }

    const durations = filteredMetrics.map(m => m.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Calculate percentiles
    const sortedDurations = durations.sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedDurations, 50);
    const p95 = this.getPercentile(sortedDurations, 95);
    const p99 = this.getPercentile(sortedDurations, 99);

    return {
      count: filteredMetrics.length,
      avgDuration: Math.round(avgDuration),
      minDuration,
      maxDuration,
      p50,
      p95,
      p99,
      slowQueries: filteredMetrics.filter(m => m.duration > 1000).length
    };
  }

  /**
   * Get slow operations
   */
  static getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 50); // Top 50 slow operations
  }

  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Set performance thresholds
   */
  static setThresholds(category: string, thresholds: PerformanceThresholds): void {
    this.thresholds[category] = thresholds;
  }

  /**
   * Check performance thresholds
   */
  private static checkThresholds(metric: PerformanceMetrics): void {
    const category = this.getCategory(metric.operation);
    const threshold = this.thresholds[category];

    if (!threshold) return;

    if (metric.duration > threshold.critical) {
      logger.error('Critical performance issue detected', {
        operation: metric.operation,
        duration: `${metric.duration}ms`,
        threshold: `${threshold.critical}ms`,
        metadata: metric.metadata
      });
    } else if (metric.duration > threshold.warning) {
      logger.warn('Performance warning', {
        operation: metric.operation,
        duration: `${metric.duration}ms`,
        threshold: `${threshold.warning}ms`,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Get category from operation name
   */
  private static getCategory(operation: string): string {
    if (operation.includes('database') || operation.includes('query') || operation.includes('aggregate')) {
      return 'database';
    }
    if (operation.includes('controller') || operation.includes('Controller')) {
      return 'controller';
    }
    if (operation.includes('service') || operation.includes('Service')) {
      return 'service';
    }
    return 'api';
  }

  /**
   * Calculate percentile
   */
  private static getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }
}

/**
 * Performance tracker class
 */
export class PerformanceTracker {
  private startTime: number;
  private startCpuUsage: NodeJS.CpuUsage;
  private operation: string;
  private metadata?: any;

  constructor(operation: string, metadata?: any) {
    this.operation = operation;
    this.metadata = metadata;
    this.startTime = Date.now();
    this.startCpuUsage = process.cpuUsage();
  }

  /**
   * End tracking and record metric
   */
  end(additionalMetadata?: any): PerformanceMetrics {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const cpuUsage = process.cpuUsage(this.startCpuUsage);
    const memoryUsage = process.memoryUsage();

    const metric: PerformanceMetrics = {
      operation: this.operation,
      duration,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...additionalMetadata },
      memoryUsage,
      cpuUsage
    };

    PerformanceMonitor.recordMetric(metric);
    return metric;
  }

  /**
   * Get current duration without ending
   */
  getCurrentDuration(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Performance decorator for methods
 */
export function performanceTrack(category: string = 'service') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracker = PerformanceMonitor.startTracking(
        `${category}:${target.constructor.name}.${propertyName}`,
        { args: args.length }
      );

      try {
        const result = await method.apply(this, args);
        tracker.end({ success: true, resultSize: Array.isArray(result) ? result.length : 1 });
        return result;
      } catch (error) {
        tracker.end({ success: false, error: error.message });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Express middleware for performance tracking
 */
export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const tracker = PerformanceMonitor.startTracking(
      `api:${req.method} ${req.path}`,
      {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      tracker.end({
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length')
      });
      originalEnd.apply(res, args);
    };

    next();
  };
}

export default PerformanceMonitor;
