import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  FaShoppingCart, 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaTachometerAlt,
  FaCog,
  FaSignOutAlt,
  FaBox,
  FaClipboardList,
  FaLeaf
} from 'react-icons/fa';
import { GiPlantRoots } from 'react-icons/gi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
    console.log('User role:', user?.role);
    console.log('Is admin:', user?.role === 'admin');
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.firstName?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-4xl">🌸</span>
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-transparent bg-clip-text">
              FlowerBookie
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Shop
            </Link>
            {/* Indoor Plants Link */}
            <Link 
              to="/indoor-plants" 
              className="text-gray-700 hover:text-green-600 transition-colors font-medium flex items-center group"
            >
              <GiPlantRoots className="mr-1 text-green-500 group-hover:text-green-600" />
              <span>Indoor Plants</span>
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Contact
            </Link>
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/cart" className="relative">
              <FaShoppingCart className="text-2xl text-gray-700 hover:text-pink-600 transition-colors" />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-pink-600">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials()}
                  </div>
                  <span className="font-medium">{user.firstName}</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-lg border-b border-pink-100">
                    <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        Administrator
                      </span>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                    >
                      <FaUser className="mr-3 text-pink-600" />
                      <div>
                        <p className="font-medium">My Profile</p>
                        <p className="text-xs text-gray-500">View and edit profile</p>
                      </div>
                    </Link>

                    <Link 
                      to="/orders" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                    >
                      <FaClipboardList className="mr-3 text-pink-600" />
                      <div>
                        <p className="font-medium">My Orders</p>
                        <p className="text-xs text-gray-500">Track your orders</p>
                      </div>
                    </Link>

                    {/* Indoor Plants Link in Dropdown */}
                    <Link 
                      to="/indoor-plants" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600"
                    >
                      <GiPlantRoots className="mr-3 text-green-600" />
                      <div>
                        <p className="font-medium">Indoor Plants</p>
                        <p className="text-xs text-gray-500">Browse our plant collection</p>
                      </div>
                    </Link>

                    {/* Admin Section - Only visible to admins */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-3 py-1">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider px-2">
                            Admin Panel
                          </p>
                        </div>
                        
                        <Link 
                          to="/admin" 
                          className="flex items-center px-4 py-3 text-purple-700 hover:bg-purple-50 bg-purple-50/30"
                        >
                          <FaTachometerAlt className="mr-3 text-purple-600" />
                          <div>
                            <p className="font-medium">Dashboard</p>
                            <p className="text-xs text-gray-500">Overview & analytics</p>
                          </div>
                        </Link>

                        <Link 
                          to="/admin/products" 
                          className="flex items-center px-4 py-3 text-purple-700 hover:bg-purple-50"
                        >
                          <FaBox className="mr-3 text-purple-600" />
                          <div>
                            <p className="font-medium">Manage Products</p>
                            <p className="text-xs text-gray-500">Add, edit, delete products</p>
                          </div>
                        </Link>

                        <Link 
                          to="/admin/orders" 
                          className="flex items-center px-4 py-3 text-purple-700 hover:bg-purple-50"
                        >
                          <FaShoppingCart className="mr-3 text-purple-600" />
                          <div>
                            <p className="font-medium">Manage Orders</p>
                            <p className="text-xs text-gray-500">View and update orders</p>
                          </div>
                        </Link>

                        <Link 
                          to="/admin/settings" 
                          className="flex items-center px-4 py-3 text-purple-700 hover:bg-purple-50"
                        >
                          <FaCog className="mr-3 text-purple-600" />
                          <div>
                            <p className="font-medium">Settings</p>
                            <p className="text-xs text-gray-500">Configure store</p>
                          </div>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg"
                    >
                      <FaSignOutAlt className="mr-3 text-red-600" />
                      <div>
                        <p className="font-medium">Logout</p>
                        <p className="text-xs text-red-400">Sign out of your account</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-pink-600 font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md max-h-[80vh] overflow-y-auto">
            <Link to="/" className="block px-4 py-3 text-gray-700 hover:bg-pink-50">
              Home
            </Link>
            <Link to="/shop" className="block px-4 py-3 text-gray-700 hover:bg-pink-50">
              Shop
            </Link>
            {/* Indoor Plants Link - Mobile */}
            <Link 
              to="/indoor-plants" 
              className="block px-4 py-3 text-gray-700 hover:bg-green-50 flex items-center"
            >
              <GiPlantRoots className="mr-2 text-green-600" />
              <span>Indoor Plants</span>
            </Link>
            <Link to="/about" className="block px-4 py-3 text-gray-700 hover:bg-pink-50">
              About
            </Link>
            <Link to="/contact" className="block px-4 py-3 text-gray-700 hover:bg-pink-50">
              Contact
            </Link>
            
            <div className="border-t border-gray-200 my-2">
              <Link to="/cart" className="flex items-center justify-between px-4 py-3 hover:bg-pink-50">
                <span>Cart</span>
                {getCartCount() > 0 && (
                  <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs">
                    {getCartCount()}
                  </span>
                )}
              </Link>
              
              {user ? (
                <>
                  <div className="px-4 py-3 bg-pink-50">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  
                  <Link to="/profile" className="block px-4 py-3 hover:bg-pink-50">
                    Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-3 hover:bg-pink-50">
                    Orders
                  </Link>
                  
                  {/* Indoor Plants Link in Mobile Menu */}
                  <Link to="/indoor-plants" className="block px-4 py-3 hover:bg-green-50 text-green-700">
                    <span className="flex items-center">
                      <GiPlantRoots className="mr-2" />
                      Indoor Plants
                    </span>
                  </Link>
                  
                  {/* Admin Links in Mobile */}
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase">
                        Admin
                      </div>
                      <Link to="/admin" className="block px-4 py-3 bg-purple-50 text-purple-700">
                        Dashboard
                      </Link>
                      <Link to="/admin/products" className="block px-4 py-3 hover:bg-purple-50">
                        Products
                      </Link>
                      <Link to="/admin/orders" className="block px-4 py-3 hover:bg-purple-50">
                        Orders
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 border-t border-gray-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="px-4 py-3 space-y-2">
                  <Link to="/login" className="block w-full text-center btn-primary">
                    Login
                  </Link>
                  <Link to="/register" className="block w-full text-center btn-secondary">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;