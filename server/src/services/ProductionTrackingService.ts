import ProductionOrder from '../models/ProductionOrder';
import Customer from '../models/Customer';
import User from '../models/User';
import Company from '../models/Company';
import { logger } from '../utils/logger';

export interface ProductionTrackingParams {
  companyId?: string;
  date?: string;
  firmId?: string;
  machineId?: string;
  status?: string;
  includeDetails?: boolean;
}

export interface ProductionUpdateRequest {
  jobId: string;
  stageId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'delayed';
  progress?: number;
  completedQuantity?: number;
  qualityChecks?: Array<{
    checkType: string;
    status: 'passed' | 'failed' | 'pending';
    notes?: string;
  }>;
  notes?: string;
}

export class ProductionTrackingService {
  async getProductionTrackingData(params: ProductionTrackingParams): Promise<any> {
    try {
      const { companyId, date, firmId, machineId, status, includeDetails } = params;
      
      // Build match conditions
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId; // Only filter by companyId if provided
      if (date) matchConditions.date = new Date(date);
      if (firmId) matchConditions.firmId = firmId;
      if (machineId) matchConditions.machineId = machineId;
      if (status) matchConditions.status = status;

      // Get summary data
      const summary = await this.getProductionSummary(matchConditions);

      // Get printing status
      const printingStatus = await this.getPrintingStatusData(matchConditions);

      // Get job work tracking
      const jobWorkTracking = await this.getJobWorkTrackingData(matchConditions);

      // Get process tracking
      const processTracking = await this.getProcessTrackingData(matchConditions, includeDetails);

      // Get daily production summary
      const dailyProductionSummary = await this.getDailyProductionSummaryData(matchConditions);

      // Get machine-wise summary
      const machineWiseSummary = await this.getMachineWiseSummaryData(matchConditions);

      return {
        summary,
        printingStatus,
        jobWorkTracking,
        processTracking,
        dailyProductionSummary,
        machineWiseSummary
      };
    } catch (error) {
      console.error('Error in getProductionTrackingData:', error);
      throw error;
    }
  }

