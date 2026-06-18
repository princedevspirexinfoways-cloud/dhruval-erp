import { Schema, model } from 'mongoose';
import { IElectricityMonitoring, IElectricityReading, IPowerQuality, IEnergyConsumption } from '@/types/models';

const ElectricityReadingSchema = new Schema<IElectricityReading>({
  readingTime: { type: Date, required: true, default: Date.now },
  voltage: {
    r: { type: Number, required: true, min: 0, max: 500 }, // Phase R voltage
    y: { type: Number, required: true, min: 0, max: 500 }, // Phase Y voltage
    b: { type: Number, required: true, min: 0, max: 500 }, // Phase B voltage
    avg: { type: Number, required: true, min: 0, max: 500 } // Average voltage
  },
  current: {
    r: { type: Number, required: true, min: 0, max: 10000 }, // Phase R current (Amperes)
    y: { type: Number, required: true, min: 0, max: 10000 }, // Phase Y current
    b: { type: Number, required: true, min: 0, max: 10000 }, // Phase B current
    neutral: { type: Number, default: 0, min: 0, max: 1000 } // Neutral current
  },
  power: {
    activePower: { type: Number, required: true, min: 0 }, // kW
    reactivePower: { type: Number, default: 0 }, // kVAR
    apparentPower: { type: Number, required: true, min: 0 }, // kVA
    powerFactor: { type: Number, required: true, min: 0, max: 1 }
  },
  energy: {
    activeEnergy: { type: Number, required: true, min: 0 }, // kWh (cumulative)
    reactiveEnergy: { type: Number, default: 0, min: 0 }, // kVARh (cumulative)
    apparentEnergy: { type: Number, default: 0, min: 0 } // kVAh (cumulative)
  },
  frequency: { type: Number, required: true, min: 45, max: 65 }, // Hz
  temperature: { type: Number, min: -50, max: 150 }, // Celsius (equipment temperature)
  humidity: { type: Number, min: 0, max: 100 }, // Percentage
  meterReading: { type: Number, min: 0 }, // Manual meter reading
  operatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName: { type: String },
  shift: { type: String, enum: ['morning', 'afternoon', 'night'], required: true },
  notes: { type: String },
  isAutomatic: { type: Boolean, default: false },
  meterId: { type: String },
  status: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' }
}, { _id: false });

const PowerQualitySchema = new Schema<IPowerQuality>({
  measurementTime: { type: Date, required: true, default: Date.now },
  voltageUnbalance: { type: Number, min: 0, max: 100 }, // Percentage
  currentUnbalance: { type: Number, min: 0, max: 100 }, // Percentage
  totalHarmonicDistortion: {
    voltage: { type: Number, min: 0, max: 100 }, // THD-V percentage
    current: { type: Number, min: 0, max: 100 } // THD-I percentage
  },
  flickerSeverity: {
    shortTerm: { type: Number, min: 0, max: 10 }, // Pst
    longTerm: { type: Number, min: 0, max: 10 } // Plt
  },
  voltageVariation: {
    sag: { type: Number, default: 0 }, // Count of voltage sags
    swell: { type: Number, default: 0 }, // Count of voltage swells
    interruption: { type: Number, default: 0 } // Count of interruptions
  },
  powerQualityIndex: { type: Number, min: 0, max: 100 }, // Overall power quality score
  complianceStatus: { type: String, enum: ['compliant', 'non_compliant', 'marginal'], default: 'compliant' }
}, { _id: false });

const EnergyConsumptionSchema = new Schema<IEnergyConsumption>({
  period: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  consumption: {
    activeEnergy: { type: Number, required: true, min: 0 }, // kWh
    reactiveEnergy: { type: Number, default: 0, min: 0 }, // kVARh
    maxDemand: { type: Number, required: true, min: 0 }, // kW
    avgDemand: { type: Number, required: true, min: 0 }, // kW
    loadFactor: { type: Number, min: 0, max: 1 } // Load factor
  },
  cost: {
    energyCharges: { type: Number, default: 0, min: 0 },
    demandCharges: { type: Number, default: 0, min: 0 },
    powerFactorPenalty: { type: Number, default: 0 },
    totalCost: { type: Number, required: true, min: 0 }
  },
  tariffRate: { type: Number, min: 0 }, // Rate per kWh
  peakHours: { type: Number, default: 0, min: 0 }, // Hours in peak period
  offPeakHours: { type: Number, default: 0, min: 0 } // Hours in off-peak period
}, { _id: false });

