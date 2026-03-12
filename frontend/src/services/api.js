import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Product API calls
export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getById: (id) => API.get(`/products/${id}`),
  getFeatured: () => API.get('/products/featured'),
  getBestSellers: () => API.get('/products/bestsellers'),
  getBySlug: (slug) => API.get(`/products/slug/${slug}`),
  getByCategory: (categoryId) => API.get(`/products/category/${categoryId}`),
  getStats: () => API.get('/products/stats'),
  createReview: (id, reviewData) => API.post(`/products/${id}/reviews`, reviewData),
  
  // Dedicated flower and plant endpoints
  getFlowers: () => API.get('/products/flowers'),
  getPlants: () => API.get('/products/plants'),
};

// Auth API calls
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  addToWishlist: (productId) => API.post('/auth/wishlist', { productId }),
  removeFromWishlist: (productId) => API.delete(`/auth/wishlist/${productId}`),
};

// Order API calls
export const orderAPI = {
  create: (orderData) => API.post('/orders', orderData),
  getAll: () => API.get('/orders'),
  getById: (id) => API.get(`/orders/${id}`),
  cancel: (id) => API.put(`/orders/${id}/cancel`),
};

// Category API calls (PUBLIC)
export const categoryAPI = {
  getAll: () => API.get('/categories'),
  getFlowers: () => API.get('/categories/flowers'),
  getPlants: () => API.get('/categories/plants'),
  getById: (id) => API.get(`/categories/${id}`),
  getBySlug: (slug) => API.get(`/categories/slug/${slug}`),
};

// Admin API calls (PROTECTED)
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => API.get('/admin/dashboard'),
  
  // Products
  getProducts: () => API.get('/admin/products'),
  createProduct: (formData) => API.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => API.put(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => API.delete(`/admin/products/${id}`),
  
  // Categories (Admin versions)
  getCategories: () => API.get('/admin/categories'),
  getFlowerCategories: () => API.get('/admin/categories/flowers'),
  getPlantCategories: () => API.get('/admin/categories/plants'),
  createCategory: (data) => API.post('/admin/categories', data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  updateCategory: (id, data) => API.put(`/admin/categories/${id}`, data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  deleteCategory: (id) => API.delete(`/admin/categories/${id}`),
  
  // Orders
  getOrders: () => API.get('/admin/orders'),
  updateOrderStatus: (id, status) => API.put(`/admin/orders/${id}`, { status }),
  
  // Users
  getUsers: () => API.get('/admin/users'),
  updateUserRole: (id, role) => API.put(`/admin/users/${id}`, { role }),
  
  // Cart (Admin view - optional)
  getCarts: () => API.get('/admin/carts'),
};

// Cart API calls (for regular users)
export const cartAPI = {
  getCart: () => API.get('/cart'),
  addToCart: (productId, quantity) => API.post('/cart/add', { productId, quantity }),
  updateQuantity: (productId, quantity) => API.put('/cart/update', { productId, quantity }),
  removeFromCart: (productId) => API.delete(`/cart/remove/${productId}`),
  clearCart: () => API.delete('/cart/clear'),
};

export default API;