// services/deliveryAssignmentService.js
const DeliveryBoy = require('../models/DeliveryBoy');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const Order = require('../models/Order');

class DeliveryAssignmentService {
  constructor(io) {
    this.io = io;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI/180);
  }

  // Find nearest available delivery boys
  async findNearestAvailableBoys(orderLocation, limit = 5) {
    try {
      const [lng, lat] = orderLocation.coordinates;

      const availableBoys = await DeliveryBoy.find({
        status: { $in: ['available', 'online'] },
        isActive: true,
        'location.coordinates': { $ne: [0, 0] }
      }).lean();

      // Calculate distances and sort
      const boysWithDistance = availableBoys.map(boy => {
        const [boyLng, boyLat] = boy.location?.coordinates || [0, 0];
        const distance = this.calculateDistance(lat, lng, boyLat, boyLng);
        return { ...boy, distance };
      });

      // Sort by distance and then by delivery count (fair distribution)
      return boysWithDistance
        .sort((a, b) => {
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
          return (a.totalDeliveries || 0) - (b.totalDeliveries || 0);
        })
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding nearest boys:', error);
      return [];
    }
  }

  // Auto-assign order to nearest available delivery boy
  async autoAssignOrder(orderId) {
    try {
      console.log(`🔄 Auto-assigning order: ${orderId}`);

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Get order delivery location
      const orderLocation = order.deliveryLocation || {
        coordinates: [77.2090, 28.6139], // Default to Delhi if not set
        type: 'Point'
      };

      // Find nearest available boys
      const nearestBoys = await this.findNearestAvailableBoys(orderLocation);

      if (nearestBoys.length === 0) {
        console.log('⚠️ No available delivery boys found');
        
        // Notify admin
        if (this.io) {
          this.io.to('admin_room').emit('no-delivery-boys', {
            orderId,
            message: 'No delivery boys available for assignment'
          });
        }
        
        return null;
      }

      // Try to assign to nearest boys in order
      for (const boy of nearestBoys) {
        try {
          const assignment = await this.assignOrderToBoy(orderId, boy._id, 'system');
          if (assignment) {
            return assignment;
          }
        } catch (error) {
          console.log(`Failed to assign to boy ${boy._id}:`, error.message);
          continue;
        }
      }

      console.log('⚠️ Could not assign to any available boy');
      return null;

    } catch (error) {
      console.error('❌ Auto-assign error:', error);
      return null;
    }
  }

  // Assign order to specific delivery boy
  async assignOrderToBoy(orderId, deliveryBoyId, assignedBy = 'system') {
    try {
      console.log(`📦 Assigning order ${orderId} to boy ${deliveryBoyId}`);

      // Check if boy is available
      const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
      if (!deliveryBoy || (deliveryBoy.status !== 'available' && deliveryBoy.status !== 'online') || !deliveryBoy.isActive) {
        throw new Error('Delivery boy not available');
      }

      // Check if order already assigned
      const existingAssignment = await DeliveryAssignment.findOne({
        orderId,
        status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
      });

      if (existingAssignment) {
        throw new Error('Order already assigned');
      }

      // Get order details
      const order = await Order.findById(orderId);

      // Calculate estimated delivery time based on distance
      const [orderLng, orderLat] = order.deliveryLocation?.coordinates || [77.2090, 28.6139];
      const [boyLng, boyLat] = deliveryBoy.location?.coordinates || [0, 0];
      
      const distance = this.calculateDistance(orderLat, orderLng, boyLat, boyLng);
      const estimatedTime = Math.max(15, Math.ceil(distance * 10)); // 10 mins per km, min 15 mins

      // Create assignment
      const assignment = await DeliveryAssignment.create({
        orderId,
        deliveryBoyId,
        assignedBy: assignedBy === 'system' ? null : assignedBy,
        status: 'assigned',
        estimatedTime: {
          pickup: 10,
          delivery: estimatedTime
        },
        timeline: [{
          status: 'assigned',
          timestamp: new Date(),
          note: `Order assigned to ${deliveryBoy.firstName} ${deliveryBoy.lastName}`
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
        deliveryStatus: 'assigned',
        deliveryBoy: deliveryBoyId,
        deliveryAssignment: assignment._id,
        estimatedDelivery: {
          start: new Date(),
          end: new Date(Date.now() + estimatedTime * 60000)
        },
        $push: {
          trackingHistory: {
            status: 'assigned',
            timestamp: new Date(),
            note: `Order assigned to delivery partner`
          }
        }
      });

      // Populate assignment for response
      const populatedAssignment = await DeliveryAssignment.findById(assignment._id)
        .populate('orderId')
        .populate('deliveryBoyId', 'firstName lastName phone vehicleType');

      // Emit socket events
      if (this.io) {
        this.io.to(`delivery_${deliveryBoyId}`).emit('new-order-assigned', {
          assignmentId: assignment._id,
          orderId,
          order: populatedAssignment.orderId,
          estimatedPickup: new Date(Date.now() + 10 * 60000),
          message: 'New order has been assigned to you'
        });

        this.io.to('admin_room').emit('assignment-created', {
          assignmentId: assignment._id,
          orderId,
          deliveryBoy: {
            id: deliveryBoyId,
            name: `${deliveryBoy.firstName} ${deliveryBoy.lastName}`
          }
        });

        // Notify customer
        if (order.user) {
          this.io.to(`user_${order.user}`).emit('order-assigned', {
            orderId,
            message: 'Your order has been assigned to a delivery partner',
            estimatedDelivery: new Date(Date.now() + estimatedTime * 60000)
          });
        }
      }

      console.log(`✅ Order ${orderId} assigned to ${deliveryBoy.firstName} ${deliveryBoy.lastName}`);

      return populatedAssignment;

    } catch (error) {
      console.error('❌ Assignment error:', error);
      throw error;
    }
  }

  // Handle order acceptance by delivery boy
  async acceptOrder(assignmentId, deliveryBoyId) {
    try {
      const assignment = await DeliveryAssignment.findById(assignmentId)
        .populate('orderId')
        .populate('deliveryBoyId');

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.deliveryBoyId._id.toString() !== deliveryBoyId) {
        throw new Error('Not authorized to accept this order');
      }

      assignment.status = 'accepted';
      assignment.acceptedAt = new Date();
      assignment.timeline.push({
        status: 'accepted',
        timestamp: new Date(),
        note: 'Order accepted by delivery boy'
      });

      await assignment.save();

      // Update order
      await Order.findByIdAndUpdate(assignment.orderId._id, {
        deliveryStatus: 'accepted',
        $push: {
          trackingHistory: {
            status: 'accepted',
            timestamp: new Date(),
            note: 'Order accepted by delivery partner'
          }
        }
      });

      // Notify customer
      if (assignment.orderId.user && this.io) {
        this.io.to(`user_${assignment.orderId.user}`).emit('order-accepted', {
          orderId: assignment.orderId._id,
          deliveryBoy: {
            name: `${assignment.deliveryBoyId.firstName} ${assignment.deliveryBoyId.lastName}`,
            phone: assignment.deliveryBoyId.phone,
            vehicleType: assignment.deliveryBoyId.vehicleType
          },
          estimatedPickup: new Date(Date.now() + 10 * 60000)
        });
      }

      // Notify admin
      if (this.io) {
        this.io.to('admin_room').emit('order-accepted', {
          orderId: assignment.orderId._id,
          deliveryBoy: assignment.deliveryBoyId
        });
      }

      return assignment;

    } catch (error) {
      console.error('❌ Accept order error:', error);
      throw error;
    }
  }
}

module.exports = DeliveryAssignmentService;