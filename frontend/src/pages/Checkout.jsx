// frontend/src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaRupeeSign, FaMapMarkerAlt, FaTruck, FaCreditCard } from 'react-icons/fa';

const Checkout = () => {
  const { user, token } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [addressData, setAddressData] = useState({
    addressLine1: user?.address?.addressLine1 || '',
    addressLine2: user?.address?.addressLine2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: 'India',
    phone: user?.phone || ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Calculate prices
  const subtotal = getCartTotal?.() || 0;
  const shippingPrice = subtotal > 500 ? 0 : 50;
  const taxPrice = subtotal * 0.05; // 5% tax
  const totalPrice = subtotal + shippingPrice + taxPrice;

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleAddressChange = (e) => {
    setAddressData({
      ...addressData,
      [e.target.name]: e.target.value
    });
  };

  // STEP 1: Create Order
  const createOrder = async () => {
    try {
      setLoading(true);
      
      // Validate address
      if (!addressData.addressLine1 || !addressData.city || !addressData.state || !addressData.postalCode || !addressData.phone) {
        toast.error('Please fill all address fields');
        setLoading(false);
        return null;
      }

      const orderItems = cartItems.map(item => ({
        product: item.product?._id || item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        type: item.type || 'flower'
      }));

      const orderPayload = {
        orderItems,
        shippingAddress: addressData,
        paymentMethod: 'razorpay',
        itemsPrice: subtotal,
        taxPrice: taxPrice,
        shippingPrice: shippingPrice,
        totalPrice: totalPrice
      };

      console.log('📦 Creating order with payload:', orderPayload);

      const response = await axios.post(
        `${API_URL}/api/orders`,
        orderPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Order created:', response.data);
      
      // Handle different response formats
      const createdOrder = response.data.data || response.data;
      
      // Store order ID for later use
      localStorage.setItem('currentOrderId', createdOrder._id);
      setOrderData(createdOrder);
      
      return createdOrder;
      
    } catch (error) {
      console.error('❌ Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Initialize Payment
  const initializePayment = async (order) => {
    try {
      setProcessingPayment(true);
      
      console.log('💳 Initializing payment for order:', order._id);
      
      const response = await axios.post(
        `${API_URL}/api/payment/create-order`,
        { amount: Math.round(order.totalPrice || totalPrice) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Payment order created:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      toast.error('Failed to initialize payment');
      return null;
    }
  };

  // STEP 3: Load Razorpay
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // STEP 4: Process Payment
  const processPayment = async () => {
    try {
      setProcessingPayment(true);
      
      // Step 1: Create order
      const order = await createOrder();
      if (!order) {
        setProcessingPayment(false);
        return;
      }

      // Step 2: Initialize payment
      const paymentOrder = await initializePayment(order);
      if (!paymentOrder) {
        setProcessingPayment(false);
        return;
      }

      // Step 3: Load Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setProcessingPayment(false);
        return;
      }

      // Step 4: Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'FlowerBookie Delivery',
        description: `Order #${order._id.slice(-8)}`,
        image: '/logo.png',
        order_id: paymentOrder.id,
        handler: async (response) => {
          console.log('✅ Payment success:', response);
          await verifyPayment(response, order._id);
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.email,
          contact: addressData.phone
        },
        notes: {
          address: `${addressData.addressLine1}, ${addressData.city}`
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            toast.error('Payment cancelled');
          }
        }
      };

      // Step 5: Open Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('❌ Payment process error:', error);
      toast.error('Payment process failed');
      setProcessingPayment(false);
    }
  };

  // STEP 5: Verify Payment
  const verifyPayment = async (response, orderId) => {
    try {
      const verificationData = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderId
      };

      console.log('🔍 Verifying payment:', verificationData);

      const { data } = await axios.post(
        `${API_URL}/api/payment/verify`,
        verificationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Verification response:', data);

      if (data.success) {
        toast.success('Payment successful! Order placed!');
        
        // Clear cart
        if (clearCart) {
          clearCart();
        }
        localStorage.removeItem('currentOrderId');
        
        // Redirect to orders
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      toast.error(error.response?.data?.message || 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle COD order
  const handleCODOrder = async () => {
    try {
      setLoading(true);
      
      const order = await createOrder();
      if (order) {
        toast.success('Order placed successfully!');
        
        if (clearCart) {
          clearCart();
        }
        
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }
    } catch (error) {
      console.error('COD order error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Place Order (main function)
  const handlePlaceOrder = async () => {
    if (addressData.paymentMethod === 'cod') {
      await handleCODOrder();
    } else {
      await processPayment();
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/shop')}
            className="btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Address Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-pink-600" />
                Shipping Address
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={addressData.addressLine1}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={addressData.addressLine2}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={addressData.city}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={addressData.state}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={addressData.postalCode}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={addressData.phone}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaCreditCard className="mr-2 text-pink-600" />
                Payment Method
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={addressData.paymentMethod === 'razorpay'}
                    onChange={(e) => setAddressData({...addressData, paymentMethod: e.target.value})}
                    className="form-radio text-pink-600"
                  />
                  <span className="font-medium">Online Payment (Razorpay)</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={addressData.paymentMethod === 'cod'}
                    onChange={(e) => setAddressData({...addressData, paymentMethod: e.target.value})}
                    className="form-radio text-pink-600"
                  />
                  <span className="font-medium">Cash on Delivery</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaTruck className="mr-2 text-pink-600" />
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium flex items-center">
                      <FaRupeeSign className="mr-1 text-xs" />
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium flex items-center">
                    {shippingPrice === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <>
                        <FaRupeeSign className="mr-1 text-xs" />
                        {shippingPrice.toFixed(2)}
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-medium flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {taxPrice.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="flex items-center text-pink-600">
                      <FaRupeeSign className="mr-1" />
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlaceOrder}
                disabled={loading || processingPayment}
                className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Order...' : 
                 processingPayment ? 'Processing Payment...' : 
                 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;