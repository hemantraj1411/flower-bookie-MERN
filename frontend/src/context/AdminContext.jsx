import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: []
  });

  const isAdmin = user?.role === 'admin';

  // Create axios instance with auth header
  const adminAxios = axios.create({
    baseURL: '/api/admin',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Fetch all products
  const fetchProducts = async () => {
    if (!isAdmin || !token) {
      console.log('👤 Not admin or no token, clearing data...');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📦 Fetching products with token:', token?.substring(0, 20) + '...');
      const response = await adminAxios.get('/products');
      console.log('✅ Products fetched:', response.data);
      setProducts(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching products:', error.response || error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        console.log('Products endpoint not found - using productAPI instead');
        const productRes = await axios.get('/api/products');
        setProducts(productRes.data.products || productRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders
  const fetchOrders = async () => {
    if (!isAdmin || !token) return;
    
    try {
      const response = await adminAxios.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch orders');
      }
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    if (!isAdmin || !token) return;
    
    try {
      const response = await adminAxios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    if (!isAdmin || !token) return;
    
    try {
      const response = await adminAxios.get('/dashboard');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Create product with FormData
  const createProduct = async (productData) => {
    if (!isAdmin || !token) {
      toast.error('You must be logged in as admin');
      return false;
    }

    try {
      setLoading(true);
      
      // Log FormData contents for debugging
      console.log('📦 Creating product with FormData:');
      for (let pair of productData.entries()) {
        if (pair[0] === 'images') {
          console.log(pair[0], pair[1].name);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await adminAxios.post('/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Product created:', response.data);
      setProducts([...products, response.data]);
      toast.success('Product created successfully');
      
      // Fetch updated products list
      await fetchProducts();
      
      return true;
    } catch (error) {
      console.error('❌ Error creating product:', error.response || error);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          'Failed to create product';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const updateProduct = async (id, productData) => {
    if (!isAdmin || !token) return false;

    try {
      setLoading(true);
      const response = await adminAxios.put(`/products/${id}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProducts(products.map(p => p._id === id ? response.data : p));
      toast.success('Product updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (id) => {
    if (!isAdmin || !token) return false;

    try {
      setLoading(true);
      await adminAxios.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Product deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============ PLANT-SPECIFIC FUNCTIONS ============

  // Fetch all plants (products with type='indoor')
  const fetchPlants = async () => {
    if (!isAdmin || !token) return;
    
    try {
      setLoading(true);
      const response = await adminAxios.get('/products?type=indoor');
      console.log('✅ Plants fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching plants:', error);
      toast.error('Failed to fetch plants');
    } finally {
      setLoading(false);
    }
  };

  // Create plant (with type='indoor' automatically set)
  const createPlant = async (plantData) => {
    if (!isAdmin || !token) {
      toast.error('You must be logged in as admin');
      return false;
    }

    try {
      setLoading(true);
      
      // Ensure plant type is set to indoor
      plantData.append('type', 'indoor');
      
      console.log('📦 Creating plant with FormData:');
      for (let pair of plantData.entries()) {
        if (pair[0] === 'images') {
          console.log(pair[0], pair[1].name);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await adminAxios.post('/plants', plantData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Plant created:', response.data);
      
      if (response.data.success) {
        setProducts([...products, response.data.plant]);
        toast.success('Plant created successfully');
        
        // Fetch updated products list
        await fetchProducts();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error creating plant:', error);
      toast.error(error.response?.data?.message || 'Failed to create plant');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update plant
  const updatePlant = async (id, plantData) => {
    if (!isAdmin || !token) return false;

    try {
      setLoading(true);
      
      // Ensure plant type remains indoor
      plantData.append('type', 'indoor');
      
      const response = await adminAxios.put(`/plants/${id}`, plantData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setProducts(products.map(p => p._id === id ? response.data.plant : p));
        toast.success('Plant updated successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating plant:', error);
      toast.error(error.response?.data?.message || 'Failed to update plant');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete plant
  const deletePlant = async (id) => {
    if (!isAdmin || !token) return false;

    try {
      setLoading(true);
      const response = await adminAxios.delete(`/plants/${id}`);
      
      if (response.data.success) {
        setProducts(products.filter(p => p._id !== id));
        toast.success('Plant deleted successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast.error(error.response?.data?.message || 'Failed to delete plant');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============ FLOWER-SPECIFIC FUNCTIONS ============

  // Create flower
  const createFlower = async (flowerData) => {
    if (!isAdmin || !token) {
      toast.error('You must be logged in as admin');
      return false;
    }

    try {
      setLoading(true);
      
      // Ensure flower type is set to flower
      flowerData.append('type', 'flower');
      
      console.log('📦 Creating flower with FormData:');
      for (let pair of flowerData.entries()) {
        if (pair[0] === 'images') {
          console.log(pair[0], pair[1].name);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await adminAxios.post('/flowers', flowerData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Flower created:', response.data);
      
      if (response.data.success) {
        setProducts([...products, response.data.flower]);
        toast.success('Flower created successfully');
        
        // Fetch updated products list
        await fetchProducts();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error creating flower:', error);
      toast.error(error.response?.data?.message || 'Failed to create flower');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (id, status) => {
    if (!isAdmin || !token) return false;

    try {
      const response = await adminAxios.put(`/orders/${id}`, { status });
      setOrders(orders.map(o => o._id === id ? response.data : o));
      toast.success('Order status updated');
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
      return false;
    }
  };

  // Update user role
  const updateUserRole = async (id, role) => {
    if (!isAdmin || !token) return false;

    try {
      const response = await adminAxios.put(`/users/${id}`, { role });
      setUsers(users.map(u => u._id === id ? response.data.user : u));
      toast.success('User role updated');
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user role');
      return false;
    }
  };

  // Load data when admin mounts
  useEffect(() => {
    if (isAdmin && token) {
      console.log('👑 Admin detected, fetching data...');
      fetchProducts();
      fetchOrders();
      fetchUsers();
      fetchDashboardStats();
    } else {
      console.log('👤 Not admin or no token, clearing data...');
      setProducts([]);
      setOrders([]);
      setUsers([]);
    }
  }, [isAdmin, token]);

  return (
    <AdminContext.Provider value={{
      isAdmin,
      products,
      orders,
      users,
      dashboardStats,
      loading,
      // Product functions
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      // Plant-specific functions
      fetchPlants,
      createPlant,
      updatePlant,
      deletePlant,
      // Flower-specific functions
      createFlower,
      // Order functions
      fetchOrders,
      updateOrderStatus,
      // User functions
      fetchUsers,
      updateUserRole,
      // Dashboard
      fetchDashboardStats,
    }}>
      {children}
    </AdminContext.Provider>
  );
};