const ElectricityMonitoringSchema = new Schema<IElectricityMonitoring>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Monitoring Point Identification
  monitoringId: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  monitoringName: { 
    type: String, 
    required: true,
    trim: true
  },
  location: { type: String, required: true },
  description: { type: String },

  // Electrical System Details
  systemDetails: {
    connectionType: { type: String, enum: ['3_phase_4_wire', '3_phase_3_wire', '1_phase_2_wire'], required: true },
    ratedVoltage: { type: Number, required: true, min: 0 }, // Volts
    ratedCurrent: { type: Number, required: true, min: 0 }, // Amperes
    ratedPower: { type: Number, required: true, min: 0 }, // kW
    frequency: { type: Number, default: 50, min: 45, max: 65 }, // Hz
    transformerRating: { type: Number, min: 0 }, // kVA
    panelType: { type: String, enum: ['main', 'sub', 'distribution', 'control'], required: true },
    feedFrom: { type: String }, // Source of power supply
    suppliesTo: [String] // What this panel supplies power to
  },

  // Metering Equipment
  meteringEquipment: {
    meterType: { type: String, enum: ['analog', 'digital', 'smart', 'ct_pt'], required: true },
    meterMake: { type: String, required: true },
    meterModel: { type: String, required: true },
    meterSerialNumber: { type: String, required: true },
    installationDate: { type: Date, required: true },
    lastCalibration: { type: Date },
    nextCalibration: { type: Date },
    ctRatio: { type: String }, // Current Transformer ratio (e.g., "100:5")
    ptRatio: { type: String }, // Potential Transformer ratio (e.g., "11000:110")
    accuracy: { type: Number, min: 0, max: 5 }, // Accuracy class
    communicationProtocol: { type: String, enum: ['modbus', 'profibus', 'ethernet', 'rs485', 'wireless'] }
  },

  // Operating Limits & Thresholds
  operatingLimits: {
    voltage: { min: Number, max: Number },
    current: { min: Number, max: Number },
    power: { min: Number, max: Number },
    powerFactor: { min: Number, max: Number },
    frequency: { min: Number, max: Number },
    temperature: { min: Number, max: Number }
  },

  // Current Status
  currentStatus: {
    isOnline: { type: Boolean, default: true },
    operatingMode: { type: String, enum: ['normal', 'maintenance', 'fault', 'offline'], default: 'normal' },
    lastReading: ElectricityReadingSchema,
    currentLoad: { type: Number, min: 0, max: 100 }, // Percentage of rated capacity
    powerStatus: { type: String, enum: ['on', 'off', 'tripped', 'fault'], default: 'on' },
    alarmStatus: { type: String, enum: ['normal', 'warning', 'alarm', 'critical'], default: 'normal' },
    lastCommunication: { type: Date, default: Date.now }
  },

  // Monitoring Data
  readings: [ElectricityReadingSchema],
  powerQuality: [PowerQualitySchema],
  energyConsumption: [EnergyConsumptionSchema],

  // Performance Metrics
  performance: {
    avgPowerFactor: { type: Number, default: 0, min: 0, max: 1 },
    avgLoad: { type: Number, default: 0, min: 0, max: 100 }, // Percentage
    peakDemand: { type: Number, default: 0, min: 0 }, // kW
    energyEfficiency: { type: Number, default: 0, min: 0, max: 100 }, // Percentage
    uptime: { type: Number, default: 0, min: 0, max: 100 }, // Percentage
    totalEnergyConsumed: { type: Number, default: 0, min: 0 }, // kWh
    totalEnergyCost: { type: Number, default: 0, min: 0 },
    co2Emissions: { type: Number, default: 0, min: 0 }, // kg CO2
    lastCalculated: { type: Date, default: Date.now }
  },

  // Tariff & Billing
  tariffStructure: {
    tariffType: { type: String, enum: ['flat', 'tod', 'seasonal', 'demand'], required: true },
    energyRate: { type: Number, required: true, min: 0 }, // Rate per kWh
    demandRate: { type: Number, default: 0, min: 0 }, // Rate per kW
    fixedCharges: { type: Number, default: 0, min: 0 },
    powerFactorIncentive: { type: Number, default: 0 },
    powerFactorPenalty: { type: Number, default: 0 },
    peakHours: [{ start: String, end: String }],
    offPeakHours: [{ start: String, end: String }],
    seasonalRates: [{
      season: { type: String, enum: ['summer', 'winter', 'monsoon'] },
      startMonth: { type: Number, min: 1, max: 12 },
      endMonth: { type: Number, min: 1, max: 12 },
      rate: { type: Number, min: 0 }
    }]
  },

  // Alerts & Alarms
  alerts: [{
    alertTime: { type: Date, required: true, default: Date.now },
    alertType: { 
      type: String, 
      enum: ['voltage_high', 'voltage_low', 'current_high', 'overload', 'power_factor_low', 'frequency_deviation', 'phase_failure', 'earth_fault', 'communication_loss', 'meter_error'], 
      required: true 
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    parameter: { type: String, required: true },
    currentValue: { type: Number, required: true },
    thresholdValue: { type: Number, required: true },
    unit: { type: String, required: true },
    description: { type: String, required: true },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    status: { type: String, enum: ['active', 'acknowledged', 'resolved'], default: 'active' }
  }],

  // Maintenance & Calibration
  maintenance: {
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    maintenanceInterval: { type: Number, default: 90 }, // days
    maintenanceRecords: [{
      date: { type: Date, required: true },
      type: { type: String, enum: ['preventive', 'corrective', 'calibration'], required: true },
      description: { type: String, required: true },
      technician: { type: String, required: true },
      cost: { type: Number, min: 0 },
      downtime: { type: Number, min: 0 }, // hours
      notes: { type: String }
    }]
  },

  // Load Management
  loadManagement: {
    loadShedding: {
      isEnabled: { type: Boolean, default: false },
      priority: { type: Number, min: 1, max: 10 }, // 1 = highest priority
      sheddingThreshold: { type: Number, min: 0 }, // kW
      restoreThreshold: { type: Number, min: 0 }, // kW
      sheddingDelay: { type: Number, default: 0 }, // seconds
      restoreDelay: { type: Number, default: 0 } // seconds
    },
    demandControl: {
      isEnabled: { type: Boolean, default: false },
      targetDemand: { type: Number, min: 0 }, // kW
      controlMethod: { type: String, enum: ['load_shedding', 'generator_start', 'capacitor_switching'] }
    }
  },

  // Environmental Impact
  environmental: {
    carbonFootprint: { type: Number, default: 0, min: 0 }, // kg CO2 per kWh
    renewableEnergyPercentage: { type: Number, default: 0, min: 0, max: 100 },
    energyIntensity: { type: Number, default: 0, min: 0 }, // kWh per unit of production
    greenCertificates: { type: Number, default: 0, min: 0 }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to electrical drawings, certificates

  // Tracking & Audit
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  electricianInCharge: { type: Schema.Types.ObjectId, ref: 'User' },
  supervisorId: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'electricity_monitoring'
});

