// Base Service
export { BaseService } from './BaseService';

// Core Services
export { CompanyService } from './CompanyService';
export { UserService } from './UserService';
export { VisitorService } from './VisitorService';

// Business Services
export { CustomerService } from './CustomerService';
export { SupplierService } from './SupplierService';
export { InventoryService } from './InventoryService';
export { StockMovementService } from './StockMovementService';
export { ProductionService } from './ProductionService';
export { CustomerOrderService } from './CustomerOrderService';
export { PurchaseOrderService } from './PurchaseOrderService';
export { InvoiceService } from './InvoiceService';
export { QuotationService } from './QuotationService';
export { WarehouseService } from './WarehouseService';
export { VehicleService } from './VehicleService';
export { RoleService } from './RoleService';
export { FinancialTransactionService } from './FinancialTransactionService';
export { AuditLogService } from './AuditLogService';
export { SecurityLogService } from './SecurityLogService';
export { BusinessAnalyticsService } from './BusinessAnalyticsService';
export { BoilerMonitoringService } from './BoilerMonitoringService';
export { ElectricityMonitoringService } from './ElectricityMonitoringService';
export { HospitalityService } from './HospitalityService';
export { DispatchService } from './DispatchService';
export { ReportService } from './ReportService';
export { SpareService } from './SpareService';

// Service Factory for dependency injection
import { CompanyService } from './CompanyService';
import { UserService } from './UserService';
import { VisitorService } from './VisitorService';
import { CustomerService } from './CustomerService';
import { SupplierService } from './SupplierService';
import { InventoryService } from './InventoryService';
import { StockMovementService } from './StockMovementService';
import { ProductionService } from './ProductionService';
import { CustomerOrderService } from './CustomerOrderService';
import { PurchaseOrderService } from './PurchaseOrderService';
import { InvoiceService } from './InvoiceService';
import { QuotationService } from './QuotationService';
import { WarehouseService } from './WarehouseService';
import { VehicleService } from './VehicleService';
import { RoleService } from './RoleService';
import { FinancialTransactionService } from './FinancialTransactionService';
import { AuditLogService } from './AuditLogService';
import { SecurityLogService } from './SecurityLogService';
import { BusinessAnalyticsService } from './BusinessAnalyticsService';
import { BoilerMonitoringService } from './BoilerMonitoringService';
import { ElectricityMonitoringService } from './ElectricityMonitoringService';
import { HospitalityService } from './HospitalityService';
import { DispatchService } from './DispatchService';
import { ReportService } from './ReportService';

export class ServiceFactory {
  private static instances: Map<string, any> = new Map();

  /**
   * Get service instance (singleton pattern)
   */
  static getService<T>(ServiceClass: new () => T): T {
    const serviceName = ServiceClass.name;
    
    if (!this.instances.has(serviceName)) {
      this.instances.set(serviceName, new ServiceClass());
    }
    
    return this.instances.get(serviceName);
  }

  /**
   * Get Company Service
   */
  static getCompanyService(): CompanyService {
    return this.getService(CompanyService);
  }

  /**
   * Get User Service
   */
  static getUserService(): UserService {
    return this.getService(UserService);
  }

  /**
   * Get Visitor Service
   */
  static getVisitorService(): VisitorService {
    return this.getService(VisitorService);
  }

  /**
   * Get Customer Service
   */
  static getCustomerService(): CustomerService {
    return this.getService(CustomerService);
  }

  /**
   * Get Supplier Service
   */
  static getSupplierService(): SupplierService {
    return this.getService(SupplierService);
  }

  /**
   * Get Inventory Service
   */
  static getInventoryService(): InventoryService {
    return this.getService(InventoryService);
  }

  /**
   * Get Stock Movement Service
   */
  static getStockMovementService(): StockMovementService {
    return this.getService(StockMovementService);
  }

  /**
   * Get Production Service
   */
  static getProductionService(): ProductionService {
    return this.getService(ProductionService);
  }

