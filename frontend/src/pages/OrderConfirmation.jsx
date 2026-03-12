import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaHome, FaPrint } from 'react-icons/fa';
import { FaRupeeSign } from 'react-icons/fa';
import Loader from '../components/Loader';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-gray-600">
            Your order has been confirmed and will be shipped soon.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-gray-800">
                Order #{order?._id?.slice(-8)}
              </h2>
              <button
                onClick={handlePrint}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Order Items</h3>
              <div className="space-y-4">
                {order?.orderItems?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image || 'https://via.placeholder.com/60'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold flex items-center">
                      <FaRupeeSign className="mr-1" />
                      {item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-bold text-lg mb-4">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {order?.itemsPrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="flex items-center">
                    {order?.shippingPrice === 0 ? 'Free' : 
                      <><FaRupeeSign className="mr-1 text-xs" />{order?.shippingPrice}</>
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {order?.taxPrice}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-pink-600 flex items-center">
                    <FaRupeeSign className="mr-1" />
                    {order?.totalPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="font-bold text-lg mb-4">Shipping Address</h3>
              <p className="text-gray-600">
                {order?.shippingAddress?.addressLine1}<br />
                {order?.shippingAddress?.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                {order?.shippingAddress?.city}, {order?.shippingAddress?.state} {order?.shippingAddress?.pincode}<br />
                Phone: {order?.shippingAddress?.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/shop" className="btn-primary flex items-center justify-center space-x-2">
            <FaHome />
            <span>Continue Shopping</span>
          </Link>
          <Link to="/orders" className="btn-secondary flex items-center justify-center space-x-2">
            <span>View All Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;