import { FilterQuery, QueryOptions, PipelineStage, Types } from 'mongoose';
import { logger } from './logger';

/**
 * Query optimization utilities for better database performance
 */

export interface OptimizedQueryOptions extends QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  lean?: boolean;
  explain?: boolean;
}

export class QueryOptimizer {
  /**
   * Optimize find query options
   */
  static optimizeFindOptions(options: OptimizedQueryOptions = {}): QueryOptions {
    const optimized: QueryOptions = {
      ...options,
      // Use lean queries by default for better performance
      lean: options.lean !== false,
      // Add default sorting if not specified
      sort: options.sort || { createdAt: -1 },
      // Limit results to prevent memory issues
      limit: options.limit || 1000
    };

    // Remove custom options that mongoose doesn't understand
    delete (optimized as any).useCache;
    delete (optimized as any).cacheTTL;
    delete (optimized as any).explain;

    return optimized;
  }

  /**
   * Optimize aggregation pipeline
   */
  static optimizeAggregationPipeline(pipeline: PipelineStage[]): PipelineStage[] {
    const optimized = [...pipeline];

    // Add $limit early if not present to prevent processing too much data
    const hasLimit = optimized.some(stage => '$limit' in stage);
    if (!hasLimit) {
      // Add limit before sort operations if possible
      const sortIndex = optimized.findIndex(stage => '$sort' in stage);
      if (sortIndex > -1) {
        optimized.splice(sortIndex + 1, 0, { $limit: 10000 });
      } else {
        optimized.push({ $limit: 10000 });
      }
    }

    // Move $match stages to the beginning for better performance
    const matchStages: PipelineStage[] = [];
    const otherStages: PipelineStage[] = [];

    optimized.forEach(stage => {
      if ('$match' in stage) {
        matchStages.push(stage);
      } else {
        otherStages.push(stage);
      }
    });

    return [...matchStages, ...otherStages];
  }

  /**
   * Create optimized filter for company-based queries
   */
  static createCompanyFilter<T>(companyId: string, additionalFilter: FilterQuery<T> = {}): FilterQuery<T> {
    return {
      companyId: new Types.ObjectId(companyId),
      ...additionalFilter
    } as FilterQuery<T>;
  }

  /**
   * Create date range filter
   */
  static createDateRangeFilter(
    field: string = 'createdAt',
    startDate?: Date,
    endDate?: Date
  ): FilterQuery<any> {
    if (!startDate && !endDate) return {};

    const filter: any = {};
    
    if (startDate && endDate) {
      filter[field] = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter[field] = { $gte: startDate };
    } else if (endDate) {
      filter[field] = { $lte: endDate };
    }

    return filter;
  }

  /**
   * Create pagination options
   */
  static createPaginationOptions(page: number = 1, limit: number = 10): QueryOptions {
    const skip = (page - 1) * limit;
    return {
      skip,
      limit: Math.min(limit, 100), // Cap at 100 to prevent performance issues
      lean: true
    };
  }

  /**
   * Create text search filter
   */
  static createTextSearchFilter(searchTerm: string, fields: string[]): FilterQuery<any> {
    if (!searchTerm || !fields.length) return {};

    const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    return {
      $or: fields.map(field => ({
        [field]: searchRegex
      }))
    };
  }

  /**
   * Create status filter
   */
  static createStatusFilter(status?: string | string[]): FilterQuery<any> {
    if (!status) return {};

    if (Array.isArray(status)) {
      return { status: { $in: status } };
    }

    return { status };
  }

  /**
   * Optimize aggregation for statistics
   */
  static createStatsAggregation(
    matchFilter: FilterQuery<any>,
    groupBy?: string,
    sumField?: string
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [
      { $match: matchFilter }
    ];

    if (groupBy) {
      const groupStage: any = {
        _id: `$${groupBy}`,
        count: { $sum: 1 }
      };

      if (sumField) {
        groupStage.total = { $sum: `$${sumField}` };
        groupStage.average = { $avg: `$${sumField}` };
      }

      pipeline.push({ $group: groupStage });
      pipeline.push({ $sort: { count: -1 } });
    } else {
      const groupStage: any = {
        _id: null,
        count: { $sum: 1 }
      };

      if (sumField) {
        groupStage.total = { $sum: `$${sumField}` };
        groupStage.average = { $avg: `$${sumField}` };
        groupStage.min = { $min: `$${sumField}` };
        groupStage.max = { $max: `$${sumField}` };
      }

      pipeline.push({ $group: groupStage });
    }

    return pipeline;
  }

  /**
   * Create lookup stage for population
   */
  static createLookupStage(
    from: string,
    localField: string,
    foreignField: string = '_id',
    as: string,
    pipeline?: PipelineStage[]
  ): PipelineStage {
    const lookupStage: any = {
      $lookup: {
        from,
        localField,
        foreignField,
        as
      }
    };

    if (pipeline) {
      lookupStage.$lookup.pipeline = pipeline;
    }

    return lookupStage;
  }

  /**
   * Log query performance
   */
  static logQueryPerformance(
    operation: string,
    startTime: number,
    resultCount?: number,
    filter?: any
  ): void {
    const duration = Date.now() - startTime;
    
    if (duration > 1000) { // Log slow queries (> 1 second)
      logger.warn('Slow query detected', {
        operation,
        duration: `${duration}ms`,
        resultCount,
        filter: filter ? Object.keys(filter) : undefined
      });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Query performance', {
        operation,
        duration: `${duration}ms`,
        resultCount
      });
    }
  }

  /**
   * Validate and sanitize filter
   */
  static sanitizeFilter(filter: any): FilterQuery<any> {
    if (!filter || typeof filter !== 'object') return {};

    const sanitized: any = {};

    for (const [key, value] of Object.entries(filter)) {
      // Skip dangerous operators
      if (key.startsWith('$') && !['$and', '$or', '$in', '$nin', '$gte', '$lte', '$gt', '$lt', '$ne', '$exists'].includes(key)) {
        continue;
      }

      // Sanitize regex patterns
      if (value && typeof value === 'object' && '$regex' in value) {
        sanitized[key] = {
          $regex: String(value.$regex).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i'
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create efficient count aggregation
   */
  static createCountAggregation(matchFilter: FilterQuery<any>): PipelineStage[] {
    return [
      { $match: matchFilter },
      { $count: 'total' }
    ];
  }

  /**
   * Create faceted search aggregation
   */
  static createFacetedAggregation(
    matchFilter: FilterQuery<any>,
    facets: Record<string, any[]>
  ): PipelineStage[] {
    return [
      { $match: matchFilter },
      { $facet: facets as any }
    ];
  }
}

export default QueryOptimizer;
