import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FaMotorcycle, FaPhone, FaEnvelope, FaToggleOn, FaToggleOff, 
  FaBicycle, FaCar, FaUserPlus, FaEye, FaSync, FaFilter,
  FaCheck, FaTimes, FaTrash, FaEdit, FaMapMarkerAlt, FaStar
} from 'react-icons/fa';
import { GiScooter } from 'react-icons/gi';
import { MdDeliveryDining } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';
import io from 'socket.io-client';

const DeliveryManagement = () => {
  const { user, token } = useAdmin();
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoy, setSelectedBoy] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalBoys: 0,
    availableBoys: 0,
    busyBoys: 0,
    offlineBoys: 0,
    todayDeliveries: 0,
    pendingAssignments: 0
  });
  
  const socketRef = useRef();

  useEffect(() => {
    // Get token from localStorage as backup
    const localToken = localStorage.getItem('token');
    console.log('🔑 Token from context:', token);
    console.log('🔑 Token from localStorage:', localToken);

    // Connect to socket with token
    socketRef.current = io('http://localhost:5000', {
      auth: { token: localToken || token }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to delivery socket');
      socketRef.current.emit('join-admin');
    });

    socketRef.current.on('delivery-status-change', (data) => {
      console.log('📡 Status update received:', data);
      // Update delivery boy status in real-time
      setDeliveryBoys(prevBoys => 
        prevBoys.map(boy => 
          boy._id === data.deliveryBoyId 
            ? { ...boy, status: data.status, isActive: data.isActive }
            : boy
        )
      );
      toast.info(`${data.name} is now ${data.status}`);
      fetchData(); // Refresh all data
    });

    socketRef.current.on('new-assignment', (data) => {
      console.log('📡 New assignment received:', data);
      toast.success('New order assigned');
      fetchData();
    });

    socketRef.current.on('assignment-update', (data) => {
      console.log('📡 Assignment update received:', data);
      fetchData();
    });

    fetchData();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage as backup
      const localToken = localStorage.getItem('token');
      const authToken = token || localToken;

      if (!authToken) {
        console.error('❌ No token available');
        toast.error('Authentication error. Please login again.');
        return;
      }

      console.log('📦 Fetching delivery data with token:', authToken.substring(0, 20) + '...');

      const headers = { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data with proper error handling
      const [boysRes, ordersRes, assignmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/delivery/boys', { headers }).catch(err => {
          console.error('Error fetching boys:', err);
          return { data: [] };
        }),
        axios.get('http://localhost:5000/api/admin/delivery/active-orders', { headers }).catch(err => {
          console.error('Error fetching orders:', err);
          return { data: [] };
        }),
        axios.get('http://localhost:5000/api/admin/delivery/assignments', { headers }).catch(err => {
          console.error('Error fetching assignments:', err);
          return { data: { assignments: [], stats: {} } };
        })
      ]);

      // Handle different response structures
      const boys = Array.isArray(boysRes.data) ? boysRes.data : 
                  (boysRes.data.boys || []);
      
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : 
                    (ordersRes.data.orders || []);
      
      const assignmentsData = assignmentsRes.data.assignments || 
                             (Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      
      const assignmentStats = assignmentsRes.data.stats || {};

      console.log('✅ Delivery boys fetched:', boys);
      console.log('✅ Active orders fetched:', orders);
      console.log('✅ Assignments fetched:', assignmentsData);

      setDeliveryBoys(boys);
      setActiveOrders(orders);
      setAssignments(assignmentsData);

      // Calculate stats
      const available = boys.filter(b => b.status === 'available' || b.status === 'online').length;
      const busy = boys.filter(b => b.status === 'busy').length;
      const offline = boys.filter(b => b.status === 'offline' || !b.isActive).length;
      
      const today = new Date().toDateString();
      const todayDel = assignmentsData.filter(a => {
        const assignmentDate = new Date(a.createdAt || a.updatedAt).toDateString();
        return assignmentDate === today && a.status === 'delivered';
      }).length;
      
      const pending = assignmentsData.filter(a => 
        ['assigned', 'accepted', 'picked_up', 'on_the_way'].includes(a.status)
      ).length;

      setStats({
        totalBoys: boys.length,
        availableBoys: available,
        busyBoys: busy,
        offlineBoys: offline,
        todayDeliveries: assignmentStats.todayDeliveries || todayDel,
        pendingAssignments: assignmentStats.pending || pending
      });

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check if server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else if (error.response?.status === 404) {
        console.log('Delivery routes not found - using mock data');
        // Set mock data for development
        setMockData();
      } else {
        toast.error(error.response?.data?.message || 'Failed to load delivery data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const setMockData = () => {
    const mockBoys = [
      {
        _id: '1',
        firstName: 'Hemant',
        lastName: 'Raj',
        email: 'hemantraj141@gmail.com',
        phone: '09234015919',
        status: 'offline',
        isActive: false,
        vehicleType: 'bike',
        vehicleNumber: 'BR01AB1234',
        totalDeliveries: 150,
        rating: 5
      }
    ];

    setDeliveryBoys(mockBoys);
    setStats({
      totalBoys: 1,
      availableBoys: 0,
      busyBoys: 0,
      offlineBoys: 1,
      todayDeliveries: 0,
      pendingAssignments: 0
    });
  };

  const handleAddDeliveryBoy = async (formData) => {
    try {
      const localToken = localStorage.getItem('token');
      const authToken = token || localToken;

      const response = await axios.post('http://localhost:5000/api/admin/delivery/boys', formData, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Delivery boy added successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding delivery boy:', error);
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add delivery boy');
      }
    }
  };

  const handleToggleStatus = async (boyId, currentStatus) => {
    try {
      const localToken = localStorage.getItem('token');
      const authToken = token || localToken;

      // Determine new status
      let newStatus;
      if (currentStatus === 'online' || currentStatus === 'available') {
        newStatus = 'offline';
      } else if (currentStatus === 'offline') {
        newStatus = 'available';
      } else {
        newStatus = currentStatus === 'busy' ? 'offline' : 'available';
      }

      console.log(`🔄 Toggling status from ${currentStatus} to ${newStatus}`);

      const response = await axios.put(
        `http://localhost:5000/api/admin/delivery/boys/${boyId}/status`,
        { status: newStatus, isActive: newStatus !== 'offline' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        // Update local state
        setDeliveryBoys(prevBoys =>
          prevBoys.map(boy =>
            boy._id === boyId 
              ? { ...boy, status: newStatus, isActive: newStatus !== 'offline' }
              : boy
          )
        );

        // Recalculate stats
        setStats(prev => {
          const newStats = { ...prev };
          if (newStatus === 'offline') {
            newStats.offlineBoys++;
            if (currentStatus === 'available' || currentStatus === 'online') {
              newStats.availableBoys--;
            } else if (currentStatus === 'busy') {
              newStats.busyBoys--;
            }
          } else {
            newStats.offlineBoys--;
            if (newStatus === 'available') {
              newStats.availableBoys++;
            } else if (newStatus === 'busy') {
              newStats.busyBoys++;
            }
          }
          return newStats;
        });

        toast.success(`Delivery boy is now ${newStatus}`);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignOrder = async (orderId, boyId) => {
    try {
      const localToken = localStorage.getItem('token');
      const authToken = token || localToken;

      const response = await axios.post('http://localhost:5000/api/admin/delivery/assign', {
        orderId,
        deliveryBoyId: boyId
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      toast.success('Order assigned successfully');
      setShowAssignModal(false);
      setSelectedOrder(null);
      fetchData();

    } catch (error) {
      console.error('Error assigning order:', error);
      toast.error(error.response?.data?.message || 'Failed to assign order');
    }
  };

  const handleDeleteDeliveryBoy = async (boyId) => {
    if (!window.confirm('Are you sure you want to delete this delivery boy?')) return;

    try {
      const localToken = localStorage.getItem('token');
      const authToken = token || localToken;

      await axios.delete(`http://localhost:5000/api/admin/delivery/boys/${boyId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setDeliveryBoys(prev => prev.filter(boy => boy._id !== boyId));
      toast.success('Delivery boy deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting delivery boy:', error);
      toast.error(error.response?.data?.message || 'Failed to delete delivery boy');
    }
  };

  const getVehicleIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'bike': return <FaMotorcycle className="text-blue-600 text-xl" />;
      case 'scooter': return <GiScooter className="text-green-600 text-xl" />;
      case 'cycle': return <FaBicycle className="text-orange-600 text-xl" />;
      case 'car': return <FaCar className="text-purple-600 text-xl" />;
      default: return <FaMotorcycle className="text-gray-600 text-xl" />;
    }
  };

  const getStatusBadge = (status, isActive) => {
    if (!isActive) {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">Inactive</span>;
    }
    
    switch(status) {
      case 'online':
      case 'available':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Available</span>;
      case 'busy':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">On Delivery</span>;
      case 'offline':
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">Offline</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const filteredBoys = deliveryBoys.filter(boy => {
    const matchesSearch = (boy.firstName?.toLowerCase() + ' ' + boy.lastName?.toLowerCase()).includes(searchTerm.toLowerCase()) ||
                         boy.phone?.includes(searchTerm) ||
                         boy.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'available') return matchesSearch && (boy.status === 'available' || boy.status === 'online') && boy.isActive;
    if (filterStatus === 'busy') return matchesSearch && boy.status === 'busy' && boy.isActive;
    if (filterStatus === 'offline') return matchesSearch && (boy.status === 'offline' || !boy.isActive);
    
    return matchesSearch;
  });

  if (loading) return <Loader />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <MdDeliveryDining className="mr-3 text-pink-600" />
            Delivery Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your delivery team and assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
        >
          <FaUserPlus />
          <span>Add New Delivery Boy</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-pink-600">
          <p className="text-sm text-gray-500">Total Boys</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalBoys}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-green-600 font-medium">Available</p>
          <p className="text-2xl font-bold text-green-700">{stats.availableBoys}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-600 font-medium">Busy</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.busyBoys}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-600 font-medium">Offline</p>
          <p className="text-2xl font-bold text-gray-700">{stats.offlineBoys}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-blue-600 font-medium">Today's Del</p>
          <p className="text-2xl font-bold text-blue-700">{stats.todayDeliveries}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-purple-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-purple-700">{stats.pendingAssignments}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <FaFilter className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>
          <div className="w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center transition-colors"
          >
            <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Delivery Boys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBoys.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-md">
            <MdDeliveryDining className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No delivery boys found</h3>
            <p className="text-gray-600 mb-4">Add your first delivery boy to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
            >
              Add Delivery Boy
            </button>
          </div>
        ) : (
          filteredBoys.map((boy) => (
            <div key={boy._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {boy.firstName?.charAt(0)}{boy.lastName?.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-gray-800 text-lg">{boy.firstName} {boy.lastName}</h3>
                      <div className="flex items-center mt-1 space-x-2">
                        {getVehicleIcon(boy.vehicleType)}
                        <span className="text-sm text-gray-600 capitalize">{boy.vehicleType}</span>
                        {boy.vehicleNumber && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {boy.vehicleNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(boy._id, boy.status)}
                    className={`p-2 rounded-lg transition-all ${
                      boy.isActive 
                        ? 'text-green-600 hover:bg-green-50 hover:scale-110' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={boy.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {boy.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                  </button>
                </div>

                <div className="space-y-3 mb-4 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700">
                    <FaPhone className="mr-3 text-pink-600" size={14} />
                    <span className="text-sm font-medium">{boy.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <FaEnvelope className="mr-3 text-pink-600" size={14} />
                    <span className="text-sm truncate">{boy.email}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(boy.status, boy.isActive)}
                    <div className="flex items-center text-yellow-500">
                      <FaStar className="mr-1" />
                      <span className="font-bold text-sm">{boy.rating || 5.0}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full font-medium">
                      {boy.totalDeliveries || 0} deliveries
                    </span>
                    <button
                      onClick={() => handleDeleteDeliveryBoy(boy._id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Delivery Boy Modal */}
      {showAddModal && (
        <AddDeliveryBoyModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddDeliveryBoy}
        />
      )}

      {/* Assign Order Modal */}
      {showAssignModal && selectedOrder && (
        <AssignOrderModal
          order={selectedOrder}
          deliveryBoys={deliveryBoys.filter(b => (b.status === 'available' || b.status === 'online') && b.isActive)}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedOrder(null);
          }}
          onAssign={handleAssignOrder}
        />
      )}
    </div>
  );
};

// Add Delivery Boy Modal Component
const AddDeliveryBoyModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike',
    vehicleNumber: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Delivery Boy</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="********"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="cycle">Cycle</option>
                <option value="car">Car</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., BR01AB1234"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors transform hover:scale-105"
            >
              Add Delivery Boy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Order Modal Component
const AssignOrderModal = ({ order, deliveryBoys, onClose, onAssign }) => {
  const [selectedBoy, setSelectedBoy] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Assign Order</h2>
        
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-700">Order Details</h3>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Order #:</span> {order._id?.slice(-8)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Customer:</span> {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Address:</span> {order.shippingAddress?.addressLine1}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Total:</span> ₹{order.totalPrice}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Delivery Boy *
          </label>
          <select
            value={selectedBoy}
            onChange={(e) => setSelectedBoy(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
            required
          >
            <option value="">Choose delivery boy...</option>
            {deliveryBoys.map((boy) => (
              <option key={boy._id} value={boy._id}>
                {boy.firstName} {boy.lastName} - {boy.phone} ({boy.vehicleType})
              </option>
            ))}
          </select>
          {deliveryBoys.length === 0 && (
            <p className="text-sm text-red-500 mt-2">No available delivery boys at the moment</p>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onAssign(order._id, selectedBoy)}
            disabled={!selectedBoy || deliveryBoys.length === 0}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            Assign Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;