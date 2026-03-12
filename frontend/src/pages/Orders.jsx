// frontend/src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBox, FaRupeeSign, FaCalendarAlt, FaMapMarkerAlt, FaTruck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Orders = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching orders...');
      
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Orders fetched:', response.data);

      // Handle different response formats
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        ordersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Wrapped response { data: [...] }
        ordersData = response.data.data;
      } else if (response.data?.orders && Array.isArray(response.data.orders)) {
        // Response { orders: [...] }
        ordersData = response.data.orders;
      } else if (response.data && typeof response.data === 'object') {
        // Single order object? Convert to array
        if (response.data._id) {
          ordersData = [response.data];
        } else {
          // Try to find any array property
          const possibleArray = Object.values(response.data).find(val => Array.isArray(val));
          if (possibleArray) {
            ordersData = possibleArray;
          }
        }
      }

      console.log('📦 Processed orders data:', ordersData);
      setOrders(ordersData);
      setError(null);

    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'picked': 'bg-indigo-100 text-indigo-800',
      'on_the_way': 'bg-orange-100 text-orange-800',
      'out_for_delivery': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'order_placed': 'bg-gray-100 text-gray-800',
      'payment_completed': 'bg-green-100 text-green-800'
    };
    
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    
    const statusMap = {
      'on_the_way': 'On The Way',
      'out_for_delivery': 'Out for Delivery',
      'order_placed': 'Order Placed',
      'payment_completed': 'Payment Completed'
    };
    
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0.00';
    return Number(price).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={fetchOrders}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link to="/shop" className="btn-primary inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                {/* Order Header */}
                <div className="flex flex-wrap justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono text-sm">#{order._id?.slice(-8).toUpperCase()}</p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus || order.status)}`}>
                    {getStatusText(order.orderStatus || order.status)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="border-t border-b py-4 my-4">
                  <p className="font-medium mb-2">Items ({order.orderItems?.length || 0})</p>
                  <div className="space-y-2">
                    {order.orderItems && order.orderItems.length > 0 ? (
                      order.orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded mr-3"
                                onError={(e) => e.target.src = '/placeholder.png'}
                              />
                            )}
                            <span>
                              {item.name || 'Product'} x {item.quantity || 1}
                            </span>
                          </div>
                          <span className="font-medium flex items-center">
                            <FaRupeeSign className="mr-1 text-xs" />
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No items in this order</p>
                    )}
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div>
                      <p className="font-medium flex items-center mb-1">
                        <FaMapMarkerAlt className="mr-1 text-pink-600" />
                        Delivery Address
                      </p>
                      <p className="text-gray-600">
                        {order.shippingAddress.addressLine1}<br />
                        {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                        Phone: {order.shippingAddress.phone}
                      </p>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div>
                    <p className="font-medium flex items-center mb-1">
                      <FaRupeeSign className="mr-1 text-pink-600" />
                      Payment Details
                    </p>
                    <p className="text-gray-600">
                      Method: {order.paymentMethod === 'razorpay' ? 'Online' : order.paymentMethod?.toUpperCase()}<br />
                      Status: <span className={order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                        {order.paymentStatus || 'Pending'}
                      </span><br />
                      {order.paidAt && <>Paid on: {formatDate(order.paidAt)}</>}
                    </p>
                  </div>

                  {/* Delivery Info */}
                  {order.deliveryBoy && (
                    <div>
                      <p className="font-medium flex items-center mb-1">
                        <FaTruck className="mr-1 text-pink-600" />
                        Delivery Partner
                      </p>
                      <p className="text-gray-600">
                        {order.deliveryBoy.firstName} {order.deliveryBoy.lastName}<br />
                        {order.deliveryBoy.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Total and Actions */}
                <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t">
                  <div className="font-bold text-lg">
                    Total: <span className="flex items-center inline-flex text-pink-600">
                      <FaRupeeSign className="mr-1" />
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                  <div className="space-x-3">
                    <Link
                      to={`/order/${order._id}`}
                      className="text-pink-600 hover:text-pink-700 font-medium"
                    >
                      View Details →
                    </Link>
                    
                    {order.orderStatus !== 'cancelled' && 
                     order.orderStatus !== 'delivered' && 
                     order.orderStatus !== 'on_the_way' && 
                     order.orderStatus !== 'out_for_delivery' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Cancel order function
const handleCancelOrder = async (orderId) => {
  if (!window.confirm('Are you sure you want to cancel this order?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    await axios.put(
      `${API_URL}/api/orders/${orderId}/cancel`,
      { reason: 'Cancelled by user' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    toast.success('Order cancelled successfully');
    
    // Refresh orders
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to cancel order');
  }
};

export default Orders;