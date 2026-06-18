const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const ProductionOrder = require('../src/models/ProductionOrder').default;
const Customer = require('../src/models/Customer').default;
const User = require('../src/models/User').default;
const Company = require('../src/models/Company').default;

async function createSampleProductionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get sample company
    const company = await Company.findOne();
    if (!company) {
      console.log('No company found. Please create a company first.');
      return;
    }

    // Get sample customer
    const customer = await Customer.findOne({ companyId: company._id });
    if (!customer) {
      console.log('No customer found. Please create a customer first.');
      return;
    }

    // Get sample users (operators)
    const operators = await User.find({ companyId: company._id }).limit(5);

    // Sample production orders with real-time data
    const sampleOrders = [
      {
        productionOrderNumber: 'PO-2024-001',
        orderDate: new Date(),
        customerId: customer._id,
        customerName: customer.name,
        companyId: company._id,
        product: {
          productType: 'saree',
          design: 'Floral Pattern',
          designCode: 'FLR-001',
          color: 'Red',
          colorCode: 'RED-001',
          gsm: 120,
          width: 45,
          length: 5.5
        },
        orderQuantity: 100,
        unit: 'pieces',
        completedQuantity: 0,
        rejectedQuantity: 0,
        pendingQuantity: 100,
        priority: 'high',
        status: 'in_progress',
        productionStages: [
          {
            stageId: new mongoose.Types.ObjectId(),
            stageNumber: 1,
            stageName: 'Printing',
            processType: 'printing',
            status: 'in_progress',
            assignment: {
              workers: [
                {
                  workerId: operators[0]?._id,
                  workerName: operators[0]?.name || 'Ramesh Kumar',
                  role: 'Printer',
                  assignedAt: new Date(),
                  hoursWorked: 2,
                  hourlyRate: 150,
                  totalCost: 300
                }
              ],
              machines: [
                {
                  machineId: new mongoose.Types.ObjectId(),
                  machineName: 'Table Print Station 1',
                  assignedAt: new Date(),
                  hoursUsed: 2,
                  hourlyRate: 200,
                  totalCost: 400
                }
              ]
            },
            timing: {
              plannedStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              actualStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
              plannedEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
              plannedDuration: 4,
              actualDuration: 2,
              breakTime: 0,
              overtimeHours: 0
            },
            output: {
              producedQuantity: 65,
              unit: 'pieces',
              batchNumber: 'BATCH-2024-001'
            },
            costs: {
              materialCost: 5000,
              laborCost: 300,
              machineCost: 400,
              overheadCost: 200,
              jobWorkCost: 0,
              totalStageCost: 5900
            },
            notes: 'Printing in progress - Red floral design',
            instructions: 'Handle with care, maintain color consistency'
          },
          {
            stageId: new mongoose.Types.ObjectId(),
            stageNumber: 2,
            stageName: 'Washing',
            processType: 'washing',
            status: 'pending',
            assignment: {
              workers: [],
              machines: []
            },
            timing: {
              plannedStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
              plannedEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
              plannedDuration: 4
            },
            output: {
              producedQuantity: 0,
              unit: 'pieces'
            },
            costs: {
              materialCost: 0,
              laborCost: 0,
              machineCost: 0,
              overheadCost: 0,
              jobWorkCost: 0,
              totalStageCost: 0
            }
          },
          {
            stageId: new mongoose.Types.ObjectId(),
            stageNumber: 3,
            stageName: 'Finishing',
            processType: 'finishing',
            status: 'pending',
            assignment: {
              workers: [],
              machines: []
            },
            timing: {
              plannedStartTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
              plannedEndTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
              plannedDuration: 2
            },
            output: {
              producedQuantity: 0,
              unit: 'pieces'
            },
            costs: {
              materialCost: 0,
              laborCost: 0,
              machineCost: 0,
              overheadCost: 0,
              jobWorkCost: 0,
              totalStageCost: 0
            }
          }
        ],
        schedule: {
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
          actualStartDate: new Date(),
          estimatedDuration: 8,
          actualDuration: 2
        },
        costSummary: {
          materialCost: 5000,
          laborCost: 300,
          machineCost: 400,
          overheadCost: 200,
          jobWorkCost: 0,
          totalProductionCost: 5900,
          costPerUnit: 59
        },
        qualitySummary: {
          totalProduced: 65,
          totalApproved: 63,
          totalRejected: 2,
          totalRework: 0,
          overallQualityGrade: 'A',
          defectRate: 3.1,
          firstPassYield: 96.9
        },
        specialInstructions: 'Handle with care, maintain color consistency',
        customerRequirements: 'High quality finish required',
        packingInstructions: 'Pack in individual poly bags',
        deliveryInstructions: 'Deliver to customer warehouse',
        notes: 'Urgent order - customer needs by tomorrow',
        tags: ['urgent', 'saree', 'floral'],
        createdBy: operators[0]?._id
      },
      {
        productionOrderNumber: 'PO-2024-002',
        orderDate: new Date(),
        customerId: customer._id,
        customerName: customer.name,
        companyId: company._id,
        product: {
          productType: 'african_cotton',
          design: 'African Pattern',
          designCode: 'AFR-001',
          color: 'Blue',
          colorCode: 'BLU-001',
          gsm: 150,
          width: 60,
          length: 3
        },
        orderQuantity: 500,
        unit: 'meters',
        completedQuantity: 0,
        rejectedQuantity: 0,
        pendingQuantity: 500,
        priority: 'medium',
        status: 'in_progress',
        productionStages: [
          {
            stageId: new mongoose.Types.ObjectId(),
            stageNumber: 1,
            stageName: 'Printing',
            processType: 'printing',
            status: 'in_progress',
            assignment: {
              workers: [
                {
                  workerId: operators[1]?._id,
                  workerName: operators[1]?.name || 'Suresh Patel',
                  role: 'Printer',
                  assignedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                  hoursWorked: 1,
                  hourlyRate: 150,
                  totalCost: 150
                }
              ],
              machines: [
                {
                  machineId: new mongoose.Types.ObjectId(),
                  machineName: 'Digital Print Machine A',
                  assignedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                  hoursUsed: 1,
                  hourlyRate: 300,
                  totalCost: 300
                }
              ]
            },
            timing: {
              plannedStartTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
              actualStartTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
              plannedEndTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
              plannedDuration: 8,
              actualDuration: 1,
              breakTime: 0,
              overtimeHours: 0
            },
            output: {
              producedQuantity: 320,
              unit: 'meters',
              batchNumber: 'BATCH-2024-002'
            },
            costs: {
              materialCost: 15000,
              laborCost: 150,
              machineCost: 300,
              overheadCost: 100,
              jobWorkCost: 0,
              totalStageCost: 15550
            },
            notes: 'Digital printing in progress - Blue African pattern',
            instructions: 'Maintain print quality and color consistency'
          },
          {
            stageId: new mongoose.Types.ObjectId(),
            stageNumber: 2,
            stageName: 'Washing',
            processType: 'washing',
            status: 'pending',
            assignment: {
              workers: [],
              machines: []
            },
            timing: {
              plannedStartTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
              plannedEndTime: new Date(Date.now() + 11 * 60 * 60 * 1000),
              plannedDuration: 4
            },
            output: {
              producedQuantity: 0,
              unit: 'meters'
            },
            costs: {
              materialCost: 0,
              laborCost: 0,
              machineCost: 0,
              overheadCost: 0,
              jobWorkCost: 0,
              totalStageCost: 0
            }
          }
        ],
        schedule: {
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 11 * 60 * 60 * 1000),
          actualStartDate: new Date(),
          estimatedDuration: 11,
          actualDuration: 1
        },
        costSummary: {
          materialCost: 15000,
          laborCost: 150,
          machineCost: 300,
          overheadCost: 100,
          jobWorkCost: 0,
          totalProductionCost: 15550,
          costPerUnit: 31.1
        },
        qualitySummary: {
          totalProduced: 320,
          totalApproved: 315,
          totalRejected: 5,
          totalRework: 0,
          overallQualityGrade: 'A',
          defectRate: 1.6,
          firstPassYield: 98.4
        },
        specialInstructions: 'Maintain print quality and color consistency',
        customerRequirements: 'Export quality finish required',
        packingInstructions: 'Roll and pack in cartons',
        deliveryInstructions: 'Deliver to port for export',
        notes: 'Export order - quality check required',
        tags: ['export', 'african', 'cotton'],
        createdBy: operators[1]?._id
      },
      {
        productionOrderNumber: 'PO-2024-003',
        orderDate: new Date(),
        customerId: customer._id,
        customerName: customer.name,
        companyId: company._id,
        product: {
          productType: 'garment',
          design: 'Striped Pattern',
          designCode: 'STR-001',
          color: 'Green',
          colorCode: 'GRN-001',
          gsm: 180,
          width: 48,
          length: 2.5
        },
        orderQuantity: 200,
        unit: 'pieces',
        completedQuantity: 0,
        rejectedQuantity: 0,
        pendingQuantity: 200,
        priority: 'low',
        status: 'pending',
        productionStages: [
          {
            stageId: new mongoose.Types.ObjectId(),
            stageNumber: 1,
            stageName: 'Printing',
            processType: 'printing',
            status: 'pending',
            assignment: {
              workers: [],
              machines: []
            },
            timing: {
              plannedStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
              plannedEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
              plannedDuration: 4
            },
            output: {
              producedQuantity: 0,
              unit: 'pieces'
            },
            costs: {
              materialCost: 0,
              laborCost: 0,
              machineCost: 0,
              overheadCost: 0,
              jobWorkCost: 0,
              totalStageCost: 0
            }
          }
        ],
        schedule: {
          plannedStartDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
          plannedEndDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
          estimatedDuration: 4
        },
        costSummary: {
          materialCost: 8000,
          laborCost: 0,
          machineCost: 0,
          overheadCost: 0,
          jobWorkCost: 0,
          totalProductionCost: 8000,
          costPerUnit: 40
        },
        qualitySummary: {
          totalProduced: 0,
          totalApproved: 0,
          totalRejected: 0,
          totalRework: 0,
          overallQualityGrade: '',
          defectRate: 0,
          firstPassYield: 0
        },
        specialInstructions: 'Standard quality finish',
        customerRequirements: 'Regular quality finish',
        packingInstructions: 'Pack in bundles',
        deliveryInstructions: 'Deliver to local warehouse',
        notes: 'Regular order - no special requirements',
        tags: ['local', 'garment', 'striped'],
        createdBy: operators[2]?._id
      }
    ];

    // Clear existing production orders
    await ProductionOrder.deleteMany({ companyId: company._id });
    console.log('Cleared existing production orders');

    // Insert sample production orders
    const createdOrders = await ProductionOrder.insertMany(sampleOrders);
    console.log(`Created ${createdOrders.length} sample production orders`);

    console.log('Sample production data created successfully!');
    console.log('\nProduction Orders:');
    createdOrders.forEach(order => {
      console.log(`- ${order.productionOrderNumber}: ${order.product.productType} (${order.status})`);
      const currentStage = order.productionStages.find(stage => stage.status === 'in_progress');
      if (currentStage) {
        console.log(`  Current Stage: ${currentStage.stageName} - ${currentStage.output.producedQuantity}/${order.orderQuantity} ${order.unit}`);
      }
    });

  } catch (error) {
    console.error('Error creating sample production data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createSampleProductionData();
