import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { FaShoppingBag, FaEye, FaRupeeSign, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaSearch, FaFilter, FaSync, FaCheckCircle, FaTimesCircle, FaTruck, FaBox } from 'react-icons/fa';
import { GiFlowerEmblem, GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

const Orders = () => {
  const { orders, fetchOrders, updateOrderStatus, loading } = useAdmin();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders && orders.length > 0) {
      filterOrders();
    } else {
      setFilteredOrders([]);
    }
  }, [orders, searchTerm, statusFilter]);

  const filterOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      await fetchOrders();
      toast.success(`Order status updated to ${newStatus}`);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId, reason) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const success = await updateOrderStatus(orderId, 'cancelled');
      if (success) {
        toast.success('Order cancelled successfully');
        await fetchOrders();
      }
    }
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
    if (!price && price !== 0) return '0';
    return Number(price).toFixed(2);
  };

  const getStatusBadge = (status) => {
    if (!status) return { color: 'bg-gray-100 text-gray-800', icon: <FaBox className="mr-1" /> };
    
    switch(status.toLowerCase()) {
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="mr-1" /> };
      case 'shipped':
        return { color: 'bg-blue-100 text-blue-800', icon: <FaTruck className="mr-1" /> };
      case 'processing':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <FaSync className="mr-1 animate-spin" /> };
      case 'pending':
        return { color: 'bg-orange-100 text-orange-800', icon: <FaBox className="mr-1" /> };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: <FaTimesCircle className="mr-1" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <FaBox className="mr-1" /> };
    }
  };

  const getProductIcon = (item) => {
    if (item?.type === 'indoor' || item?.product?.type === 'indoor') {
      return <GiPlantRoots className="text-green-600" />;
    }
    return <GiFlowerEmblem className="text-pink-600" />;
  };

  if (loading && !orders.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center">
          <FaShoppingBag className="mr-3 text-pink-600" />
          Order Management
        </h1>
        <button
          onClick={() => fetchOrders()}
          className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800">{orders?.length || 0}</p>
            </div>
            <div className="bg-pink-100 p-3 rounded-lg">
              <FaShoppingBag className="text-2xl text-pink-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-3xl font-bold text-orange-600">
                {orders?.filter(o => o.orderStatus === 'pending').length || 0}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <FaBox className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Processing</p>
              <p className="text-3xl font-bold text-yellow-600">
                {orders?.filter(o => o.orderStatus === 'processing').length || 0}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaSync className="text-2xl text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Delivered</p>
              <p className="text-3xl font-bold text-green-600">
                {orders?.filter(o => o.orderStatus === 'delivered').length || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'No orders have been placed yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusBadge = getStatusBadge(order.orderStatus);
            
            return (
              <div key={order._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-mono font-medium">{order._id?.slice(-8)}</p>
                      </div>
                      <div className="border-l border-gray-300 h-8"></div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="flex items-center text-sm">
                          <FaCalendarAlt className="mr-1 text-gray-400" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                        {statusBadge.icon}
                        {order.orderStatus ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1) : 'Pending'}
                      </span>
                      {order.orderStatus === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order._id, 'Cancelled by admin')}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                        >
                          Cancel Order
                        </button>
                      )}
                      <select
                        value={order.orderStatus || 'pending'}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <FaUser className="mr-2 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaEnvelope className="mr-2 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{order.user?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaPhone className="mr-2 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{order.shippingAddress?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {order.orderItems?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src = 'https://placehold.co/48x48/pink/white?text=Item';
                                }}
                              />
                            ) : (
                              getProductIcon(item)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.name || 'Product'}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity || 0} × ₹{formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-pink-600 flex items-center">
                          <FaRupeeSign className="mr-1" />
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="mr-2 text-gray-500 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Shipping Address</p>
                          <p className="text-sm">
                            {order.shippingAddress?.addressLine1}
                            {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                            <br />
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-pink-600 flex items-center">
                        <FaRupeeSign className="mr-1" />
                        {formatPrice(order.totalPrice)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Payment: {order.paymentMethod || 'N/A'} • {order.paymentStatus || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;