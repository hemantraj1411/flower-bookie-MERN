// routes/deliveryBoyRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');
const DeliveryBoy = require('../models/DeliveryBoy');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const DeliveryNotification = require('../models/DeliveryNotification');
const DeliveryAssignmentService = require('../services/deliveryAssignmentService');

// Delivery Boy Login
router.post('/delivery/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const deliveryBoy = await DeliveryBoy.findOne({ email: email.toLowerCase() });
    if (!deliveryBoy) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: deliveryBoy._id, role: 'delivery' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update status to online
    deliveryBoy.status = 'online';
    await deliveryBoy.save();

    res.json({
      success: true,
      token,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`,
        email: deliveryBoy.email,
        phone: deliveryBoy.phone,
        status: deliveryBoy.status,
        vehicleType: deliveryBoy.vehicleType,
        vehicleNumber: deliveryBoy.vehicleNumber,
        totalDeliveries: deliveryBoy.totalDeliveries,
        rating: deliveryBoy.rating
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery boy profile
router.get('/delivery/profile', protect, authorize('delivery'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user._id)
      .select('-password')
      .lean();

    res.json({
      success: true,
      deliveryBoy
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update location
router.post('/delivery/location', protect, authorize('delivery'), async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;

    await DeliveryBoy.findByIdAndUpdate(req.user._id, {
      'location.coordinates': [lng, lat],
      'location.lastUpdated': new Date()
    });

    // Get active assignment
    const activeAssignment = await DeliveryAssignment.findOne({
      deliveryBoyId: req.user._id,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
    }).populate('orderId');

    // Broadcast location if active order
    if (activeAssignment) {
      const io = req.app.get('io');
      io.to(`order_${activeAssignment.orderId._id}`).emit('driver-location', {
        orderId: activeAssignment.orderId._id,
        location: { lat, lng },
        timestamp: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available orders
router.get('/delivery/available-orders', protect, authorize('delivery'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user._id);

    // Find unassigned orders in nearby area
    const availableOrders = await Order.find({
      deliveryStatus: 'pending',
      paymentStatus: 'completed',
      'deliveryLocation': {
        $near: {
          $geometry: deliveryBoy.location,
          $maxDistance: 10000 // 10km radius
        }
      }
    })
    .select('_id orderItems totalPrice shippingAddress deliveryLocation createdAt')
    .limit(10)
    .lean();

    res.json({
      success: true,
      orders: availableOrders
    });
  } catch (error) {
    console.error('Available orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my assignments
router.get('/delivery/my-assignments', protect, authorize('delivery'), async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.find({
      deliveryBoyId: req.user._id
    })
    .populate({
      path: 'orderId',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    })
    .sort('-createdAt')
    .lean();

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('My assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current active assignment
router.get('/delivery/current-order', protect, authorize('delivery'), async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      deliveryBoyId: req.user._id,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
    })
    .populate({
      path: 'orderId',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    });

    if (!assignment) {
      return res.json({ success: true, hasOrder: false });
    }

    res.json({
      success: true,
      hasOrder: true,
      assignment
    });
  } catch (error) {
    console.error('Current order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept order
router.post('/delivery/accept-order/:assignmentId', protect, authorize('delivery'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const io = req.app.get('io');
    const assignmentService = new DeliveryAssignmentService(io);

    const assignment = await assignmentService.acceptOrder(assignmentId, req.user._id);

    res.json({
      success: true,
      message: 'Order accepted successfully',
      assignment
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject order
router.post('/delivery/reject-order/:assignmentId', protect, authorize('delivery'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;
    const io = req.app.get('io');
    const assignmentService = new DeliveryAssignmentService(io);

    const result = await assignmentService.rejectOrder(assignmentId, req.user._id, reason);

    res.json({
      success: true,
      message: 'Order rejected',
      ...result
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/delivery/order-status/:assignmentId', protect, authorize('delivery'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, location, note } = req.body;

    const assignment = await DeliveryAssignment.findOne({
      _id: assignmentId,
      deliveryBoyId: req.user._id
    }).populate('orderId');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update assignment
    assignment.status = status;
    assignment.timeline.push({
      status,
      timestamp: new Date(),
      location,
      note
    });

    if (status === 'picked_up') {
      assignment.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      assignment.deliveredAt = new Date();
      
      // Update delivery boy stats
      await DeliveryBoy.findByIdAndUpdate(req.user._id, {
        $inc: { totalDeliveries: 1 },
        status: 'available',
        currentOrderId: null
      });
    }

    await assignment.save();

    // Update order
    await Order.findByIdAndUpdate(assignment.orderId._id, {
      deliveryStatus: status,
      ...(status === 'delivered' && { actualDeliveryTime: new Date() })
    });

    // Add to tracking history
    await Order.findByIdAndUpdate(assignment.orderId._id, {
      $push: {
        trackingHistory: {
          status,
          location,
          timestamp: new Date(),
          note
        }
      }
    });

    // Notify customer
    if (assignment.orderId.user) {
      const io = req.app.get('io');
      io.to(`user_${assignment.orderId.user}`).emit('order-status-update', {
        orderId: assignment.orderId._id,
        status,
        location,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Order ${status}`,
      assignment
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications
router.get('/delivery/notifications', protect, authorize('delivery'), async (req, res) => {
  try {
    const notifications = await DeliveryNotification.find({
      deliveryBoyId: req.user._id
    })
    .populate('orderId', '_id totalPrice')
    .sort('-createdAt')
    .limit(50);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/delivery/notifications/:id/read', protect, authorize('delivery'), async (req, res) => {
  try {
    await DeliveryNotification.findByIdAndUpdate(req.params.id, {
      isRead: true
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle online/offline status
router.put('/delivery/toggle-status', protect, authorize('delivery'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user._id);
    
    const newStatus = deliveryBoy.status === 'online' ? 'offline' : 'online';
    deliveryBoy.status = newStatus;
    
    await deliveryBoy.save();

    // Notify admin
    const io = req.app.get('io');
    io.to('admin_room').emit('delivery-status-change', {
      deliveryBoyId: deliveryBoy._id,
      status: newStatus,
      name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`
    });

    res.json({
      success: true,
      status: newStatus,
      message: `You are now ${newStatus}`
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get earnings
router.get('/delivery/earnings', protect, authorize('delivery'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      deliveryBoyId: req.user._id,
      status: 'delivered'
    };

    if (startDate && endDate) {
      query.deliveredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const deliveries = await DeliveryAssignment.find(query)
      .populate('orderId', 'totalPrice');

    const totalEarnings = deliveries.reduce((sum, d) => {
      // Assume delivery boy gets 30% of delivery charge
      const deliveryCharge = d.orderId?.shippingPrice || 0;
      return sum + (deliveryCharge * 0.3);
    }, 0);

    res.json({
      success: true,
      totalDeliveries: deliveries.length,
      totalEarnings,
      deliveries
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;