  async getPrintingStatus(params: any): Promise<any> {
    try {
      const { companyId, printingType, status, machineId, operatorId } = params;
      
      const matchConditions: any = { 'productionStages.processType': 'printing' };
      if (companyId) matchConditions.companyId = companyId; // Only filter by companyId if provided
      if (printingType) matchConditions['productionStages.printingType'] = printingType;
      if (status) matchConditions['productionStages.status'] = status;
      if (machineId) matchConditions['productionStages.assignment.machines.machineId'] = machineId;
      if (operatorId) matchConditions['productionStages.assignment.workers.workerId'] = operatorId;

      const result = await ProductionOrder.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        {
          $unwind: '$productionStages'
        },
        {
          $match: { 'productionStages.processType': 'printing' }
        },
        {
          $project: {
            jobId: '$_id',
            jobNumber: '$productionOrderNumber',
            customerName: '$customerInfo.name',
            productName: '$product.productType',
            printingType: '$productionStages.printingType',
            status: '$productionStages.status',
            progress: {
              $multiply: [
                { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                100
              ]
            },
            startTime: '$productionStages.timing.actualStartTime',
            estimatedCompletion: '$productionStages.timing.plannedEndTime',
            actualCompletion: '$productionStages.timing.actualEndTime',
            machineId: '$productionStages.assignment.machines.machineId',
            operatorId: '$productionStages.assignment.workers.workerId',
            qualityChecks: '$productionStages.qualityControl.qualityChecks'
          }
        },
        { $sort: { startTime: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getPrintingStatus:', error);
      throw error;
    }
  }

  async getJobWorkTracking(params: any): Promise<any> {
    try {
      const { companyId, jobType, status, contractorId, startDate, endDate } = params;
      
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId;
      if (jobType) matchConditions['productionStages.assignment.jobWork.jobType'] = jobType;
      if (status) matchConditions['productionStages.status'] = status;
      if (contractorId) matchConditions['productionStages.assignment.jobWork.contractorId'] = contractorId;
      if (startDate && endDate) {
        matchConditions['productionStages.timing.actualStartTime'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const result = await ProductionOrder.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        {
          $unwind: '$productionStages'
        },
        {
          $match: { 'productionStages.assignment.jobWork': { $exists: true } }
        },
        {
          $project: {
            jobId: '$_id',
            jobNumber: '$productionOrderNumber',
            customerName: '$customerInfo.name',
            jobType: '$productionStages.assignment.jobWork.jobType',
            contractorName: '$productionStages.assignment.jobWork.contractorName',
            contractorContact: '$productionStages.assignment.jobWork.contractorContact',
            startDate: '$productionStages.timing.actualStartTime',
            estimatedCompletion: '$productionStages.timing.plannedEndTime',
            actualCompletion: '$productionStages.timing.actualEndTime',
            status: '$productionStages.status',
            progress: {
              $multiply: [
                { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                100
              ]
            },
            stages: '$productionStages.stages'
          }
        },
        { $sort: { startDate: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getJobWorkTracking:', error);
      throw error;
    }
  }

  async getProcessTracking(params: any): Promise<any> {
    try {
      const { companyId, jobId, stage, status, includeQualityChecks } = params;
      
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId;
      if (jobId) matchConditions._id = jobId;
      if (stage) matchConditions['productionStages.stageName'] = stage;
      if (status) matchConditions['productionStages.status'] = status;

      const result = await ProductionOrder.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        {
          $unwind: '$productionStages'
        },
        {
          $project: {
            jobId: '$_id',
            jobNumber: '$productionOrderNumber',
            customerName: '$customerInfo.name',
            stageId: '$productionStages.stageId',
            stageName: '$productionStages.stageName',
            processType: '$productionStages.processType',
            status: '$productionStages.status',
            startTime: '$productionStages.timing.actualStartTime',
            completionTime: '$productionStages.timing.actualEndTime',
            plannedDuration: '$productionStages.timing.plannedDuration',
            actualDuration: '$productionStages.timing.actualDuration',
            producedQuantity: '$productionStages.output.producedQuantity',
            targetQuantity: '$orderQuantity',
            progress: {
              $multiply: [
                { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                100
              ]
            },
            qualityChecks: includeQualityChecks ? '$productionStages.qualityControl' : [],
            notes: '$productionStages.notes',
            instructions: '$productionStages.instructions'
          }
        },
        { $sort: { 'productionStages.stageNumber': 1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getProcessTracking:', error);
      throw error;
    }
  }

  async getDailyProductionSummary(params: any): Promise<any> {
    try {
      const { companyId, date, firmId, includeBreakdown } = params;
      
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId;
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        matchConditions['productionStages.timing.actualStartTime'] = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }
      if (firmId) matchConditions.firmId = firmId;

      const result = await ProductionOrder.aggregate([
        { $match: matchConditions },
        {
          $unwind: '$productionStages'
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$productionStages.timing.actualStartTime' } },
              firmId: '$firmId',
              processType: '$productionStages.processType'
            },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$orderQuantity' },
            completedQuantity: { $sum: '$productionStages.output.producedQuantity' },
            efficiency: {
              $avg: {
                $multiply: [
                  { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                  100
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            firmWiseSummary: {
              $push: {
                firmId: '$_id.firmId',
                processType: '$_id.processType',
                totalOrders: '$totalOrders',
                totalQuantity: '$totalQuantity',
                completedQuantity: '$completedQuantity',
                efficiency: '$efficiency'
              }
            },
            totalOrders: { $sum: '$totalOrders' },
            totalQuantity: { $sum: '$totalQuantity' },
            completedQuantity: { $sum: '$completedQuantity' },
            overallEfficiency: { $avg: '$efficiency' }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getDailyProductionSummary:', error);
      throw error;
    }
  }

  async getMachineWiseSummary(params: any): Promise<any> {
    try {
      const { companyId, machineType, status, includeMaintenance } = params;
      
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId;
      if (machineType) matchConditions['productionStages.assignment.machines.machineType'] = machineType;
      if (status) matchConditions['productionStages.status'] = status;

      const result = await ProductionOrder.aggregate([
        { $match: matchConditions },
        {
          $unwind: '$productionStages'
        },
        {
          $unwind: '$productionStages.assignment.machines'
        },
        {
          $group: {
            _id: '$productionStages.assignment.machines.machineId',
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$orderQuantity' },
            completedQuantity: { $sum: '$productionStages.output.producedQuantity' },
            efficiency: {
              $avg: {
                $multiply: [
                  { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                  100
                ]
              }
            },
            currentStatus: { $last: '$productionStages.status' },
            lastUpdated: { $last: '$productionStages.timing.actualStartTime' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getMachineWiseSummary:', error);
      throw error;
    }
  }

  async getProductionEfficiency(params: any): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, firmId, machineId, metric } = params;
      
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId;
      if (firmId) matchConditions.firmId = firmId;
      if (machineId) matchConditions['productionStages.assignment.machines.machineId'] = machineId;

      // Date range logic
      if (timeRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchConditions['productionStages.timing.actualStartTime'] = {
          $gte: today,
          $lt: tomorrow
        };
      } else if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchConditions['productionStages.timing.actualStartTime'] = {
          $gte: weekAgo
        };
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchConditions['productionStages.timing.actualStartTime'] = {
          $gte: monthAgo
        };
      } else if (startDate && endDate) {
        matchConditions['productionStages.timing.actualStartTime'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const result = await ProductionOrder.aggregate([
        { $match: matchConditions },
        {
          $unwind: '$productionStages'
        },
        {
          $group: {
            _id: metric === 'machine' ? '$productionStages.assignment.machines.machineId' :
                 metric === 'operator' ? '$productionStages.assignment.workers.workerId' :
                 metric === 'process' ? '$productionStages.processType' : null,
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$orderQuantity' },
            completedQuantity: { $sum: '$productionStages.output.producedQuantity' },
            efficiency: {
              $avg: {
                $multiply: [
                  { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                  100
                ]
              }
            },
            averageDuration: { $avg: '$productionStages.timing.actualDuration' },
            totalCost: { $sum: '$productionStages.costs.totalStageCost' }
          }
        },
        {
          $project: {
            metric: '$_id',
            totalOrders: 1,
            totalQuantity: 1,
            completedQuantity: 1,
            efficiency: { $round: ['$efficiency', 2] },
            averageDuration: { $round: ['$averageDuration', 2] },
            totalCost: 1,
            costPerUnit: {
              $round: [
                { $divide: ['$totalCost', '$completedQuantity'] },
                2
              ]
            }
          }
        },
        { $sort: { efficiency: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getProductionEfficiency:', error);
      throw error;
    }
  }

  async getRealTimeProductionDashboard(params: any): Promise<any> {
    try {
      const { companyId, refreshInterval, includeCharts } = params;
      
      const matchConditions: any = {};
      if (companyId) matchConditions.companyId = companyId;

      // Get real-time data
      const realTimeData = await this.getRealTimeData(matchConditions);
      
      // Get production trends if charts are requested
      let productionTrends = [];
      let processDistribution = [];
      if (includeCharts) {
        productionTrends = await this.getProductionTrends(matchConditions);
        processDistribution = await this.getProcessDistribution(matchConditions);
      }

      // Get alerts
      const alerts = await this.getProductionAlerts({ companyId, includeResolved: false });

      return {
        realTimeData,
        productionTrends,
        processDistribution,
        alerts,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getRealTimeProductionDashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private async getProductionSummary(matchConditions: any): Promise<any> {
    const result = await ProductionOrder.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'in_progress'] },
                1,
                0
              ]
            }
          },
          completedJobs: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0
              ]
            }
          },
          pendingJobs: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                1,
                0
              ]
            }
          },
          totalProduction: { $sum: '$completedQuantity' },
          totalTarget: { $sum: '$orderQuantity' }
        }
      },
      {
        $project: {
          _id: 0,
          totalJobs: 1,
          activeJobs: 1,
          completedJobs: 1,
          pendingJobs: 1,
          totalProduction: 1,
          productionEfficiency: {
            $multiply: [
              { $divide: ['$totalProduction', '$totalTarget'] },
              100
            ]
          },
          machineUtilization: 85, // This would need to be calculated from machine data
          qualityScore: 98.5 // This would need to be calculated from quality data
        }
      }
    ]);

    return result[0] || {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      totalProduction: 0,
      productionEfficiency: 0,
      machineUtilization: 0,
      qualityScore: 0
    };
  }

  private async getPrintingStatusData(matchConditions: any): Promise<any> {
    return this.getPrintingStatus({ ...matchConditions });
  }

  private async getJobWorkTrackingData(matchConditions: any): Promise<any> {
    return this.getJobWorkTracking({ ...matchConditions });
  }

  private async getProcessTrackingData(matchConditions: any, includeDetails: boolean): Promise<any> {
    return this.getProcessTracking({ ...matchConditions, includeQualityChecks: includeDetails });
  }

  private async getDailyProductionSummaryData(matchConditions: any): Promise<any> {
    return this.getDailyProductionSummary({ ...matchConditions });
  }

  private async getMachineWiseSummaryData(matchConditions: any): Promise<any> {
    return this.getMachineWiseSummary({ ...matchConditions });
  }

  private async getRealTimeData(matchConditions: any): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const realTimeMatch = {
      ...matchConditions,
      'productionStages.timing.actualStartTime': { $gte: today },
      'productionStages.status': { $in: ['in_progress', 'pending'] }
    };

    const result = await ProductionOrder.aggregate([
      { $match: realTimeMatch },
      {
        $unwind: '$productionStages'
      },
      {
        $match: {
          'productionStages.status': { $in: ['in_progress', 'pending'] }
        }
      },
      {
        $project: {
          jobId: '$_id',
          jobNumber: '$productionOrderNumber',
          customerName: '$customerName',
          stageName: '$productionStages.stageName',
          processType: '$productionStages.processType',
          status: '$productionStages.status',
          progress: {
            $multiply: [
              { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
              100
            ]
          },
          startTime: '$productionStages.timing.actualStartTime',
          estimatedCompletion: '$productionStages.timing.plannedEndTime',
          currentQuantity: '$productionStages.output.producedQuantity',
          targetQuantity: '$orderQuantity'
        }
      },
      { $sort: { startTime: -1 } }
    ]);

    return result;
  }

  private async getProductionTrends(matchConditions: any): Promise<any> {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const trendMatch = {
      ...matchConditions,
      'productionStages.timing.actualStartTime': { $gte: last7Days }
    };

    const result = await ProductionOrder.aggregate([
      { $match: trendMatch },
      {
        $unwind: '$productionStages'
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$productionStages.timing.actualStartTime' } }
          },
          totalProduction: { $sum: '$productionStages.output.producedQuantity' },
          totalOrders: { $sum: 1 },
          efficiency: {
            $avg: {
              $multiply: [
                { $divide: ['$productionStages.output.producedQuantity', '$orderQuantity'] },
                100
              ]
            }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return result;
  }

  private async getProcessDistribution(matchConditions: any): Promise<any> {
    const result = await ProductionOrder.aggregate([
      { $match: matchConditions },
      {
        $unwind: '$productionStages'
      },
      {
        $group: {
          _id: '$productionStages.processType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$productionStages.output.producedQuantity' }
        }
      },
      {
        $project: {
          processType: '$_id',
          count: 1,
          totalQuantity: 1,
          percentage: {
            $multiply: [
              { $divide: ['$count', { $sum: '$count' }] },
              100
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return result;
  }

  private async getProductionAlerts(params: any): Promise<any> {
    const { companyId, includeResolved } = params;
    
    const alertMatch: any = {};
    if (companyId) alertMatch.companyId = companyId;
    if (!includeResolved) alertMatch.resolved = false;

    // This would need to be implemented based on your alert system
    // For now, returning empty array
    return [];
  }

  // Update methods
  async updateProductionStatus(updateData: ProductionUpdateRequest): Promise<any> {
    try {
      const { jobId, stageId, status, progress, completedQuantity, qualityChecks, notes } = updateData;

      const updateFields: any = {};
      
      if (stageId) {
        updateFields['productionStages.$[stage].status'] = status;
        if (progress !== undefined) {
          updateFields['productionStages.$[stage].progress'] = progress;
        }
        if (completedQuantity !== undefined) {
          updateFields['productionStages.$[stage].output.producedQuantity'] = completedQuantity;
        }
        if (qualityChecks) {
          updateFields['productionStages.$[stage].qualityControl.qualityChecks'] = qualityChecks;
        }
        if (notes) {
          updateFields['productionStages.$[stage].notes'] = notes;
        }
      } else {
        updateFields.status = status;
        if (progress !== undefined) {
          updateFields.progress = progress;
        }
        if (completedQuantity !== undefined) {
          updateFields.completedQuantity = completedQuantity;
        }
        if (notes) {
          updateFields.notes = notes;
        }
      }

      const result = await ProductionOrder.findByIdAndUpdate(
        jobId,
        { $set: updateFields },
        {
          new: true,
          arrayFilters: stageId ? [{ 'stage.stageId': stageId }] : undefined
        }
      );

      return result;
    } catch (error) {
      console.error('Error in updateProductionStatus:', error);
      throw error;
    }
  }

  async startProductionStage(params: any): Promise<any> {
    try {
      const { jobId, stageId, operatorId, machineId, startTime, notes } = params;

      const updateFields: any = {
        'productionStages.$[stage].status': 'in_progress',
        'productionStages.$[stage].timing.actualStartTime': startTime || new Date()
      };

      if (operatorId) {
        updateFields['productionStages.$[stage].assignment.workers.0.workerId'] = operatorId;
        updateFields['productionStages.$[stage].assignment.workers.0.assignedAt'] = new Date();
      }

      if (machineId) {
        updateFields['productionStages.$[stage].assignment.machines.0.machineId'] = machineId;
        updateFields['productionStages.$[stage].assignment.machines.0.assignedAt'] = new Date();
      }

      if (notes) {
        updateFields['productionStages.$[stage].notes'] = notes;
      }

      const result = await ProductionOrder.findByIdAndUpdate(
        jobId,
        { $set: updateFields },
        {
          new: true,
          arrayFilters: [{ 'stage.stageId': stageId }]
        }
      );

      return result;
    } catch (error) {
      console.error('Error in startProductionStage:', error);
      throw error;
    }
  }

  async completeProductionStage(params: any): Promise<any> {
    try {
      const { jobId, stageId, completedQuantity, qualityNotes, defectQuantity, completedBy } = params;

      const updateFields: any = {
        'productionStages.$[stage].status': 'completed',
        'productionStages.$[stage].timing.actualEndTime': new Date(),
        'productionStages.$[stage].output.producedQuantity': completedQuantity
      };

      if (qualityNotes) {
        updateFields['productionStages.$[stage].qualityControl.qualityNotes'] = qualityNotes;
      }

      if (defectQuantity) {
        updateFields['productionStages.$[stage].output.defectQuantity'] = defectQuantity;
      }

      if (completedBy) {
        updateFields['productionStages.$[stage].completedBy'] = completedBy;
      }

      const result = await ProductionOrder.findByIdAndUpdate(
        jobId,
        { $set: updateFields },
        {
          new: true,
          arrayFilters: [{ 'stage.stageId': stageId }]
        }
      );

      return result;
    } catch (error) {
      console.error('Error in completeProductionStage:', error);
      throw error;
    }
  }
}
