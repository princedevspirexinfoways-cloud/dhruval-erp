// Base Controller
export { BaseController } from './BaseController';

// Core Controllers
export { CompanyController } from './CompanyController';
export { UserController } from './UserController';
export { VisitorController } from './VisitorController';

// Business Controllers
export { CustomerController } from './CustomerController';
export { SupplierController } from './SupplierController';
export { InventoryController } from './InventoryController';
export { ProductionController } from './ProductionController';
export { CustomerOrderController } from './CustomerOrderController';
export { InvoiceController } from './InvoiceController';
export { PurchaseOrderController } from './PurchaseOrderController';
export { QuotationController } from './QuotationController';
export { RoleController } from './RoleController';
export { VehicleController } from './VehicleController';
export { WarehouseController } from './WarehouseController';
export { StockMovementController } from './StockMovementController';
export { FinancialTransactionController } from './FinancialTransactionController';
export { AuditLogController } from './AuditLogController';
export { SecurityLogController } from './SecurityLogController';
export { BusinessAnalyticsController } from './BusinessAnalyticsController';
export { BoilerMonitoringController } from './BoilerMonitoringController';
export { ElectricityMonitoringController } from './ElectricityMonitoringController';
export { HospitalityController } from './HospitalityController';
export { DispatchController } from './DispatchController';
export { ReportController } from './ReportController';
export { SpareController } from './SpareController';

// Controller Factory for dependency injection
import { CompanyController } from './CompanyController';
import { UserController } from './UserController';
import { VisitorController } from './VisitorController';
import { CustomerController } from './CustomerController';
import { SupplierController } from './SupplierController';
import { InventoryController } from './InventoryController';
import { ProductionController } from './ProductionController';
import { CustomerOrderController } from './CustomerOrderController';
import { InvoiceController } from './InvoiceController';
import { PurchaseOrderController } from './PurchaseOrderController';
import { QuotationController } from './QuotationController';
import { RoleController } from './RoleController';
import { VehicleController } from './VehicleController';
import { WarehouseController } from './WarehouseController';
import { StockMovementController } from './StockMovementController';
import { FinancialTransactionController } from './FinancialTransactionController';
import { AuditLogController } from './AuditLogController';
import { SecurityLogController } from './SecurityLogController';
import { BusinessAnalyticsController } from './BusinessAnalyticsController';
import { BoilerMonitoringController } from './BoilerMonitoringController';
import { ElectricityMonitoringController } from './ElectricityMonitoringController';
import { HospitalityController } from './HospitalityController';
import { DispatchController } from './DispatchController';
import { ReportController } from './ReportController';

export class ControllerFactory {
  private static instances: Map<string, any> = new Map();

  /**
   * Get controller instance (singleton pattern)
   */
  static getController<T>(ControllerClass: new () => T): T {
    const controllerName = ControllerClass.name;
    
    if (!this.instances.has(controllerName)) {
      this.instances.set(controllerName, new ControllerClass());
    }
    
    return this.instances.get(controllerName);
  }

  /**
   * Get Company Controller
   */
  static getCompanyController(): CompanyController {
    return this.getController(CompanyController);
  }

  /**
   * Get User Controller
   */
  static getUserController(): UserController {
    return this.getController(UserController);
  }

  /**
   * Get Visitor Controller
   */
  static getVisitorController(): VisitorController {
    return this.getController(VisitorController);
  }

  /**
   * Get Customer Controller
   */
  static getCustomerController(): CustomerController {
    return this.getController(CustomerController);
  }

  /**
   * Get Supplier Controller
   */
  static getSupplierController(): SupplierController {
    return this.getController(SupplierController);
  }

  /**
   * Get Inventory Controller
   */
  static getInventoryController(): InventoryController {
    return this.getController(InventoryController);
  }

  /**
   * Get Production Controller
   */
  static getProductionController(): ProductionController {
    return this.getController(ProductionController);
  }

  /**
   * Get Customer Order Controller
   */
  static getCustomerOrderController(): CustomerOrderController {
    return this.getController(CustomerOrderController);
  }

  /**
   * Get Invoice Controller
   */
  static getInvoiceController(): InvoiceController {
    return this.getController(InvoiceController);
  }

  /**
   * Get Purchase Order Controller
   */
  static getPurchaseOrderController(): PurchaseOrderController {
    return this.getController(PurchaseOrderController);
  }

  /**
   * Get Quotation Controller
   */
  static getQuotationController(): QuotationController {
    return this.getController(QuotationController);
  }

  /**
   * Get Role Controller
   */
  static getRoleController(): RoleController {
    return this.getController(RoleController);
  }

  /**
   * Get Vehicle Controller
   */
  static getVehicleController(): VehicleController {
    return this.getController(VehicleController);
  }

  /**
   * Get Warehouse Controller
   */
  static getWarehouseController(): WarehouseController {
    return this.getController(WarehouseController);
  }

  /**
   * Get Stock Movement Controller
   */
  static getStockMovementController(): StockMovementController {
    return this.getController(StockMovementController);
  }

  /**
   * Get Financial Transaction Controller
   */
  static getFinancialTransactionController(): FinancialTransactionController {
    return this.getController(FinancialTransactionController);
  }

  /**
   * Get Audit Log Controller
   */
  static getAuditLogController(): AuditLogController {
    return this.getController(AuditLogController);
  }

  /**
   * Get Security Log Controller
   */
  static getSecurityLogController(): SecurityLogController {
    return this.getController(SecurityLogController);
  }

  /**
   * Get Business Analytics Controller
   */
  static getBusinessAnalyticsController(): BusinessAnalyticsController {
    return this.getController(BusinessAnalyticsController);
  }

  /**
   * Get Boiler Monitoring Controller
   */
  static getBoilerMonitoringController(): BoilerMonitoringController {
    return this.getController(BoilerMonitoringController);
  }

  /**
   * Get Electricity Monitoring Controller
   */
  static getElectricityMonitoringController(): ElectricityMonitoringController {
    return this.getController(ElectricityMonitoringController);
  }

  /**
   * Get Hospitality Controller
   */
  static getHospitalityController(): HospitalityController {
    return this.getController(HospitalityController);
  }

  /**
   * Get Dispatch Controller
   */
  static getDispatchController(): DispatchController {
    return this.getController(DispatchController);
  }

  /**
   * Get Report Controller
   */
  static getReportController(): ReportController {
    return this.getController(ReportController);
  }

  /**
   * Clear all controller instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

// Default export with all controllers
export default {
  CompanyController,
  UserController,
  VisitorController,
  CustomerController,
  SupplierController,
  InventoryController,
  ProductionController,
  CustomerOrderController,
  InvoiceController,
  PurchaseOrderController,
  QuotationController,
  RoleController,
  VehicleController,
  WarehouseController,
  StockMovementController,
  FinancialTransactionController,
  AuditLogController,
  SecurityLogController,
  BusinessAnalyticsController,
  BoilerMonitoringController,
  ElectricityMonitoringController,
  HospitalityController,
  DispatchController,
  ReportController,
  ControllerFactory
};
