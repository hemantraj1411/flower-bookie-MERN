// routes/deliveryRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const DeliveryBoy = require('../models/DeliveryBoy');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ============ PUBLIC DELIVERY BOY ROUTES ============

// Delivery boy login
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
    const token = generateToken(deliveryBoy._id);
    
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

// Delivery boy update status (online/offline/busy)
router.put('/delivery/status', protect, authorize('delivery'), async (req, res) => {
  try {
    const { status, location } = req.body;
    
    const deliveryBoy = await DeliveryBoy.findById(req.user._id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }
    
    // Update status
    deliveryBoy.status = status;
    
    // Update location if provided
    if (location && location.coordinates) {
      deliveryBoy.location = {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        lastUpdated: new Date()
      };
    }
    
    await deliveryBoy.save();
    
    // Emit socket event for status change
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery-status-change', {
        deliveryBoyId: deliveryBoy._id,
        status: deliveryBoy.status,
        name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`
      });
    }
    
    res.json({
      success: true,
      message: `Status updated to ${status}`,
      status: deliveryBoy.status,
      location: deliveryBoy.location
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery boy's current assignment
router.get('/delivery/current-order', protect, authorize('delivery'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user._id);
    
    if (!deliveryBoy.currentOrderId) {
      return res.json({ hasOrder: false });
    }
    
    const assignment = await DeliveryAssignment.findOne({
      deliveryBoyId: req.user._id,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
    }).populate({
      path: 'orderId',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone address'
      }
    });
    
    if (!assignment) {
      return res.json({ hasOrder: false });
    }
    
    res.json({
      hasOrder: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching current order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update delivery location (real-time tracking)
router.post('/delivery/location', protect, authorize('delivery'), async (req, res) => {
  try {
    const { coordinates, address } = req.body;
    
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates,
          address,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
    
    // Find active assignment
    const activeAssignment = await DeliveryAssignment.findOne({
      deliveryBoyId: req.user._id,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
    }).populate('orderId');
    
    // Emit socket event for location update
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery-location-update', {
        deliveryBoyId: deliveryBoy._id,
        location: deliveryBoy.location,
        timestamp: new Date()
      });
      
      // Emit to customer if order exists
      if (activeAssignment && activeAssignment.orderId && activeAssignment.orderId.user) {
        io.to(`user_${activeAssignment.orderId.user}`).emit('driver-location', {
          orderId: activeAssignment.orderId._id,
          location: { lat: coordinates[1], lng: coordinates[0] },
          timestamp: new Date()
        });
      }
    }
    
    res.json({ success: true, location: deliveryBoy.location });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ADMIN ROUTES ============

// Test route
router.get('/admin/delivery/test', (req, res) => {
  res.json({ success: true, message: 'Delivery routes working' });
});

// Get all delivery boys with stats
router.get('/admin/delivery/boys', protect, authorize('admin'), async (req, res) => {
  try {
    const boys = await DeliveryBoy.find().select('-password').sort('-createdAt');
    
    // Calculate stats
    const stats = {
      total: boys.length,
      online: boys.filter(b => b.status === 'online').length,
      offline: boys.filter(b => b.status === 'offline').length,
      busy: boys.filter(b => b.status === 'busy').length,
      available: boys.filter(b => b.status === 'available' || b.status === 'online').length
    };
    
    res.json({
      boys,
      stats
    });
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new delivery boy (UPDATED WITH VALIDATION)
router.post('/admin/delivery/boys', protect, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, vehicleType, vehicleNumber } = req.body;

    console.log('📝 Adding new delivery boy:', { firstName, lastName, email, phone, vehicleType });

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        required: ['firstName', 'lastName', 'email', 'phone', 'password']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Validate phone (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number must be 10 digits' 
      });
    }

    // Check if exists
    const existing = await DeliveryBoy.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'Delivery boy with this email or phone already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const deliveryBoy = await DeliveryBoy.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      vehicleType: vehicleType || 'bike',
      vehicleNumber: vehicleNumber || '',
      role: 'delivery',
      status: 'offline',
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [0, 0],
        lastUpdated: new Date()
      }
    });

    // Return without password
    const boyWithoutPassword = deliveryBoy.toObject();
    delete boyWithoutPassword.password;

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new-delivery-boy', boyWithoutPassword);
    }

    console.log('✅ Delivery boy added successfully:', boyWithoutPassword._id);

    res.status(201).json({
      success: true,
      message: 'Delivery boy added successfully',
      data: boyWithoutPassword
    });

  } catch (error) {
    console.error('❌ Error adding delivery boy:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `Delivery boy with this ${field} already exists` 
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to add delivery boy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update delivery boy status (admin can override)
router.put('/admin/delivery/boys/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, isActive } = req.body;
    const deliveryBoy = await DeliveryBoy.findById(req.params.id);
    
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    if (status) deliveryBoy.status = status;
    if (isActive !== undefined) deliveryBoy.isActive = isActive;
    
    await deliveryBoy.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery-status-change', {
        deliveryBoyId: deliveryBoy._id,
        status: deliveryBoy.status,
        isActive: deliveryBoy.isActive,
        name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`
      });
    }

    res.json({ 
      success: true, 
      message: 'Status updated', 
      deliveryBoy: {
        id: deliveryBoy._id,
        status: deliveryBoy.status,
        isActive: deliveryBoy.isActive
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle delivery boy online/offline (used by delivery boy)
router.put('/delivery/toggle-status', protect, authorize('delivery'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user._id);
    
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    // Toggle between online and offline
    const newStatus = deliveryBoy.status === 'online' ? 'offline' : 'online';
    deliveryBoy.status = newStatus;
    
    await deliveryBoy.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery-status-change', {
        deliveryBoyId: deliveryBoy._id,
        status: deliveryBoy.status,
        name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`
      });
    }

    res.json({ 
      success: true, 
      message: `You are now ${newStatus}`,
      status: deliveryBoy.status
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active orders for assignment
router.get('/admin/delivery/active-orders', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: 'pending',
      paymentStatus: 'completed'
    }).populate('user', 'firstName lastName email phone address');
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all assignments
router.get('/admin/delivery/assignments', protect, authorize('admin'), async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.find()
      .populate('orderId')
      .populate('deliveryBoyId', 'firstName lastName phone email')
      .populate('assignedBy', 'firstName lastName email')
      .sort('-createdAt');
    
    // Calculate today's deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDeliveries = assignments.filter(a => 
      a.status === 'delivered' && new Date(a.updatedAt) >= today
    ).length;
    
    const pendingAssignments = assignments.filter(a => 
      a.status !== 'delivered' && a.status !== 'cancelled'
    ).length;
    
    res.json({
      assignments,
      stats: {
        todayDeliveries,
        pending: pendingAssignments
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Assign order to delivery boy
router.post('/admin/delivery/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { orderId, deliveryBoyId } = req.body;

    if (!orderId || !deliveryBoyId) {
      return res.status(400).json({ message: 'Order ID and Delivery Boy ID are required' });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if delivery boy exists and is available
    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    if (deliveryBoy.status === 'busy' || deliveryBoy.status === 'offline') {
      return res.status(400).json({ message: 'Delivery boy is not available' });
    }

    // Create assignment
    const assignment = await DeliveryAssignment.create({
      orderId,
      deliveryBoyId,
      assignedBy: req.user._id,
      status: 'assigned',
      estimatedTime: {
        pickup: 10,
        delivery: 20
      },
      timeline: [{
        status: 'assigned',
        timestamp: new Date(),
        note: 'Order assigned to delivery boy'
      }]
    });

    // Update delivery boy status
    await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, {
      status: 'busy',
      currentOrderId: orderId,
      $push: { assignedOrders: orderId }
    });

    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      orderStatus: 'assigned',
      deliveryAssignment: assignment._id
    });

    const populatedAssignment = await DeliveryAssignment.findById(assignment._id)
      .populate('orderId')
      .populate('deliveryBoyId', 'firstName lastName phone email');

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new-assignment', populatedAssignment);
      io.to(`delivery_${deliveryBoyId}`).emit('new-order-assigned', {
        assignmentId: assignment._id,
        orderId,
        message: 'New order has been assigned to you'
      });
      io.emit('delivery-status-change', {
        deliveryBoyId: deliveryBoy._id,
        status: 'busy',
        name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`
      });
    }

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update assignment status (picked_up, in_transit, delivered)
router.put('/delivery/assignment/:id/status', protect, authorize('delivery', 'admin'), async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const assignment = await DeliveryAssignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if delivery boy is authorized
    if (req.user.role === 'delivery' && assignment.deliveryBoyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update assignment status
    assignment.status = status;
    assignment.timeline.push({
      status,
      timestamp: new Date(),
      location,
      note
    });

    if (status === 'delivered') {
      assignment.actualDeliveryTime = new Date();
      
      // Update delivery boy stats
      await DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoyId, {
        $inc: { totalDeliveries: 1 },
        status: 'online',
        currentOrderId: null
      });

      // Update order status
      await Order.findByIdAndUpdate(assignment.orderId, {
        orderStatus: 'delivered'
      });
    }

    if (status === 'picked_up') {
      await DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoyId, {
        status: 'busy'
      });
    }

    await assignment.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('assignment-update', assignment);
      
      // Notify customer
      const order = await Order.findById(assignment.orderId);
      if (order && order.user) {
        io.to(`user_${order.user}`).emit('order-status-update', {
          orderId: assignment.orderId,
          status,
          timestamp: new Date()
        });
      }
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete delivery boy
router.delete('/admin/delivery/boys/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.params.id);
    
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }
    
    // Check if boy has active assignments
    const activeAssignments = await DeliveryAssignment.findOne({
      deliveryBoyId: req.params.id,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
    });

    if (activeAssignments) {
      return res.status(400).json({ message: 'Cannot delete delivery boy with active assignments' });
    }
    
    await deliveryBoy.deleteOne();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('delivery-boy-deleted', req.params.id);
    }

    res.json({ success: true, message: 'Delivery boy removed successfully' });
  } catch (error) {
    console.error('Error deleting delivery boy:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;