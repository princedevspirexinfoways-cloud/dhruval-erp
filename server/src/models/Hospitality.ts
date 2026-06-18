import { Schema, model } from 'mongoose';
import { IHospitality, IGuest, IRoom, IBooking, IService } from '@/types/models';

const GuestSchema = new Schema<IGuest>({
  guestId: { type: String, required: true, uppercase: true, trim: true },
  personalInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    fullName: { type: String, trim: true },
    title: { type: String, enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'] },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    nationality: { type: String, default: 'Indian' },
    profilePhoto: { type: String }
  },
  contactInfo: {
    primaryPhone: { type: String, required: true },
    alternatePhone: { type: String },
    email: { type: String },
    whatsapp: { type: String }
  },
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  identification: {
    idType: { type: String, enum: ['aadhar', 'pan', 'passport', 'driving_license', 'voter_id'], required: true },
    idNumber: { type: String, required: true },
    idCopy: { type: String } // URL to ID document
  },
  companyInfo: {
    companyName: { type: String },
    designation: { type: String },
    department: { type: String },
    companyAddress: { type: String },
    businessCard: { type: String }
  },
  preferences: {
    roomType: { type: String, enum: ['single', 'double', 'suite', 'deluxe'] },
    bedType: { type: String, enum: ['single', 'double', 'queen', 'king'] },
    smokingPreference: { type: String, enum: ['smoking', 'non_smoking'], default: 'non_smoking' },
    floorPreference: { type: String, enum: ['ground', 'high', 'any'], default: 'any' },
    dietaryRestrictions: [String],
    specialRequests: [String]
  },
  loyaltyInfo: {
    membershipNumber: { type: String },
    membershipTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] },
    points: { type: Number, default: 0 },
    totalStays: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  isVIP: { type: Boolean, default: false },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String },
  notes: { type: String }
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
  roomNumber: { type: String, required: true, uppercase: true, trim: true },
  roomType: { type: String, enum: ['single', 'double', 'suite', 'deluxe', 'presidential'], required: true },
  floor: { type: Number, required: true, min: 0 },
  building: { type: String },
  capacity: { type: Number, required: true, min: 1, max: 10 },
  bedConfiguration: {
    singleBeds: { type: Number, default: 0 },
    doubleBeds: { type: Number, default: 0 },
    queenBeds: { type: Number, default: 0 },
    kingBeds: { type: Number, default: 0 }
  },
  amenities: [String], // AC, TV, WiFi, Minibar, etc.
  facilities: [String], // Balcony, Sea view, etc.
  area: { type: Number, min: 0 }, // Square meters
  baseRate: { type: Number, required: true, min: 0 },
  seasonalRates: [{
    season: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rate: { type: Number, required: true, min: 0 }
  }],
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order'], 
    default: 'available' 
  },
  lastCleaned: { type: Date },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  housekeepingNotes: { type: String },
  maintenanceNotes: { type: String },
  photos: [String], // URLs to room photos
  isActive: { type: Boolean, default: true }
}, { _id: false });

const BookingSchema = new Schema<IBooking>({
  bookingNumber: { type: String, required: true, uppercase: true, trim: true },
  bookingDate: { type: Date, required: true, default: Date.now },
  bookingSource: { type: String, enum: ['direct', 'phone', 'email', 'website', 'agent', 'walk_in'], required: true },
  guestInfo: GuestSchema,
  stayDetails: {
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 }
  },
  roomDetails: {
    roomNumbers: [String],
    roomType: { type: String, required: true },
    totalRooms: { type: Number, required: true, min: 1 }
  },
  rateDetails: {
    baseRate: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxPercentage: { type: Number, default: 18, min: 0, max: 50 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 }
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'], 
    default: 'confirmed' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'refunded'], 
    default: 'pending' 
  },
  specialRequests: [String],
  cancellationPolicy: { type: String },
  cancellationReason: { type: String },
  cancellationDate: { type: Date },
  actualCheckIn: { type: Date },
  actualCheckOut: { type: Date },
  earlyCheckIn: { type: Boolean, default: false },
  lateCheckOut: { type: Boolean, default: false },
  extendedStay: { type: Boolean, default: false },
  noShow: { type: Boolean, default: false },
  notes: { type: String }
}, { _id: false });

const ServiceSchema = new Schema<IService>({
  serviceDate: { type: Date, required: true, default: Date.now },
  serviceType: { 
    type: String, 
    enum: ['room_service', 'laundry', 'spa', 'restaurant', 'bar', 'transport', 'conference', 'other'], 
    required: true 
  },
  serviceName: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  serviceTime: { type: String },
  serviceLocation: { type: String },
  serviceProvider: { type: String },
  status: { 
    type: String, 
    enum: ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled'], 
    default: 'requested' 
  },
  requestedBy: { type: String },
  completedBy: { type: String },
  completedAt: { type: Date },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  notes: { type: String }
}, { _id: false });