  /**
   * Get Customer Order Service
   */
  static getCustomerOrderService(): CustomerOrderService {
    return this.getService(CustomerOrderService);
  }

  /**
   * Get Purchase Order Service
   */
  static getPurchaseOrderService(): PurchaseOrderService {
    return this.getService(PurchaseOrderService);
  }

  /**
   * Get Invoice Service
   */
  static getInvoiceService(): InvoiceService {
    return this.getService(InvoiceService);
  }

  /**
   * Get Quotation Service
   */
  static getQuotationService(): QuotationService {
    return this.getService(QuotationService);
  }

  /**
   * Get Warehouse Service
   */
  static getWarehouseService(): WarehouseService {
    return this.getService(WarehouseService);
  }

  /**
   * Get Vehicle Service
   */
  static getVehicleService(): VehicleService {
    return this.getService(VehicleService);
  }

  /**
   * Get Role Service
   */
  static getRoleService(): RoleService {
    return this.getService(RoleService);
  }

  /**
   * Get Financial Transaction Service
   */
  static getFinancialTransactionService(): FinancialTransactionService {
    return this.getService(FinancialTransactionService);
  }

  /**
   * Get Audit Log Service
   */
  static getAuditLogService(): AuditLogService {
    return this.getService(AuditLogService);
  }

  /**
   * Get Security Log Service
   */
  static getSecurityLogService(): SecurityLogService {
    return this.getService(SecurityLogService);
  }

  /**
   * Get Business Analytics Service
   */
  static getBusinessAnalyticsService(): BusinessAnalyticsService {
    return this.getService(BusinessAnalyticsService);
  }

  /**
   * Get Boiler Monitoring Service
   */
  static getBoilerMonitoringService(): BoilerMonitoringService {
    return this.getService(BoilerMonitoringService);
  }

  /**
   * Get Electricity Monitoring Service
   */
  static getElectricityMonitoringService(): ElectricityMonitoringService {
    return this.getService(ElectricityMonitoringService);
  }

  /**
   * Get Hospitality Service
   */
  static getHospitalityService(): HospitalityService {
    return this.getService(HospitalityService);
  }

  /**
   * Get Dispatch Service
   */
  static getDispatchService(): DispatchService {
    return this.getService(DispatchService);
  }

  /**
   * Get Report Service
   */
  static getReportService(): ReportService {
    return this.getService(ReportService);
  }

  // TODO: Enable after creating Mongoose models
  /*

  static getAuditLogService(): AuditLogService {
    return this.getService(AuditLogService);
  }

  static getSecurityLogService(): SecurityLogService {
    return this.getService(SecurityLogService);
  }

  static getBusinessAnalyticsService(): BusinessAnalyticsService {
    return this.getService(BusinessAnalyticsService);
  }

  static getBoilerMonitoringService(): BoilerMonitoringService {
    return this.getService(BoilerMonitoringService);
  }

  static getElectricityMonitoringService(): ElectricityMonitoringService {
    return this.getService(ElectricityMonitoringService);
  }

  static getHospitalityService(): HospitalityService {
    return this.getService(HospitalityService);
  }

  static getDispatchService(): DispatchService {
    return this.getService(DispatchService);
  }

  static getReportService(): ReportService {
    return this.getService(ReportService);
  }
  */

  /**
   * Clear all service instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

// Default export with all services
export default {
  CompanyService,
  UserService,
  VisitorService,
  CustomerService,
  SupplierService,
  InventoryService,
  StockMovementService,
  ProductionService,
  CustomerOrderService,
  PurchaseOrderService,
  InvoiceService,
  QuotationService,
  WarehouseService,
  VehicleService,
  RoleService,
  FinancialTransactionService,
  AuditLogService,
  SecurityLogService,
  BusinessAnalyticsService,
  BoilerMonitoringService,
  ElectricityMonitoringService,
  HospitalityService,
  DispatchService,
  ReportService,
  ServiceFactory
};
