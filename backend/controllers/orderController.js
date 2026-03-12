// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryAssignmentService = require('../services/deliveryAssignmentService');

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    console.log('🔍 Fetching orders for user:', req.user._id);
    
    // Validate user exists
    if (!req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Find orders with error handling for each populate
    let orders = [];
    try {
      orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate({
          path: 'orderItems.product',
          select: 'name price image'
        })
        .populate({
          path: 'deliveryBoy',
          select: 'firstName lastName phone'
        })
        .lean(); // Use lean() for better performance
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      return res.status(500).json({ 
        success: false,
        message: 'Database error while fetching orders',
        error: dbError.message 
      });
    }

    console.log(`✅ Found ${orders.length} orders for user ${req.user._id}`);

    // Return orders (even if empty array)
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('❌ Get orders error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Fetching order ${id} for user ${req.user._id}`);

    // Validate order ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid order ID format' 
      });
    }

    const order = await Order.findById(id)
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'orderItems.product',
        select: 'name price image'
      })
      .populate('deliveryBoy', 'firstName lastName phone vehicleType')
      .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check authorization
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this order' 
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Get order by ID error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order',
      error: error.message 
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    console.log('📦 Creating order for user:', req.user._id);

    // Validate required fields
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No order items' 
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({ 
        success: false,
        message: 'Shipping address is required' 
      });
    }

    // Create delivery location from shipping address
    const deliveryLocation = {
      type: 'Point',
      coordinates: [
        shippingAddress.lng || 77.2090,
        shippingAddress.lat || 28.6139
      ],
      address: `${shippingAddress.addressLine1}, ${shippingAddress.city}`
    };

    // Create order with safe defaults
    const order = new Order({
      user: req.user._id,
      orderItems: orderItems.map(item => ({
        ...item,
        product: item.productId || item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      itemsPrice: itemsPrice || 0,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      totalPrice: totalPrice || 0,
      deliveryLocation,
      deliveryStatus: 'pending',
      orderStatus: 'pending',
      paymentStatus: 'pending',
      trackingHistory: [{
        status: 'order_placed',
        timestamp: new Date(),
        note: 'Order placed successfully'
      }]
    });

    // Save order
    const createdOrder = await order.save();
    console.log('✅ Order created:', createdOrder._id);

    // Auto-assign delivery boy if payment is completed
    if (createdOrder.paymentStatus === 'completed') {
      try {
        const io = req.app.get('io');
        const assignmentService = new DeliveryAssignmentService(io);
        
        setTimeout(async () => {
          try {
            await assignmentService.autoAssignOrder(createdOrder._id);
          } catch (error) {
            console.error('Auto-assignment error:', error);
          }
        }, 5000);
      } catch (assignError) {
        console.error('Assignment service error:', assignError);
        // Don't fail the order creation if assignment fails
      }
    }

    res.status(201).json({
      success: true,
      data: createdOrder
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order',
      error: error.message 
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'completed';
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address
    };

    order.trackingHistory.push({
      status: 'payment_completed',
      timestamp: new Date(),
      note: 'Payment completed successfully'
    });

    const updatedOrder = await order.save();
    console.log('✅ Order payment updated:', order._id);

    // Try to auto-assign delivery boy
    try {
      const io = req.app.get('io');
      const assignmentService = new DeliveryAssignmentService(io);
      setTimeout(async () => {
        try {
          await assignmentService.autoAssignOrder(order._id);
        } catch (error) {
          console.error('Auto-assignment error after payment:', error);
        }
      }, 2000);
    } catch (assignError) {
      console.error('Assignment service error:', assignError);
    }

    res.json({
      success: true,
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Update order to paid error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update payment',
      error: error.message 
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check if order can be cancelled
    if (order.orderStatus === 'delivered') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot cancel delivered order' 
      });
    }

    if (order.orderStatus === 'out_for_delivery') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot cancel order that is out for delivery' 
      });
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = req.body.reason || 'User cancelled';
    
    order.trackingHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: order.cancellationReason
    });

    const updatedOrder = await order.save();
    console.log('✅ Order cancelled:', order._id);

    res.json({
      success: true,
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to cancel order',
      error: error.message 
    });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'delivered';
    order.deliveryStatus = 'delivered';
    
    order.trackingHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      note: 'Order delivered successfully'
    });

    const updatedOrder = await order.save();
    console.log('✅ Order delivered:', order._id);

    res.json({
      success: true,
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Update order to delivered error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update delivery',
      error: error.message 
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  cancelOrder
};