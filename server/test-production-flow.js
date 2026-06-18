// Test script for production batch management flow
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const AUTH_TOKEN = 'your-auth-token'; // Replace with actual token

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testProductionFlow() {
  try {
    console.log('🚀 Testing Production Batch Management Flow...\n');

    // 1. Create a production batch
    console.log('1. Creating production batch...');
    const batchData = {
      companyId: '507f1f77bcf86cd799439011', // Replace with actual company ID
      productionOrderId: 'PO-2024-001',
      customerOrderId: 'CO-2024-001',
      productSpecifications: {
        fabricType: 'Cotton',
        gsm: 120,
        width: 44,
        color: 'Blue',
        design: 'Floral Print'
      },
      plannedQuantity: 1000,
      unit: 'meters',
      plannedStartDate: new Date(),
      plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      totalPlannedDuration: 168, // 7 days in hours
      priority: 'high',
      materialInputs: [
        {
          itemId: '507f1f77bcf86cd799439012', // Replace with actual grey fabric item ID
          quantity: 1000,
          unit: 'meters',
          unitCost: 50,
          totalCost: 50000
        }
      ],
      reserveMaterials: true
    };

    const batchResponse = await axios.post(`${BASE_URL}/batches`, batchData, { headers });
    const batchId = batchResponse.data.data._id;
    console.log(`✅ Batch created: ${batchId}\n`);

    // 2. Transfer materials to working inventory
    console.log('2. Transferring materials to working inventory...');
    const transferData = {
      materialInputs: [
        {
          itemId: '507f1f77bcf86cd799439012', // Grey fabric item ID
          quantity: 1000,
          unit: 'meters'
        }
      ]
    };

    await axios.post(`${BASE_URL}/batches/${batchId}/transfer-to-working-inventory`, transferData, { headers });
    console.log('✅ Materials transferred to working inventory\n');

    // 3. Start Stage 1 - Pre-Processing
    console.log('3. Starting Stage 1 - Pre-Processing...');
    await axios.patch(`${BASE_URL}/batches/${batchId}/stages/1/status`, {
      status: 'in_progress'
    }, { headers });
    console.log('✅ Stage 1 started\n');

    // 4. Consume materials for Stage 1
    console.log('4. Consuming materials for Stage 1...');
    const consumptionData = {
      materials: [
        {
          itemId: '507f1f77bcf86cd799439012', // Working inventory item ID (would be different in real scenario)
          plannedQuantity: 1000,
          actualQuantity: 980,
          wasteQuantity: 20,
          returnedQuantity: 0,
          unit: 'meters',
          notes: 'Normal processing waste'
        }
      ]
    };

    await axios.post(`${BASE_URL}/batches/${batchId}/stages/1/consume-materials`, consumptionData, { headers });
    console.log('✅ Materials consumed for Stage 1\n');

    // 5. Add output for Stage 1
    console.log('5. Adding output for Stage 1...');
    const outputData = {
      outputs: [
        {
          itemName: 'Pre-processed Cotton Fabric',
          category: {
            primary: 'semi_finished',
            secondary: 'processed_fabric',
            tertiary: 'pre_processed'
          },
          quantity: 980,
          unit: 'meters',
          qualityGrade: 'A',
          defects: [],
          notes: 'Pre-processing completed successfully'
        }
      ]
    };

    await axios.post(`${BASE_URL}/batches/${batchId}/stages/1/add-output`, outputData, { headers });
    console.log('✅ Output added for Stage 1\n');

    // 6. Complete Stage 1
    console.log('6. Completing Stage 1...');
    await axios.patch(`${BASE_URL}/batches/${batchId}/stages/1/status`, {
      status: 'completed'
    }, { headers });
    console.log('✅ Stage 1 completed\n');

    // 7. Get batch details to verify
    console.log('7. Getting batch details...');
    const finalBatch = await axios.get(`${BASE_URL}/batches/${batchId}`, { headers });
    console.log('✅ Final batch status:', {
      batchNumber: finalBatch.data.data.batchNumber,
      status: finalBatch.data.data.status,
      currentStage: finalBatch.data.data.currentStage,
      stagesCompleted: finalBatch.data.data.stages.filter(s => s.status === 'completed').length
    });

    console.log('\n🎉 Production flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testProductionFlow();
}

module.exports = { testProductionFlow };
