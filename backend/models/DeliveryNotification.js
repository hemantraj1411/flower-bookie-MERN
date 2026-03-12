// models/DeliveryNotification.js
const mongoose = require('mongoose');

const deliveryNotificationSchema = new mongoose.Schema({
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  type: {
    type: String,
    enum: ['new_order', 'order_assigned', 'order_accepted', 'order_rejected', 'order_picked', 'order_delivered'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeliveryNotification', deliveryNotificationSchema);