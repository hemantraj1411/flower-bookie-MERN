// models/DeliveryAssignment.js
const mongoose = require('mongoose');

const deliveryAssignmentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'assigned'
  },
  estimatedTime: {
    pickup: Number, // minutes
    delivery: Number // minutes
  },
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  timeline: [{
    status: String,
    timestamp: Date,
    location: {
      coordinates: [Number],
      address: String
    },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

deliveryAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);