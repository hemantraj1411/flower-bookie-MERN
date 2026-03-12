// socket/socketServer.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Add ping timeout and interval for better connection handling
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role || 'user';
      
      console.log(`✅ Socket authenticated: User ${socket.userId} (Role: ${socket.userRole})`);
      
      next();
    } catch (err) {
      console.error('❌ Socket authentication error:', err.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`);

    // Join role-specific rooms
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
      console.log(`👑 Admin joined admin_room: ${socket.userId}`);
    } else if (socket.userRole === 'delivery') {
      socket.join('delivery_room');
      socket.join(`delivery_${socket.userId}`);
      console.log(`🛵 Delivery boy joined delivery_room: ${socket.userId}`);
    } else {
      socket.join('user_room');
    }

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // ============ DELIVERY BOY LOCATION UPDATES ============
    socket.on('update-location', async (data) => {
      try {
        if (socket.userRole === 'delivery') {
          const { lat, lng, accuracy, heading, speed } = data;
          
          console.log(`📍 Location update from delivery boy ${socket.userId}:`, { lat, lng });

          // Update delivery boy's location in database
          await DeliveryBoy.findByIdAndUpdate(socket.userId, {
            'currentLocation': {
              type: 'Point',
              coordinates: [lng, lat], // GeoJSON format [longitude, latitude]
              accuracy: accuracy || 0,
              heading: heading || 0,
              speed: speed || 0
            },
            'location.lastUpdated': new Date()
          });

          // Find active assignment for this delivery boy
          const activeAssignment = await DeliveryAssignment.findOne({
            deliveryBoyId: socket.userId,
            status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
          }).populate('orderId');

          if (activeAssignment && activeAssignment.orderId) {
            // Broadcast location to admin
            io.to('admin_room').emit('delivery-location-update', {
              deliveryBoyId: socket.userId,
              orderId: activeAssignment.orderId._id,
              location: { lat, lng },
              timestamp: new Date()
            });

            // Broadcast location to customer if order exists
            if (activeAssignment.orderId.user) {
              io.to(`user_${activeAssignment.orderId.user}`).emit('driver-location', {
                orderId: activeAssignment.orderId._id,
                location: { lat, lng },
                timestamp: new Date()
              });
            }
          }

          // Also emit to all connected clients for real-time tracking
          socket.broadcast.emit('location-updated', {
            deliveryBoyId: socket.userId,
            location: { lat, lng },
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('❌ Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // ============ JOIN DELIVERY ROOM ============
    socket.on('join-delivery-room', (deliveryBoyId) => {
      socket.join(`delivery-${deliveryBoyId}`);
      console.log(`🚚 Delivery boy ${deliveryBoyId} joined room delivery-${deliveryBoyId}`);
    });

    // ============ JOIN ORDER ROOM ============
    socket.on('join-order-room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`📦 Joined order room: order_${orderId}`);
    });

    // ============ JOIN ADMIN ROOM ============
    socket.on('join-admin', () => {
      socket.join('admin_room');
      console.log(`👑 Admin joined admin_room: ${socket.userId}`);
    });

    // ============ ORDER ACCEPTANCE ============
    socket.on('accept-order', async (data) => {
      try {
        const { assignmentId } = data;
        
        console.log(`✅ Order acceptance received: ${assignmentId} from delivery boy ${socket.userId}`);

        const assignment = await DeliveryAssignment.findById(assignmentId)
          .populate('orderId')
          .populate('deliveryBoyId', 'firstName lastName phone vehicleType');

        if (!assignment) {
          socket.emit('error', { message: 'Assignment not found' });
          return;
        }

        // Update assignment status
        assignment.status = 'accepted';
        assignment.acceptedAt = new Date();
        assignment.timeline.push({
          status: 'accepted',
          timestamp: new Date(),
          note: 'Order accepted by delivery boy'
        });

        // Update delivery boy status
        await DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoyId._id, {
          status: 'busy',
          currentOrderId: assignment.orderId._id
        });

        // Update order status
        await Order.findByIdAndUpdate(assignment.orderId._id, {
          orderStatus: 'accepted',
          deliveryStatus: 'assigned'
        });

        await assignment.save();

        // Emit to admin
        io.to('admin_room').emit('order-accepted', {
          orderId: assignment.orderId._id,
          deliveryBoy: {
            id: assignment.deliveryBoyId._id,
            name: `${assignment.deliveryBoyId.firstName} ${assignment.deliveryBoyId.lastName}`,
            phone: assignment.deliveryBoyId.phone,
            vehicleType: assignment.deliveryBoyId.vehicleType
          },
          estimatedPickup: new Date(Date.now() + 10 * 60000),
          timestamp: new Date()
        });

        // Emit to customer
        if (assignment.orderId.user) {
          io.to(`user_${assignment.orderId.user}`).emit('order-accepted', {
            orderId: assignment.orderId._id,
            message: 'Your order has been accepted by a delivery partner',
            deliveryBoy: {
              name: `${assignment.deliveryBoyId.firstName} ${assignment.deliveryBoyId.lastName}`,
              phone: assignment.deliveryBoyId.phone,
              vehicleType: assignment.deliveryBoyId.vehicleType
            },
            estimatedDelivery: new Date(Date.now() + assignment.estimatedTime.delivery * 60000)
          });
        }

        console.log(`✅ Order ${assignment.orderId._id} accepted by delivery boy ${assignment.deliveryBoyId._id}`);

      } catch (error) {
        console.error('❌ Order acceptance error:', error);
        socket.emit('error', { message: 'Failed to accept order' });
      }
    });

    // ============ ORDER REJECTION ============
    socket.on('reject-order', async (data) => {
      try {
        const { assignmentId, reason } = data;
        
        console.log(`❌ Order rejection received: ${assignmentId} from delivery boy ${socket.userId}`);

        const assignment = await DeliveryAssignment.findById(assignmentId)
          .populate('orderId');

        if (!assignment) {
          socket.emit('error', { message: 'Assignment not found' });
          return;
        }

        // Update assignment status
        assignment.status = 'rejected';
        assignment.rejectionReason = reason || 'No reason provided';
        assignment.timeline.push({
          status: 'rejected',
          timestamp: new Date(),
          note: reason || 'Order rejected by delivery boy'
        });

        await assignment.save();

        // Update delivery boy status back to available
        await DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoyId, {
          status: 'available',
          currentOrderId: null
        });

        // Auto-assign to next available delivery boy
        const newAssignment = await autoAssignDelivery(assignment.orderId._id);

        // Notify admin
        io.to('admin_room').emit('order-rejected', {
          orderId: assignment.orderId._id,
          rejectedBy: socket.userId,
          reason: reason,
          newAssignment: newAssignment?._id,
          timestamp: new Date()
        });

        console.log(`❌ Order ${assignment.orderId._id} rejected, auto-assigning to next available`);

      } catch (error) {
        console.error('❌ Order rejection error:', error);
        socket.emit('error', { message: 'Failed to reject order' });
      }
    });

    // ============ ORDER PICKED UP ============
    socket.on('order-picked-up', async (data) => {
      try {
        const { orderId, location } = data;
        
        console.log(`📦 Order picked up: ${orderId} by delivery boy ${socket.userId}`);

        const assignment = await DeliveryAssignment.findOne({
          orderId: orderId,
          deliveryBoyId: socket.userId,
          status: 'accepted'
        }).populate('orderId');

        if (assignment) {
          assignment.status = 'picked_up';
          assignment.pickedUpAt = new Date();
          assignment.timeline.push({
            status: 'picked_up',
            timestamp: new Date(),
            location: location,
            note: 'Order picked up from store'
          });
          await assignment.save();

          // Update order status
          await Order.findByIdAndUpdate(orderId, {
            orderStatus: 'picked_up',
            deliveryStatus: 'in_transit'
          });

          // Notify admin
          io.to('admin_room').emit('status-update', {
            orderId,
            status: 'picked_up',
            message: 'Order has been picked up',
            timestamp: new Date()
          });

          // Notify customer
          if (assignment.orderId.user) {
            io.to(`user_${assignment.orderId.user}`).emit('status-update', {
              orderId,
              status: 'picked_up',
              message: 'Your order has been picked up and is on the way',
              estimatedDelivery: new Date(Date.now() + 30 * 60000),
              timestamp: new Date()
            });
          }

          console.log(`✅ Order ${orderId} picked up successfully`);
        }
      } catch (error) {
        console.error('❌ Pickup error:', error);
        socket.emit('error', { message: 'Failed to confirm pickup' });
      }
    });

    // ============ ORDER DELIVERED ============
    socket.on('order-delivered', async (data) => {
      try {
        const { orderId, proofImage, notes, recipientName } = data;
        
        console.log(`✅ Order delivered: ${orderId} by delivery boy ${socket.userId}`);

        const assignment = await DeliveryAssignment.findOne({
          orderId: orderId,
          deliveryBoyId: socket.userId,
          status: { $in: ['picked_up', 'in_transit'] }
        }).populate('orderId');

        if (assignment) {
          assignment.status = 'delivered';
          assignment.deliveredAt = new Date();
          assignment.deliveryProof = proofImage;
          assignment.deliveryNotes = notes;
          assignment.recipientName = recipientName;
          assignment.timeline.push({
            status: 'delivered',
            timestamp: new Date(),
            note: `Order delivered to ${recipientName || 'customer'}`
          });
          
          // Update order status
          await Order.findByIdAndUpdate(orderId, {
            orderStatus: 'delivered',
            deliveredAt: new Date(),
            deliveryNotes: notes
          });

          // Update delivery boy stats
          await DeliveryBoy.findByIdAndUpdate(socket.userId, {
            $inc: { totalDeliveries: 1 },
            status: 'available',
            currentOrderId: null
          });

          await assignment.save();

          // Notify admin
          io.to('admin_room').emit('order-delivered', {
            orderId,
            deliveredBy: socket.userId,
            deliveredAt: new Date(),
            proofImage,
            timestamp: new Date()
          });

          // Notify customer
          if (assignment.orderId.user) {
            io.to(`user_${assignment.orderId.user}`).emit('order-delivered', {
              orderId,
              message: 'Your order has been delivered!',
              deliveredAt: new Date()
            });
          }

          console.log(`✅ Order ${orderId} delivered successfully`);
        }
      } catch (error) {
        console.error('❌ Delivery confirmation error:', error);
        socket.emit('error', { message: 'Failed to confirm delivery' });
      }
    });

    // ============ ASSIGN ORDER (Admin) ============
    socket.on('assign-order', async (data) => {
      try {
        const { assignmentId, orderId, boyId } = data;
        
        console.log(`📋 Order assigned: ${orderId} to delivery boy ${boyId}`);

        // Notify delivery boy
        io.to(`delivery_${boyId}`).emit('new-order-assigned', {
          assignmentId,
          orderId,
          message: 'New order has been assigned to you',
          timestamp: new Date()
        });

        // Notify admin room
        io.to('admin_room').emit('assignment-created', {
          assignmentId,
          orderId,
          boyId,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ Assignment notification error:', error);
      }
    });

    // ============ DELIVERY STATUS CHANGE ============
    socket.on('delivery-status-change', (data) => {
      try {
        const { deliveryBoyId, status, isActive, name } = data;
        
        console.log(`🔄 Delivery boy ${name} status changed to ${status}`);

        // Broadcast to admin room
        io.to('admin_room').emit('delivery-status-change', {
          deliveryBoyId,
          status,
          isActive,
          name,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ Status broadcast error:', error);
      }
    });

    // ============ NEW DELIVERY BOY ADDED ============
    socket.on('new-delivery-boy', (data) => {
      try {
        console.log(`🆕 New delivery boy added: ${data.firstName} ${data.lastName}`);
        
        // Broadcast to admin room
        io.to('admin_room').emit('new-delivery-boy', data);
      } catch (error) {
        console.error('❌ New delivery boy broadcast error:', error);
      }
    });

    // ============ DISCONNECT HANDLER ============
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${socket.id} (${socket.userId}) - Reason: ${reason}`);
      
      // Update delivery boy status if they disconnect while busy
      if (socket.userRole === 'delivery') {
        DeliveryBoy.findByIdAndUpdate(socket.userId, {
          status: 'offline',
          'location.lastUpdated': new Date()
        }).catch(err => console.error('Error updating offline status:', err));
      }
    });

    // ============ ERROR HANDLER ============
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

