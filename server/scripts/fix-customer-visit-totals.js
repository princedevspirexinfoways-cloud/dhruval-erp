const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-erp');

// Define the CustomerVisit schema inline since we can't import TypeScript
const customerVisitSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  partyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String },
  visitDate: { type: Date, required: true },
  purpose: { type: String, required: true },
  purposeDescription: { type: String, required: true },
  travelType: { type: String, required: true },
  travelDetails: {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    travelMode: { type: String, required: true },
    departureDate: { type: Date },
    returnDate: { type: Date },
    travelClass: { type: String }
  },
  accommodation: {
    hotelName: { type: String },
    hotelAddress: { type: String },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    roomType: { type: String, enum: ['single', 'double', 'suite', 'deluxe'] },
    numberOfRooms: { type: Number, min: 1 },
    costPerNight: { type: Number, min: 0 },
    totalNights: { type: Number, min: 0 },
    totalCost: { type: Number, min: 0 },
    bookingReference: { type: String },
    amenities: [{ type: String }]
  },
  foodExpenses: [{
    date: { type: Date, required: true },
    mealType: { type: String, required: true },
    restaurant: { type: String, required: true },
    location: { type: String, required: true },
    numberOfPeople: { type: Number, required: true, min: 1 },
    costPerPerson: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    description: { type: String },
    billNumber: { type: String }
  }],
  giftsGiven: [{
    itemName: { type: String, required: true },
    itemType: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    description: { type: String },
    recipientName: { type: String }
  }],
  transportationExpenses: [{
    date: { type: Date, required: true },
    type: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    description: { type: String },
    billNumber: { type: String }
  }],
  otherExpenses: [{
    date: { type: Date, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    billNumber: { type: String }
  }],
  visitOutcome: {
    status: { type: String, required: true },
    notes: { type: String, required: true },
    nextActionRequired: { type: String },
    nextFollowUpDate: { type: Date },
    businessGenerated: { type: Number, min: 0 },
    potentialBusiness: { type: Number, min: 0 }
  },
  totalExpenses: {
    accommodation: { type: Number, default: 0, min: 0 },
    food: { type: Number, default: 0, min: 0 },
    transportation: { type: Number, default: 0, min: 0 },
    gifts: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  approvalStatus: { type: String, default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  collection: 'customer_visits'
});

const CustomerVisit = mongoose.model('CustomerVisit', customerVisitSchema);

async function fixCustomerVisitTotals() {
  try {
    console.log('Starting to fix customer visit totals...');
    
    // Get all customer visits
    const visits = await CustomerVisit.find({});
    console.log(`Found ${visits.length} customer visits to process`);
    
    let processed = 0;
    let errors = 0;
    
    for (const visit of visits) {
      try {
        console.log(`Processing visit ${visit._id} - ${visit.partyName}`);
        
        // Calculate accommodation total
        let accommodationTotal = 0;
        if (visit.accommodation) {
          const checkIn = new Date(visit.accommodation.checkInDate);
          const checkOut = new Date(visit.accommodation.checkOutDate);
          const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          const totalCost = totalNights * visit.accommodation.numberOfRooms * visit.accommodation.costPerNight;
          
          // Update accommodation totals
          visit.accommodation.totalNights = totalNights;
          visit.accommodation.totalCost = totalCost;
          accommodationTotal = totalCost;
          
          console.log(`  - Accommodation: ${totalNights} nights, ₹${totalCost}`);
        }

        // Calculate food expenses total
        const foodTotal = visit.foodExpenses.reduce((sum, expense) => {
          const totalCost = expense.numberOfPeople * expense.costPerPerson;
          return sum + totalCost;
        }, 0);
        
        if (foodTotal > 0) {
          console.log(`  - Food expenses: ₹${foodTotal}`);
        }

        // Calculate gifts total
        const giftsTotal = visit.giftsGiven.reduce((sum, gift) => {
          const totalCost = gift.quantity * gift.unitCost;
          return sum + totalCost;
        }, 0);
        
        if (giftsTotal > 0) {
          console.log(`  - Gifts: ₹${giftsTotal}`);
        }

        // Calculate transportation total
        const transportationTotal = visit.transportationExpenses.reduce((sum, expense) => sum + expense.cost, 0);
        
        if (transportationTotal > 0) {
          console.log(`  - Transportation: ₹${transportationTotal}`);
        }

        // Calculate other expenses total
        const otherTotal = visit.otherExpenses.reduce((sum, expense) => sum + expense.cost, 0);
        
        if (otherTotal > 0) {
          console.log(`  - Other expenses: ₹${otherTotal}`);
        }

        // Calculate grand total
        const grandTotal = accommodationTotal + foodTotal + transportationTotal + giftsTotal + otherTotal;
        
        // Update totalExpenses
        visit.totalExpenses = {
          accommodation: accommodationTotal,
          food: foodTotal,
          transportation: transportationTotal,
          gifts: giftsTotal,
          other: otherTotal,
          total: grandTotal
        };

        // Save the updated visit
        await visit.save();
        
        console.log(`  - Total: ₹${grandTotal}`);
        console.log(`  ✅ Updated successfully\n`);
        
        processed++;
      } catch (error) {
        console.error(`  ❌ Error processing visit ${visit._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n✅ Fix completed!`);
    console.log(`- Processed: ${processed} visits`);
    console.log(`- Errors: ${errors} visits`);
    
  } catch (error) {
    console.error('Error fixing customer visit totals:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixCustomerVisitTotals();
