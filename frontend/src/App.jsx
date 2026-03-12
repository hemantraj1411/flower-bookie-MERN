import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import FlowerDetail from './pages/FlowerDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import About from './pages/About';
import Contact from './pages/Contact';
import IndoorPlants from './pages/IndoorPlants';
import PlantCareGuide from './pages/PlantCareGuide';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import CreateProduct from './pages/admin/CreateProduct';
import EditProduct from './pages/admin/EditProduct';
import AdminOrders from './pages/admin/Orders';
import DeliveryManagement from './pages/admin/DeliveryManagement'; // ADD THIS IMPORT

// Plant Management Pages
import Plants from './pages/admin/Plants';
import CreatePlant from './pages/admin/CreatePlant';
import EditPlant from './pages/admin/EditPlant';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader />;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/flower/:id" element={<FlowerDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/indoor-plants" element={<IndoorPlants />} />
          <Route path="/plant-care-guide" element={<PlantCareGuide />} />
          
          {/* Protected Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-confirmation/:id" 
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-tracking/:id" 
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/create" element={<CreateProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />
            
            {/* Plant Management Routes */}
            <Route path="plants" element={<Plants />} />
            <Route path="plants/create" element={<CreatePlant />} />
            <Route path="plants/edit/:id" element={<EditPlant />} />
            
            <Route path="orders" element={<AdminOrders />} />
            <Route path="delivery" element={<DeliveryManagement />} /> {/* ADDED: Delivery route */}
            
            <Route path="users" element={<div>Users Management (Coming Soon)</div>} />
            <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-display font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <Link to="/" className="btn-primary">
                  Go Home
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;