// Auto-assignment function for rejected orders
const autoAssignDelivery = async (orderId) => {
  try {
    console.log(`🔄 Auto-assigning order ${orderId} to next available delivery boy`);

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found for auto-assignment');
      return null;
    }

    // Find available delivery boys (online/available)
    const availableBoys = await DeliveryBoy.find({
      status: { $in: ['available', 'online'] },
      isActive: true
    }).sort({ totalDeliveries: 1, rating: -1 });

    if (availableBoys.length === 0) {
      console.log('⚠️ No delivery boys available for auto-assignment');
      
      // Notify admin about no delivery boys
      io.to('admin_room').emit('no-delivery-boys', { 
        orderId,
        message: 'No delivery boys available for auto-assignment'
      });
      return null;
    }

    // Select the boy with least deliveries (fair distribution)
    const selectedBoy = availableBoys[0];

    // Create new assignment
    const assignment = await DeliveryAssignment.create({
      orderId,
      deliveryBoyId: selectedBoy._id,
      assignedBy: 'system',
      status: 'assigned',
      estimatedTime: {
        pickup: 10,
        delivery: 30
      },
      timeline: [{
        status: 'assigned',
        timestamp: new Date(),
        note: 'Auto-assigned to next available delivery boy'
      }]
    });

    // Update delivery boy status
    await DeliveryBoy.findByIdAndUpdate(selectedBoy._id, {
      status: 'busy',
      currentOrderId: orderId,
      $push: { assignedOrders: orderId }
    });

    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      orderStatus: 'assigned',
      deliveryAssignment: assignment._id
    });

    // Populate assignment data
    const populatedAssignment = await DeliveryAssignment.findById(assignment._id)
      .populate('orderId')
      .populate('deliveryBoyId', 'firstName lastName phone vehicleType');

    // Notify delivery boy
    io.to(`delivery_${selectedBoy._id}`).emit('new-order-assigned', {
      assignmentId: assignment._id,
      orderId,
      order: populatedAssignment.orderId,
      estimatedPickup: new Date(Date.now() + 10 * 60000),
      message: 'New order has been auto-assigned to you'
    });

    // Notify admin
    io.to('admin_room').emit('auto-assigned', {
      orderId,
      assignmentId: assignment._id,
      deliveryBoy: {
        id: selectedBoy._id,
        name: `${selectedBoy.firstName} ${selectedBoy.lastName}`,
        phone: selectedBoy.phone
      },
      timestamp: new Date()
    });

    console.log(`✅ Order ${orderId} auto-assigned to ${selectedBoy.firstName} ${selectedBoy.lastName}`);
    
    return populatedAssignment;
  } catch (error) {
    console.error('❌ Auto-assign error:', error);
    return null;
  }
};

// Helper function to send SMS notifications (implement with Twilio later)
const sendDeliveryNotification = async (phone, status, orderDetails) => {
  // TODO: Implement Twilio integration
  console.log(`📱 Would send ${status} notification to ${phone}`, orderDetails);
};

// Export both the initializer and helper functions
module.exports = { 
  initializeSocket, 
  autoAssignDelivery,
  sendDeliveryNotification 
};