const HospitalitySchema = new Schema<IHospitality>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Facility Identification
  facilityId: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  facilityName: { 
    type: String, 
    required: true,
    trim: true
  },
  facilityType: { 
    type: String, 
    enum: ['hotel', 'guest_house', 'resort', 'lodge', 'hostel', 'service_apartment'], 
    required: true 
  },
  description: { type: String },

  // Location Information
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: { type: String },
    gpsCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },

  // Contact Information
  contactInfo: {
    primaryPhone: { type: String, required: true },
    alternatePhone: { type: String },
    email: { type: String, required: true },
    website: { type: String },
    fax: { type: String }
  },

  // Facility Details
  facilityDetails: {
    totalRooms: { type: Number, required: true, min: 1 },
    totalFloors: { type: Number, required: true, min: 1 },
    totalBuildings: { type: Number, default: 1, min: 1 },
    maxCapacity: { type: Number, required: true, min: 1 },
    starRating: { type: Number, min: 1, max: 5 },
    establishedYear: { type: Number },
    renovatedYear: { type: Number },
    totalArea: { type: Number, min: 0 }, // Square meters
    parkingSpaces: { type: Number, default: 0, min: 0 }
  },

  // Rooms Inventory
  rooms: [RoomSchema],
  roomTypes: [{
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    baseRate: { type: Number, required: true, min: 0 },
    maxOccupancy: { type: Number, required: true, min: 1 }
  }],

  // Current Occupancy
  occupancy: {
    totalRooms: { type: Number, default: 0 },
    occupiedRooms: { type: Number, default: 0 },
    availableRooms: { type: Number, default: 0 },
    maintenanceRooms: { type: Number, default: 0 },
    occupancyPercentage: { type: Number, default: 0, min: 0, max: 100 },
    currentGuests: { type: Number, default: 0 },
    expectedArrivals: { type: Number, default: 0 },
    expectedDepartures: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Bookings & Reservations
  bookings: [BookingSchema],
  totalBookings: { type: Number, default: 0 },
  activeBookings: { type: Number, default: 0 },

  // Guest Management
  guests: [GuestSchema],
  totalGuests: { type: Number, default: 0 },
  vipGuests: { type: Number, default: 0 },
  repeatGuests: { type: Number, default: 0 },

  // Services & Amenities
  services: [ServiceSchema],
  amenities: {
    roomAmenities: [String], // AC, TV, WiFi, etc.
    hotelAmenities: [String], // Pool, Gym, Spa, etc.
    businessServices: [String], // Conference room, Business center, etc.
    recreationalServices: [String], // Games room, Library, etc.
    diningOptions: [String], // Restaurant, Bar, Room service, etc.
    transportServices: [String] // Airport pickup, Car rental, etc.
  },

  // Staff Management
  staff: {
    totalStaff: { type: Number, default: 0 },
    frontDesk: { type: Number, default: 0 },
    housekeeping: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 },
    foodService: { type: Number, default: 0 },
    security: { type: Number, default: 0 },
    management: { type: Number, default: 0 },
    shifts: [{
      shiftName: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      staffCount: { type: Number, required: true, min: 0 }
    }]
  },

  // Financial Information
  financials: {
    averageRoomRate: { type: Number, default: 0, min: 0 },
    revenuePerAvailableRoom: { type: Number, default: 0, min: 0 }, // RevPAR
    totalRevenue: { type: Number, default: 0, min: 0 },
    roomRevenue: { type: Number, default: 0, min: 0 },
    serviceRevenue: { type: Number, default: 0, min: 0 },
    operatingCosts: { type: Number, default: 0, min: 0 },
    profitMargin: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now }
  },

  // Performance Metrics
  performance: {
    occupancyRate: { type: Number, default: 0, min: 0, max: 100 },
    averageDailyRate: { type: Number, default: 0, min: 0 },
    revenuePerAvailableRoom: { type: Number, default: 0, min: 0 },
    guestSatisfactionScore: { type: Number, default: 0, min: 0, max: 10 },
    repeatGuestPercentage: { type: Number, default: 0, min: 0, max: 100 },
    averageLengthOfStay: { type: Number, default: 0, min: 0 },
    noShowRate: { type: Number, default: 0, min: 0, max: 100 },
    cancellationRate: { type: Number, default: 0, min: 0, max: 100 },
    lastCalculated: { type: Date, default: Date.now }
  },

  // Operating Hours
  operatingHours: {
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    frontDeskHours: { type: String, default: '24/7' },
    restaurantHours: { type: String },
    barHours: { type: String },
    spaHours: { type: String },
    gymHours: { type: String }
  },

  // Policies
  policies: {
    cancellationPolicy: { type: String },
    childPolicy: { type: String },
    petPolicy: { type: String },
    smokingPolicy: { type: String },
    extraBedPolicy: { type: String },
    paymentPolicy: { type: String },
    refundPolicy: { type: String }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to photos, documents

  // Tracking & Audit
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  managerName: { type: String }
}, {
  timestamps: true,
  collection: 'hospitality'
});

