import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import {
  FaTachometerAlt,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaPlus,
  FaChartBar
} from 'react-icons/fa';
import { GiPlantRoots } from 'react-icons/gi';
import { MdDeliveryDining } from 'react-icons/md'; // ADD THIS IMPORT

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  // Debug useEffect - Add this for troubleshooting
  useEffect(() => {
    console.log('👤 AdminLayout - User:', user);
    console.log('👑 Is Admin:', isAdmin);
    console.log('🔑 Token:', localStorage.getItem('token'));
    console.log('📧 User Email:', user?.email);
    console.log('🆔 User Role:', user?.role);
  }, [user, isAdmin]);

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (!user) {
      console.log('⏳ No user found, waiting for auth...');
      return;
    }
    
    if (!isAdmin) {
      console.log('⛔ User is not admin, redirecting...');
      // You can optionally redirect here, but we'll show access denied
    }
  }, [user, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // If no user yet (loading), show loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user exists but is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin area.
            {user?.role && <span className="block mt-2 text-sm">Your role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.role}</span></span>}
          </p>
          <Link to="/" className="btn-primary inline-block">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/admin', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/admin/products', icon: FaBox, label: 'Products' },
    { path: '/admin/plants', icon: GiPlantRoots, label: 'Plants' },
    { path: '/admin/products/create', icon: FaPlus, label: 'Add Product' },
    { path: '/admin/plants/create', icon: FaPlus, label: 'Add Plant' },
    { path: '/admin/orders', icon: FaShoppingCart, label: 'Orders' },
    { path: '/admin/delivery', icon: MdDeliveryDining, label: 'Delivery Management' }, // ADDED
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    { path: '/admin/reports', icon: FaChartBar, label: 'Reports' },
    { path: '/admin/settings', icon: FaCog, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-pink-600 text-white rounded-lg"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white`}>
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <span className="text-2xl font-display font-bold">🌸 Admin</span>
        </div>

        <nav className="mt-8 h-[calc(100vh-5rem)] overflow-y-auto pb-32">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-300 hover:text-white transition-colors duration-200 ${
                item.label === 'Plants' || item.label === 'Add Plant' 
                  ? 'hover:bg-green-600' 
                  : item.label === 'Delivery Management'
                  ? 'hover:bg-orange-600'
                  : 'hover:bg-pink-600'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-3" />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* User info and logout at bottom */}
          <div className="absolute bottom-0 w-full border-t border-gray-700 bg-gray-900">
            <div className="px-6 py-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-pink-600 text-white text-xs rounded-full">
                    Admin
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors duration-200"
              >
                <FaSignOutAlt className="mr-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`lg:ml-64 min-h-screen transition-all duration-200 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <div className="p-8">
          {/* Debug info - Remove this in production */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
            <details>
              <summary className="cursor-pointer font-medium text-yellow-700">Debug Info (Click to expand)</summary>
              <div className="mt-2 space-y-1">
                <p><span className="font-mono">User:</span> {user?.firstName} {user?.lastName}</p>
                <p><span className="font-mono">Email:</span> {user?.email}</p>
                <p><span className="font-mono">Role:</span> <span className="font-bold text-purple-600">{user?.role}</span></p>
                <p><span className="font-mono">Is Admin:</span> {isAdmin ? '✅ Yes' : '❌ No'}</p>
                <p><span className="font-mono">Token:</span> {localStorage.getItem('token')?.substring(0, 20)}...</p>
              </div>
            </details>
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;