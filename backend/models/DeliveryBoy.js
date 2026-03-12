// models/DeliveryBoy.js
const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'cycle', 'car'],
    default: 'bike'
  },
  vehicleNumber: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'delivery'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'available'],
    default: 'offline'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  totalDeliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    lastUpdated: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
deliveryBoySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('DeliveryBoy', deliveryBoySchema);