// Compound Indexes
HospitalitySchema.index({ companyId: 1, facilityId: 1 }, { unique: true });
HospitalitySchema.index({ companyId: 1, facilityType: 1 });
HospitalitySchema.index({ companyId: 1, 'bookings.checkInDate': 1 });
HospitalitySchema.index({ companyId: 1, 'bookings.status': 1 });

// Text search index
HospitalitySchema.index({ 
  facilityName: 'text', 
  facilityId: 'text',
  description: 'text'
});

// Pre-save middleware
HospitalitySchema.pre('save', function(next) {
  // Update occupancy statistics
  const totalRooms = this.rooms.length;
  const occupiedRooms = this.rooms.filter(room => room.status === 'occupied').length;
  const availableRooms = this.rooms.filter(room => room.status === 'available').length;
  const maintenanceRooms = this.rooms.filter(room => ['maintenance', 'cleaning', 'out_of_order'].includes(room.status)).length;
  
  this.occupancy.totalRooms = totalRooms;
  this.occupancy.occupiedRooms = occupiedRooms;
  this.occupancy.availableRooms = availableRooms;
  this.occupancy.maintenanceRooms = maintenanceRooms;
  this.occupancy.occupancyPercentage = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  this.occupancy.lastUpdated = new Date();
  
  // Update booking counts
  this.totalBookings = this.bookings.length;
  this.activeBookings = this.bookings.filter(booking => 
    ['confirmed', 'checked_in'].includes(booking.status)
  ).length;
  
  // Update guest counts
  this.totalGuests = this.guests.length;
  this.vipGuests = this.guests.filter(guest => guest.isVIP).length;
  this.repeatGuests = this.guests.filter(guest => guest.loyaltyInfo.totalStays > 1).length;
  
  next();
});

// Instance methods
HospitalitySchema.methods.getAvailableRooms = function(checkIn: Date, checkOut: Date, roomType?: string) {
  return this.rooms.filter(room => {
    if (room.status !== 'available') return false;
    if (roomType && room.roomType !== roomType) return false;
    
    // Check if room is booked during the requested period
    const isBooked = this.bookings.some(booking => {
      if (booking.status === 'cancelled' || booking.status === 'no_show') return false;
      if (!booking.roomDetails.roomNumbers.includes(room.roomNumber)) return false;
      
      return (
        (checkIn >= booking.stayDetails.checkInDate && checkIn < booking.stayDetails.checkOutDate) ||
        (checkOut > booking.stayDetails.checkInDate && checkOut <= booking.stayDetails.checkOutDate) ||
        (checkIn <= booking.stayDetails.checkInDate && checkOut >= booking.stayDetails.checkOutDate)
      );
    });
    
    return !isBooked;
  });
};

HospitalitySchema.methods.calculateRevenue = function(startDate: Date, endDate: Date) {
  const relevantBookings = this.bookings.filter(booking => 
    booking.stayDetails.checkInDate >= startDate && 
    booking.stayDetails.checkInDate <= endDate &&
    booking.status !== 'cancelled'
  );
  
  const roomRevenue = relevantBookings.reduce((sum, booking) => sum + booking.rateDetails.totalAmount, 0);
  const serviceRevenue = this.services
    .filter(service => service.serviceDate >= startDate && service.serviceDate <= endDate)
    .reduce((sum, service) => sum + service.totalPrice, 0);
  
  return {
    roomRevenue,
    serviceRevenue,
    totalRevenue: roomRevenue + serviceRevenue
  };
};

HospitalitySchema.methods.getOccupancyRate = function(date: Date): number {
  const totalRooms = this.rooms.length;
  if (totalRooms === 0) return 0;
  
  const occupiedRooms = this.bookings.filter(booking => 
    booking.status === 'checked_in' &&
    booking.stayDetails.checkInDate <= date &&
    booking.stayDetails.checkOutDate > date
  ).reduce((sum, booking) => sum + booking.roomDetails.totalRooms, 0);
  
  return (occupiedRooms / totalRooms) * 100;
};

// Static methods
HospitalitySchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

HospitalitySchema.statics.getHospitalityStats = function(companyId: string) {
  return this.aggregate([
    { $match: { companyId: new Schema.Types.ObjectId(companyId), isActive: true } },
    {
      $group: {
        _id: '$facilityType',
        count: { $sum: 1 },
        totalRooms: { $sum: '$facilityDetails.totalRooms' },
        totalCapacity: { $sum: '$facilityDetails.maxCapacity' },
        avgOccupancy: { $avg: '$occupancy.occupancyPercentage' },
        totalRevenue: { $sum: '$financials.totalRevenue' }
      }
    }
  ]);
};

export default model<IHospitality>('Hospitality', HospitalitySchema);
