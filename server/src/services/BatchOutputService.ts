import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { ProductionBatch } from '../models/ProductionBatch';
import InventoryItem from '../models/InventoryItem';
import GreyFabricInward from '../models/GreyFabricInward';

export class BatchOutputService {
  
  /**
   * Convert batch output to inventory item with elongation tracking
   */
  async convertBatchOutputToInventory(
    batchId: string,
    outputIndex: number,
    elongationData?: {
      inputQuantity: number;
      inputUnit: string;
      outputQuantity: number;
      outputUnit: string;
      elongationReason: string;
      elongationNotes?: string;
      qualityImpact: string;
      approvedBy: string;
    },
    clientOutputData?: {
      returnToClient: boolean;
      returnQuantity?: number;
      keepAsStock: boolean;
      stockQuantity?: number;
      clientInstructions?: string;
    }
  ): Promise<any> {
    try {
      // Find the batch
      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      // Validate output index
      if (outputIndex < 0 || outputIndex >= batch.outputMaterials.length) {
        throw new AppError('Invalid output index', 400);
      }

      const batchOutput = batch.outputMaterials[outputIndex];
      
      // Calculate elongation if provided
      let elongationInfo = null;
      if (elongationData) {
        const elongation = batch.calculateElongation(
          elongationData.inputQuantity,
          elongationData.outputQuantity,
          elongationData.inputUnit,
          elongationData.outputUnit
        );
        
        elongationInfo = {
          ...elongationData,
          ...elongation
        };
        
        // Add elongation tracking to batch
        await batch.addElongationTracking(outputIndex, elongationData);
      }

      // Get GRN and client information from input materials
      const grnInfo = this.extractGRNInfoFromBatch(batch);
      const clientInfo = this.extractClientInfoFromBatch(batch);

      // Prepare batch info
      const batchInfo = {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        outputIndex: outputIndex,
        companyId: batch.companyId,
        createdBy: batch.createdBy,
        grnId: grnInfo?.grnId,
        grnNumber: grnInfo?.grnNumber,
        materialSource: grnInfo?.materialSource,
        producedBy: batch.createdBy
      };

      // Create inventory item from batch output
      const inventoryItem = await InventoryItem.createInventoryFromBatchOutput(
        batchOutput,
        batchInfo,
        elongationInfo,
        clientInfo
      );

      // Update client output decision if provided
      if (clientOutputData && clientInfo) {
        await (inventoryItem as any).updateClientOutputDecision(
          clientOutputData.returnToClient,
          clientOutputData.returnQuantity || 0,
          clientOutputData.keepAsStock,
          clientOutputData.stockQuantity || 0,
          clientOutputData.clientInstructions
        );

        // Update batch client output tracking
        await batch.updateClientMaterialOutput(outputIndex, clientOutputData);
      }

      // Update GRN with production output if it's client material
      if (grnInfo?.grnId && grnInfo?.materialSource === 'client_provided') {
        await this.updateGRNWithProductionOutput(
          grnInfo.grnId,
          batch._id,
          batch.batchNumber,
          elongationInfo?.outputQuantity || batchOutput.quantity,
          batchOutput.unit,
          batchOutput.category,
          batchOutput.qualityGrade || 'A'
        );
      }

      logger.info('Batch output converted to inventory successfully', {
        batchId,
        batchNumber: batch.batchNumber,
        outputIndex,
        inventoryItemId: inventoryItem._id,
        elongationPercentage: elongationInfo?.elongationPercentage,
        clientMaterial: !!clientInfo
      });

      return {
        inventoryItem,
        elongationInfo,
        clientInfo,
        batchInfo
      };

    } catch (error) {
      logger.error('Error converting batch output to inventory', {
        batchId,
        outputIndex,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Extract GRN information from batch input materials
   */
  private extractGRNInfoFromBatch(batch: any): any {
    const grnMaterial = batch.inputMaterials.find((m: any) => m.grnId && m.grnNumber);
    
    if (grnMaterial) {
      return {
        grnId: grnMaterial.grnId,
        grnNumber: grnMaterial.grnNumber,
        materialSource: grnMaterial.materialSource,
        clientId: grnMaterial.clientId,
        clientName: grnMaterial.clientName,
        clientOrderId: grnMaterial.clientOrderId,
        clientOrderNumber: grnMaterial.clientOrderNumber
      };
    }
    
    return null;
  }

  /**
   * Extract client information from batch input materials
   */
  private extractClientInfoFromBatch(batch: any): any {
    const clientMaterial = batch.inputMaterials.find((m: any) => m.materialSource === 'client_provided');
    
    if (clientMaterial) {
      return {
        clientId: clientMaterial.clientId,
        clientName: clientMaterial.clientName,
        clientOrderId: clientMaterial.clientOrderId,
        clientOrderNumber: clientMaterial.clientOrderNumber,
        grnId: clientMaterial.grnId,
        grnNumber: clientMaterial.grnNumber
      };
    }
    
    return null;
  }

  /**
   * Update GRN with production output information
   */
  private async updateGRNWithProductionOutput(
    grnId: string,
    productionOrderId: string,
    productionOrderNumber: string,
    outputQuantity: number,
    outputUnit: string,
    outputType: string,
    qualityGrade: string
  ): Promise<void> {
    try {
      const grn = await GreyFabricInward.findById(grnId);
      if (!grn) {
        logger.warn('GRN not found for production output update', { grnId });
        return;
      }

      if (grn.materialSource !== 'client_provided') {
        logger.warn('GRN is not client-provided material', { grnId, materialSource: grn.materialSource });
        return;
      }

      const outputData = {
        productionOrderId: productionOrderId,
        productionOrderNumber: productionOrderNumber,
        outputQuantity: outputQuantity,
        outputUnit: outputUnit,
        outputType: outputType,
        outputDate: new Date(),
        qualityGrade: qualityGrade,
        outputStatus: 'pending',
        notes: 'Production output from batch'
      };

      await grn.addProductionOutput(outputData);

      logger.info('GRN updated with production output', {
        grnId,
        grnNumber: grn.grnNumber,
        productionOrderId,
        outputQuantity,
        outputType
      });

    } catch (error) {
      logger.error('Error updating GRN with production output', {
        grnId,
        productionOrderId,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Get batch output summary with elongation and client info
   */
  async getBatchOutputSummary(batchId: string): Promise<any> {
    try {
      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      const grnInfo = this.extractGRNInfoFromBatch(batch);
      const clientInfo = this.extractClientInfoFromBatch(batch);

      return {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        status: batch.status,
        progress: batch.progress,
        grnInfo,
        clientInfo,
        outputs: batch.outputMaterials.map((output: any, index: number) => ({
          index,
          itemName: output.itemName,
          quantity: output.quantity,
          unit: output.unit,
          category: output.category,
          qualityGrade: output.qualityGrade,
          elongationInfo: output.elongationTracking,
          clientOutputInfo: output.clientOutputTracking,
          status: output.status
        })),
        clientMaterialSummary: batch.getClientMaterialSummary()
      };

    } catch (error) {
      logger.error('Error getting batch output summary', {
        batchId,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Map material to GRN in batch
   */
  async mapMaterialToGRN(
    batchId: string,
    materialIndex: number,
    grnId: string,
    grnNumber: string,
    materialSource: string,
    clientInfo?: any
  ): Promise<any> {
    try {
      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      await batch.mapMaterialToGRN(materialIndex, grnId, grnNumber, materialSource, clientInfo);

      logger.info('Material mapped to GRN in batch', {
        batchId,
        batchNumber: batch.batchNumber,
        materialIndex,
        grnId,
        grnNumber,
        materialSource
      });

      return batch;

    } catch (error) {
      logger.error('Error mapping material to GRN', {
        batchId,
        materialIndex,
        grnId,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Get available GRNs for mapping
   */
  async getAvailableGRNs(companyId: string, materialSource?: string): Promise<any[]> {
    try {
      const query: any = { companyId };
      
      if (materialSource) {
        query.materialSource = materialSource;
      }

      const grns = await GreyFabricInward.find(query)
        .select('grnNumber materialSource fabricDetails quantity status clientMaterialInfo')
        .populate('clientMaterialInfo.clientId', 'name email')
        .sort({ createdAt: -1 });

      return grns.map(grn => ({
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        materialSource: grn.materialSource,
        fabricDetails: grn.fabricDetails,
        quantity: grn.quantity,
        status: grn.status,
        clientInfo: grn.materialSource === 'client_provided' ? {
          clientId: grn.clientMaterialInfo?.clientId,
          clientName: grn.clientMaterialInfo?.clientName,
          clientOrderNumber: grn.clientMaterialInfo?.clientOrderNumber
        } : null
      }));

    } catch (error) {
      logger.error('Error getting available GRNs', {
        companyId,
        materialSource,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }
}

export default BatchOutputService;
