// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // User who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order Items
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      image: String,
      type: {
        type: String,
        enum: ['flower', 'indoor', 'plant'],
        default: 'flower'
      }
    }
  ],
  
  // Shipping Address
  shippingAddress: {
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    phone: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Delivery Location (for geospatial queries)
  deliveryLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [77.2090, 28.6139] // [lng, lat]
    },
    address: String
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'card', 'upi'],
    default: 'razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  
  // Price Breakdown
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  
  // Order Status (User-facing)
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'picked', 'on_the_way', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Delivery Status (Internal tracking)
  deliveryStatus: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'on_the_way', 'delivered'],
    default: 'pending'
  },
  
  // Payment Status Flags (Legacy support)
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  
  // Delivery Partner Info
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryPartner: {
    name: String,
    phone: String,
    vehicleNumber: String,
    currentLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date
    }
  },
  
  // Tracking Timeline (Complete history)
  timeline: [
    {
      status: {
        type: String,
        enum: ['order_placed', 'confirmed', 'processing', 'picked', 'out_for_delivery', 'delivered', 'cancelled', 'payment_completed']
      },
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      location: {
        lat: Number,
        lng: Number,
        address: String
      }
    }
  ],
  
  // Legacy tracking history (for backward compatibility)
  trackingHistory: [
    {
      status: String,
      timestamp: Date,
      note: String,
      location: {
        lat: Number,
        lng: Number
      }
    }
  ],
  
  // Estimated Delivery
  estimatedDelivery: {
    start: Date,
    end: Date
  },
  
  // Cancellation Details
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['user', 'admin', 'system']
    },
    cancelledAt: Date,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending'
    }
  },
  
  // Legacy cancellation fields (for backward compatibility)
  cancellationReason: String,
  cancelledAt: Date,
  
  // Additional Notes
  notes: String
  
}, {
  timestamps: true
});

// Index for geospatial queries
orderSchema.index({ deliveryLocation: '2dsphere' });

// Pre-save middleware to add timeline entries
orderSchema.pre('save', function(next) {
  const isNew = this.isNew;
  const statusChanged = this.isModified('orderStatus');
  const paymentChanged = this.isModified('paymentStatus');
  
  // Add initial timeline entry for new orders
  if (isNew) {
    this.timeline = this.timeline || [];
    this.trackingHistory = this.trackingHistory || [];
    
    const initialEntry = {
      status: 'order_placed',
      description: 'Your order has been placed successfully',
      timestamp: new Date()
    };
    
    this.timeline.push(initialEntry);
    this.trackingHistory.push({
      status: 'order_placed',
      timestamp: new Date(),
      note: 'Order placed successfully'
    });
  }
  
  // Add timeline entry when order status changes
  if (statusChanged && !isNew) {
    const statusMap = {
      'pending': { timeline: 'order_placed', desc: 'Your order has been placed' },
      'confirmed': { timeline: 'confirmed', desc: 'Order confirmed by seller' },
      'processing': { timeline: 'processing', desc: 'Order is being prepared' },
      'picked': { timeline: 'picked', desc: 'Order has been picked up' },
      'on_the_way': { timeline: 'out_for_delivery', desc: 'Your order is on the way' },
      'delivered': { timeline: 'delivered', desc: 'Order delivered successfully' },
      'cancelled': { timeline: 'cancelled', desc: 'Order cancelled' }
    };
    
    const statusInfo = statusMap[this.orderStatus];
    if (statusInfo) {
      // Add to timeline
      this.timeline.push({
        status: statusInfo.timeline,
        description: statusInfo.desc,
        timestamp: new Date()
      });
      
      // Add to trackingHistory (for backward compatibility)
      this.trackingHistory.push({
        status: this.orderStatus,
        timestamp: new Date(),
        note: statusInfo.desc
      });
    }
  }
  
  // Add timeline entry when payment is completed
  if (paymentChanged && this.paymentStatus === 'completed' && !isNew) {
    this.timeline.push({
      status: 'payment_completed',
      description: 'Payment completed successfully',
      timestamp: new Date()
    });
    
    this.trackingHistory.push({
      status: 'payment_completed',
      timestamp: new Date(),
      note: 'Payment completed successfully'
    });
    
    // Update legacy isPaid flag
    this.isPaid = true;
    this.paidAt = new Date();
  }
  
  // Sync delivery status with order status for certain states
  if (this.orderStatus === 'on_the_way' && this.deliveryStatus === 'pending') {
    this.deliveryStatus = 'on_the_way';
  } else if (this.orderStatus === 'delivered') {
    this.deliveryStatus = 'delivered';
    this.isDelivered = true;
    this.deliveredAt = new Date();
  } else if (this.orderStatus === 'cancelled') {
    if (!this.cancellation || !this.cancellation.cancelledAt) {
      this.cancellation = this.cancellation || {};
      this.cancellation.cancelledAt = new Date();
      this.cancellation.cancelledBy = this.cancellation.cancelledBy || 'system';
    }
    this.cancelledAt = new Date(); // legacy field
  }
  
  next();
});

// Method to add tracking update
orderSchema.methods.addTrackingUpdate = function(status, note, location = null) {
  this.trackingHistory.push({
    status,
    timestamp: new Date(),
    note,
    location
  });
  
  this.timeline.push({
    status: status === 'out_for_delivery' ? 'out_for_delivery' : status,
    description: note,
    timestamp: new Date(),
    location
  });
  
  return this.save();
};

// Method to assign delivery boy
orderSchema.methods.assignDeliveryBoy = async function(deliveryBoyId) {
  this.deliveryBoy = deliveryBoyId;
  this.deliveryStatus = 'assigned';
  
  // Find delivery boy details (assuming you have a User model)
  const User = mongoose.model('User');
  const deliveryBoy = await User.findById(deliveryBoyId);
  
  if (deliveryBoy) {
    this.deliveryPartner = {
      name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`,
      phone: deliveryBoy.phone,
      vehicleNumber: deliveryBoy.vehicleNumber
    };
  }
  
  this.trackingHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    note: `Delivery partner assigned`
  });
  
  this.timeline.push({
    status: 'assigned',
    description: `Delivery partner assigned`,
    timestamp: new Date()
  });
  
  return this.save();
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ orderStatus: status })
    .populate('user', 'firstName lastName email phone')
    .populate('orderItems.product')
    .populate('deliveryBoy', 'firstName lastName phone')
    .sort('-createdAt');
};

// Static method to get user's order history
orderSchema.statics.getUserOrders = function(userId) {
  return this.find({ user: userId })
    .populate('orderItems.product')
    .sort('-createdAt');
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;