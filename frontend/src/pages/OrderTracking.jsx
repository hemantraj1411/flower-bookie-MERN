import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaBox, FaRupeeSign, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaUser, FaTruck, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaMotorcycle, FaStore, FaHome } from 'react-icons/fa';
import { GiFlowerEmblem, GiPlantRoots } from 'react-icons/gi';
import { MdDeliveryDining, MdLocationOn } from 'react-icons/md';
import { orderAPI } from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingStep, setTrackingStep] = useState(0);
  const [deliveryLocation, setDeliveryLocation] = useState({
    lat: 28.6139,
    lng: 77.2090,
    address: 'Delivery partner is on the way'
  });

  useEffect(() => {
    fetchOrder();
    // Simulate real-time tracking updates
    const interval = setInterval(() => {
      if (order && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled') {
        updateDeliveryLocation();
      }
    }, 5000); // Update every 5 seconds for demo

    return () => clearInterval(interval);
  }, [id, order?.orderStatus]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getById(id);
      setOrder(response.data);
      calculateTrackingStep(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrackingStep = (orderData) => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'picked', 'on_the_way', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderData.orderStatus);
    setTrackingStep(currentIndex >= 0 ? currentIndex : 0);
  };

  const updateDeliveryLocation = () => {
    // Simulate location movement (in real app, this would come from WebSocket/API)
    const locations = [
      { lat: 28.6129, lng: 77.2295, address: 'Near Rajiv Chowk' },
      { lat: 28.6029, lng: 77.2395, address: 'Approaching your location' },
      { lat: 28.5929, lng: 77.2495, address: '2 km away' },
      { lat: 28.5829, lng: 77.2595, address: '1 km away' },
      { lat: 28.5729, lng: 77.2695, address: 'Almost there' }
    ];
    
    if (order?.orderStatus === 'on_the_way') {
      const randomLoc = locations[Math.floor(Math.random() * locations.length)];
      setDeliveryLocation(randomLoc);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'picked': 'bg-indigo-100 text-indigo-800',
      'on_the_way': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <FaCheckCircle className="text-green-600 text-2xl" />;
      case 'cancelled': return <FaTimesCircle className="text-red-600 text-2xl" />;
      case 'on_the_way': return <FaMotorcycle className="text-orange-600 text-2xl" />;
      case 'picked': return <MdDeliveryDining className="text-indigo-600 text-2xl" />;
      case 'processing': return <FaClock className="text-purple-600 text-2xl" />;
      case 'confirmed': return <FaCheckCircle className="text-blue-600 text-2xl" />;
      default: return <FaBox className="text-gray-600 text-2xl" />;
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      'pending': 'Your order has been placed and is waiting for confirmation',
      'confirmed': 'Your order has been confirmed by the seller',
      'processing': 'Your order is being prepared',
      'picked': 'Your order has been picked up by our delivery partner',
      'on_the_way': 'Your order is on the way!',
      'delivered': 'Your order has been delivered successfully',
      'cancelled': 'Your order has been cancelled'
    };
    return messages[status] || 'Processing your order';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return Number(price || 0).toFixed(2);
  };

  const getEstimatedDelivery = () => {
    if (order?.estimatedDelivery?.end) {
      return formatDate(order.estimatedDelivery.end);
    }
    
    // Calculate estimated delivery based on current status
    const now = new Date();
    if (order?.orderStatus === 'on_the_way') {
      const eta = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
      return formatDate(eta);
    } else if (order?.orderStatus === 'picked') {
      const eta = new Date(now.getTime() + 45 * 60000); // 45 minutes
      return formatDate(eta);
    } else if (order?.orderStatus === 'processing') {
      const eta = new Date(now.getTime() + 60 * 60000); // 60 minutes
      return formatDate(eta);
    }
    return 'Calculating...';
  };

  if (loading) return <Loader />;
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <FaExclamationTriangle className="text-6xl text-red-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Order not found</h2>
      </div>
    </div>
  );

  const isCancelled = order.orderStatus === 'cancelled';
  const isDelivered = order.orderStatus === 'delivered';
  const isOnTheWay = order.orderStatus === 'on_the_way';

  const steps = [
    { key: 'order_placed', label: 'Order Placed', time: order.createdAt, icon: FaBox },
    { key: 'confirmed', label: 'Confirmed', time: order.timeline?.find(t => t.status === 'confirmed')?.timestamp, icon: FaCheckCircle },
    { key: 'processing', label: 'Processing', time: order.timeline?.find(t => t.status === 'processing')?.timestamp, icon: FaClock },
    { key: 'picked', label: 'Picked', time: order.timeline?.find(t => t.status === 'picked')?.timestamp, icon: MdDeliveryDining },
    { key: 'out_for_delivery', label: 'Out for Delivery', time: order.timeline?.find(t => t.status === 'out_for_delivery')?.timestamp, icon: FaMotorcycle },
    { key: 'delivered', label: 'Delivered', time: order.deliveredAt, icon: FaCheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/orders" className="text-pink-600 hover:text-pink-700 flex items-center">
            ← Back to Orders
          </Link>
          <span className="text-sm text-gray-500">Order #{order._id?.slice(-8)}</span>
        </div>

        {/* Live Tracking Banner for On The Way Orders */}
        {isOnTheWay && (
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaMotorcycle className="text-3xl mr-3" />
                <div>
                  <h3 className="font-bold text-lg">Your order is on the way!</h3>
                  <p className="text-sm opacity-90">Estimated delivery: {getEstimatedDelivery()}</p>
                </div>
              </div>
              <div className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold">
                LIVE
              </div>
            </div>
          </div>
        )}

        {/* Main Tracking Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          {/* Status Header */}
          <div className={`p-6 ${getStatusColor(order.orderStatus)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(order.orderStatus)}
                <div className="ml-3">
                  <h2 className="text-xl font-bold">
                    {order.orderStatus?.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h2>
                  <p className="text-sm opacity-90">{getStatusMessage(order.orderStatus)}</p>
                </div>
              </div>
              {!isDelivered && !isCancelled && (
                <div className="text-right">
                  <p className="text-sm font-medium">Expected by</p>
                  <p className="text-lg font-bold">{getEstimatedDelivery()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Map for On The Way Orders */}
          {isOnTheWay && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <MdLocationOn className="text-pink-600 mr-2" />
                Live Location
              </h3>
              <div className="bg-gray-100 h-48 rounded-lg relative overflow-hidden">
                {/* Simulated Map - In production, use actual map component like Google Maps */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                  <div className="relative h-full">
                    {/* Store Location */}
                    <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg flex items-center">
                      <FaStore className="text-blue-600 mr-2" />
                      <span className="text-xs">Store</span>
                    </div>
                    
                    {/* Delivery Partner */}
                    <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg flex items-center animate-bounce">
                      <FaMotorcycle className="text-orange-600 mr-2" />
                      <span className="text-xs">{deliveryLocation.address}</span>
                    </div>
                    
                    {/* Delivery Line */}
                    <svg className="absolute inset-0 w-full h-full">
                      <line 
                        x1="20%" y1="20%" 
                        x2="80%" y2="80%" 
                        stroke="#ec4899" 
                        strokeWidth="2" 
                        strokeDasharray="5,5"
                      />
                      <circle cx="20%" cy="20%" r="8" fill="#3b82f6" />
                      <circle cx="80%" cy="80%" r="8" fill="#f97316" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          {!isCancelled && (
            <div className="p-6">
              <h3 className="font-bold text-gray-800 mb-6">Tracking Timeline</h3>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
                  <div 
                    className="h-full bg-pink-600 transition-all duration-500"
                    style={{ width: `${(trackingStep / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>
                
                {/* Timeline Steps */}
                <div className="relative flex justify-between">
                  {steps.map((step, index) => {
                    const isCompleted = order.timeline?.some(t => t.status === step.key) || 
                                      (step.key === 'delivered' && isDelivered) ||
                                      (step.key === 'order_placed' && order.createdAt);
                    const isActive = trackingStep >= index;
                    
                    return (
                      <div key={step.key} className="text-center relative z-10" style={{ width: `${100/steps.length}%` }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${
                          isCompleted ? 'bg-green-500 text-white scale-110' :
                          isActive ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <step.icon size={18} />
                        </div>
                        <p className={`text-xs font-medium ${
                          isActive ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            {formatDate(step.time).split(',')[0]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Cancelled Message */}
          {isCancelled && (
            <div className="p-6 bg-red-50">
              <div className="flex items-center">
                <FaTimesCircle className="text-red-600 text-3xl mr-3" />
                <div>
                  <h3 className="font-bold text-red-800">Order Cancelled</h3>
                  <p className="text-red-600 text-sm">
                    {order.cancellation?.reason || 'Order was cancelled'}
                    {order.cancellation?.cancelledBy === 'user' ? ' by you' : ' by seller'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <FaBox className="mr-2 text-pink-600" />
              Order Items
            </h3>
            <div className="space-y-4">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      {item.type === 'indoor' ? (
                        <GiPlantRoots className="text-2xl text-green-600" />
                      ) : (
                        <GiFlowerEmblem className="text-2xl text-pink-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold text-pink-600 flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-pink-600" />
              Delivery Address
            </h3>
            <div className="space-y-2">
              <p className="text-gray-800 font-medium">
                {order.shippingAddress?.addressLine1}
              </p>
              {order.shippingAddress?.addressLine2 && (
                <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-gray-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                <FaPhone className="text-pink-600 mr-2" />
                <span>{order.shippingAddress?.phone}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2 text-pink-600" />
              Payment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {formatPrice(order.itemsPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {order.shippingPrice === 0 ? 'Free' : 
                      <span className="flex items-center">
                        <FaRupeeSign className="mr-1 text-xs" />
                        {formatPrice(order.shippingPrice)}
                      </span>
                    }
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST)</span>
                  <span className="flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {formatPrice(order.taxPrice)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-pink-600 flex items-center">
                    <FaRupeeSign className="mr-1" />
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Payment Method</span>
                  <span className="capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Payment Status</span>
                  <span className={`capitalize ${
                    order.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          {order.orderStatus === 'pending' && !isCancelled && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  toast.success('Order cancellation requested');
                }
              }}
              className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
          <Link
            to="/shop"
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;