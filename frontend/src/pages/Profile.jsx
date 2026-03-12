import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaBox, FaRupeeSign, FaCalendarAlt, FaShoppingBag } from 'react-icons/fa';
import { orderAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      console.log('Orders fetched:', response.data);
      
      // Handle both array response and wrapped response
      const ordersData = Array.isArray(response.data) ? response.data : 
                        (response.data.data || []);
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await orderAPI.cancelOrder(orderId, { reason: 'Cancelled by user' });
      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh orders instead of reloading page
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return 'User';
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'out_for_delivery': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'order_placed': 'bg-gray-100 text-gray-800',
      'payment_completed': 'bg-green-100 text-green-800'
    };
    
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    
    const statusMap = {
      'out_for_delivery': 'Out for Delivery',
      'order_placed': 'Order Placed',
      'payment_completed': 'Payment Completed'
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-gray-800 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">
                    {getInitials()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{getFullName()}</h2>
                <p className="text-gray-500">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>

              {!isEditing ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="w-5 h-5 mr-3 text-pink-600" />
                      <span>{user?.email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="w-5 h-5 mr-3 text-pink-600" />
                      <span>{user?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-start text-gray-600">
                      <FaMapMarkerAlt className="w-5 h-5 mr-3 text-pink-600 mt-1" />
                      <span>{user?.address || 'No address provided'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <FaEdit />
                    <span>Edit Profile</span>
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 btn-primary flex items-center justify-center space-x-2"
                    >
                      <FaSave />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          address: user?.address || ''
                        });
                      }}
                      className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                    >
                      <FaTimes />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaShoppingBag className="mr-2 text-pink-600" />
                Order History
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-12">
                  <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link to="/shop" className="btn-primary inline-block">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Order #{order._id?.slice(-8).toUpperCase() || 'N/A'}</p>
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
                      <div className="space-y-2 mb-4">
                        {order.orderItems && order.orderItems.length > 0 ? (
                          order.orderItems.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.quantity || 0}x {item.name || 'Product'}
                              </span>
                              <span className="font-medium flex items-center">
                                <FaRupeeSign className="mr-1 text-xs" />
                                {formatPrice(item.price * (item.quantity || 1))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No items in this order</p>
                        )}
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="mb-4">
                          <p className="text-sm font-medium flex items-center text-gray-600">
                            <FaMapMarkerAlt className="mr-2 text-pink-600" />
                            Deliver to: {order.shippingAddress.addressLine1}, {order.shippingAddress.city}
                          </p>
                        </div>
                      )}

                      {/* Payment Status */}
                      {order.paymentStatus && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            Payment: {order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus}
                            {order.paidAt && ` on ${formatDate(order.paidAt)}`}
                          </p>
                        </div>
                      )}

                      {/* Tracking History */}
                      {order.trackingHistory && order.trackingHistory.length > 0 && (
                        <div className="mb-4">
                          <details className="text-sm">
                            <summary className="text-pink-600 cursor-pointer font-medium">
                              View Tracking History
                            </summary>
                            <div className="mt-2 space-y-1 pl-2">
                              {order.trackingHistory.map((track, idx) => (
                                <div key={idx} className="flex justify-between text-gray-600">
                                  <span>{getStatusText(track.status)}</span>
                                  <span className="text-xs">{formatDate(track.timestamp)}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="font-bold flex items-center">
                          Total: <FaRupeeSign className="ml-1 mr-1 text-xs" /> {formatPrice(order.totalPrice)}
                        </span>
                        <div className="flex space-x-3">
                          <Link
                            to={`/order/${order._id}`}
                            className="text-pink-600 hover:text-pink-700 font-medium"
                          >
                            View Details →
                          </Link>
                          
                          {order.orderStatus !== 'cancelled' && 
                           order.orderStatus !== 'delivered' && 
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
        </div>
      </div>
    </div>
  );
};

export default Profile;