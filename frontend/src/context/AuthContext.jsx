import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getProfile();
      console.log('✅ User fetched - Full response:', response.data);
      
      // Log the entire user object to see its structure
      console.log('👤 User object keys:', Object.keys(response.data));
      console.log('👤 User role value:', response.data.role);
      console.log('👤 Is admin check:', response.data.role === 'admin');
      
      setUser(response.data);
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, ...userData } = response.data;
      
      console.log('✅ Login successful - Full response:', response.data);
      console.log('👤 User role from login:', userData.role);
      console.log('👤 Is admin check:', userData.role === 'admin');
      console.log('🔑 Token received:', token ? 'Yes' : 'No');
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      toast.success(`Welcome back, ${userData.firstName}!`);
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, ...user } = response.data;
      
      console.log('✅ Registration successful:', user);
      console.log('👤 User role from registration:', user.role);
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      console.log('✅ Profile updated:', response.data);
      setUser(response.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Check if user is admin - with fallback for different role field names
  const isAdmin = user?.role === 'admin' || user?.role === 'Admin' || user?.userType === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      updateProfile,
      isAdmin,
      token,
      isAuthenticated // Make sure this is exposed
    }}>
      {children}
    </AuthContext.Provider>
  );
};