// Compound Indexes
ElectricityMonitoringSchema.index({ companyId: 1, monitoringId: 1 }, { unique: true });
ElectricityMonitoringSchema.index({ companyId: 1, location: 1 });
ElectricityMonitoringSchema.index({ companyId: 1, 'currentStatus.isOnline': 1 });
ElectricityMonitoringSchema.index({ companyId: 1, 'readings.readingTime': -1 });

// Text search index
ElectricityMonitoringSchema.index({ 
  monitoringName: 'text', 
  monitoringId: 'text',
  location: 'text'
});

// Pre-save middleware
ElectricityMonitoringSchema.pre('save', function(next) {
  // Update performance metrics when readings are added
  if (this.isModified('readings') && this.readings.length > 0) {
    const recentReadings = this.readings.slice(-100); // Last 100 readings
    
    this.performance.avgPowerFactor = recentReadings.reduce((sum, reading) => sum + reading.power.powerFactor, 0) / recentReadings.length;
    this.performance.avgLoad = recentReadings.reduce((sum, reading) => sum + ((reading.power.activePower / this.systemDetails.ratedPower) * 100), 0) / recentReadings.length;
    this.performance.lastCalculated = new Date();
  }
  
  // Update current status with latest reading
  if (this.readings.length > 0) {
    this.currentStatus.lastReading = this.readings[this.readings.length - 1];
    this.currentStatus.lastCommunication = new Date();
  }
  
  next();
});

// Instance methods
ElectricityMonitoringSchema.methods.addReading = function(readingData: any) {
  this.readings.push(readingData);
  
  // Keep only last 1000 readings to manage document size
  if (this.readings.length > 1000) {
    this.readings = this.readings.slice(-1000);
  }
  
  return this.save();
};

ElectricityMonitoringSchema.methods.getCurrentLoad = function(): number {
  if (this.readings.length === 0) return 0;
  const lastReading = this.readings[this.readings.length - 1];
  return (lastReading.power.activePower / this.systemDetails.ratedPower) * 100;
};

ElectricityMonitoringSchema.methods.getActiveAlerts = function() {
  return this.alerts.filter(alert => alert.status === 'active');
};

ElectricityMonitoringSchema.methods.calculateEnergyCost = function(energyConsumed: number): number {
  const tariff = this.tariffStructure;
  let cost = energyConsumed * tariff.energyRate;
  
  // Add demand charges if applicable
  if (tariff.demandRate > 0 && this.performance.peakDemand > 0) {
    cost += this.performance.peakDemand * tariff.demandRate;
  }
  
  // Add fixed charges
  cost += tariff.fixedCharges;
  
  return cost;
};

// Static methods
ElectricityMonitoringSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

ElectricityMonitoringSchema.statics.findOnlineMonitors = function(companyId: string) {
  return this.find({ 
    companyId, 
    'currentStatus.isOnline': true,
    isActive: true 
  });
};

ElectricityMonitoringSchema.statics.getEnergyStats = function(companyId: string) {
  return this.aggregate([
    { $match: { companyId: new Schema.Types.ObjectId(companyId), isActive: true } },
    {
      $group: {
        _id: '$systemDetails.panelType',
        count: { $sum: 1 },
        totalRatedPower: { $sum: '$systemDetails.ratedPower' },
        totalEnergyConsumed: { $sum: '$performance.totalEnergyConsumed' },
        avgPowerFactor: { $avg: '$performance.avgPowerFactor' },
        onlineCount: { 
          $sum: { $cond: ['$currentStatus.isOnline', 1, 0] } 
        }
      }
    }
  ]);
};

export default model<IElectricityMonitoring>('ElectricityMonitoring', ElectricityMonitoringSchema);
