// models/DeliveryZone.js
const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  area: [{
    type: String,
    required: true
  }],
  pincodes: [{
    type: String,
    required: true
  }],
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of rings of [lng, lat] pairs
      required: true
    }
  },
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  deliveryTime: {
    min: Number, // minimum minutes
    max: Number  // maximum minutes
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  minimumOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedBoys: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for geospatial queries
deliveryZoneSchema.index({ boundaries: '2dsphere' });
deliveryZoneSchema.index({ center: '2dsphere' });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);