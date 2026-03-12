import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // This path is correct (../context not ./context)
import { formatPrice } from '../utils/currency';
import { 
  FaTrash, 
  FaArrowLeft, 
  FaShoppingBag, 
  FaPlus, 
  FaMinus,
  FaTag,
  FaShieldAlt,
  FaTruck,
  FaCreditCard,
  FaImage,
  FaExclamationTriangle,
  FaRupeeSign,
  FaLock
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Cart = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal,
    getShippingCost,
    getTax,
    getGrandTotal,
    loading 
  } = useCart();
  const { user } = useAuth(); // Changed from isAuthenticated to user
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showClearOption, setShowClearOption] = useState(false);

  // Check if user is logged in
  const isAuthenticated = !!user;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && cartItems.length > 0) {
      toast.error('Please login to view your cart');
      navigate('/login?redirect=/cart');
    }
  }, [isAuthenticated, navigate, cartItems.length]);

  // Check for invalid items
  useEffect(() => {
    const hasInvalidItems = cartItems.some(item => 
      !item.name || 
      item.name === 'Unknown Item' || 
      item.price <= 0 ||
      !item._id
    );
    setShowClearOption(hasInvalidItems);
  }, [cartItems]);

  // Filter out valid items for display
  const validItems = cartItems.filter(item => 
    item.name && 
    item.name !== 'Unknown Item' && 
    item.price > 0 &&
    item._id
  );

  const invalidItems = cartItems.filter(item => 
    !item.name || 
    item.name === 'Unknown Item' || 
    item.price <= 0 ||
    !item._id
  );

  // Safely calculate totals with fallbacks
  const subtotal = getCartTotal() || 0;
  const shipping = getShippingCost() || 0;
  const tax = getTax() || 0;
  const grandTotal = getGrandTotal() || 0;
  const finalTotal = Math.max(0, grandTotal - promoDiscount);

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    const maxStock = item.stock || 10;
    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available`);
      return;
    }
    updateQuantity(item._id || item.productId, newQuantity);
  };

  const handleRemove = (item) => {
    if (window.confirm(`Remove ${item.name || 'item'} from cart?`)) {
      removeFromCart(item._id || item.productId);
    }
  };

  const clearInvalidItems = () => {
    if (window.confirm('Remove all invalid items from cart?')) {
      invalidItems.forEach(item => {
        removeFromCart(item._id || item.productId);
      });
      toast.success('Invalid items removed');
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode) {
      toast.error('Please enter a promo code');
      return;
    }
    
    if (promoCode.toUpperCase() === 'FLOWER20') {
      setPromoApplied(true);
      setPromoDiscount(subtotal * 0.2);
      toast.success('Promo code applied! 20% discount');
    } else if (promoCode.toUpperCase() === 'FREESHIP') {
      setPromoApplied(true);
      setPromoDiscount(shipping);
      toast.success('Free shipping applied!');
    } else {
      toast.error('Invalid promo code');
    }
  };

  const getImageUrl = (item) => {
    if (!item) return 'https://placehold.co/100x100/pink/white?text=No+Image';
    
    const imageSource = item.image || (item.images?.[0]?.url) || null;
    
    if (imageSource) {
      if (typeof imageSource === 'string') {
        if (imageSource.startsWith('http')) return imageSource;
        if (imageSource.startsWith('/uploads')) return `http://localhost:5000${imageSource}`;
        return `http://localhost:5000/uploads/${imageSource}`;
      }
    }
    
    return 'https://placehold.co/100x100/pink/white?text=Flower';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-8" />
            <h1 className="font-display text-3xl font-bold text-gray-800 mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center space-x-2">
              <FaShoppingBag />
              <span>Start Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show message if not authenticated but has items
  if (!isAuthenticated && cartItems.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <FaLock className="text-6xl text-gray-300 mx-auto mb-8" />
            <h1 className="font-display text-3xl font-bold text-gray-800 mb-4">
              Login Required
            </h1>
            <p className="text-gray-600 mb-8">
              Please login to view and checkout your cart.
            </p>
            <Link 
              to="/login?redirect=/cart" 
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-gray-800 mb-8 flex items-center">
          <FaRupeeSign className="mr-2 text-pink-600" />
          Shopping Cart ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
        </h1>

        {/* Invalid Items Warning */}
        {showClearOption && invalidItems.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-600 mr-3 text-xl" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {invalidItems.length} invalid {invalidItems.length === 1 ? 'item' : 'items'} found
                  </p>
                  <p className="text-xs text-yellow-600">
                    These items have missing information and will be removed
                  </p>
                </div>
              </div>
              <button
                onClick={clearInvalidItems}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Clear Invalid Items
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {validItems.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No valid items in cart</p>
                </div>
              ) : (
                validItems.map((item, index) => {
                  const safeItem = {
                    _id: item._id || item.productId || `temp-${index}`,
                    productId: item.productId || item._id,
                    name: item.name || 'Unknown Item',
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    image: item.image || null,
                    images: item.images || [],
                    stock: item.stock || 10
                  };

                  const itemTotal = safeItem.price * safeItem.quantity;

                  return (
                    <div key={safeItem._id} className="flex flex-col sm:flex-row p-6 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                      {/* Product Image */}
                      <div className="sm:w-24 h-24 flex-shrink-0 mb-4 sm:mb-0">
                        {safeItem.image || safeItem.images?.length > 0 ? (
                          <img
                            src={getImageUrl(safeItem)}
                            alt={safeItem.name}
                            className="w-full h-full object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/100x100/pink/white?text=Flower';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaImage className="text-gray-400 text-2xl" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 sm:ml-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div className="flex-1">
                            <Link 
                              to={`/flower/${safeItem._id}`} 
                              className="text-lg font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                            >
                              {safeItem.name}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                              <FaRupeeSign className="mr-1 text-xs" />
                              Unit Price: {formatPrice(safeItem.price)}
                            </p>
                            {safeItem.stock < 5 && (
                              <p className="text-xs text-orange-600 mt-1">
                                Only {safeItem.stock} left in stock!
                              </p>
                            )}
                          </div>
                          <div className="mt-2 sm:mt-0 text-right">
                            <span className="text-2xl font-bold text-pink-600 flex items-center justify-end">
                              <FaRupeeSign className="mr-1" />
                              {formatPrice(itemTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(safeItem, safeItem.quantity - 1)}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors rounded-l-lg"
                              disabled={safeItem.quantity <= 1}
                            >
                              <FaMinus size={12} />
                            </button>
                            <span className="px-6 py-2 text-lg font-medium border-x border-gray-300 min-w-[60px] text-center">
                              {safeItem.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(safeItem, safeItem.quantity + 1)}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors rounded-r-lg"
                              disabled={safeItem.quantity >= safeItem.stock}
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemove(safeItem)}
                            className="flex items-center text-red-500 hover:text-red-700 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                          >
                            <FaTrash className="mr-2" size={14} />
                            <span className="text-sm font-medium">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Continue Shopping Link */}
            <div className="mt-6">
              <Link 
                to="/shop" 
                className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium group"
              >
                <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FaRupeeSign className="mr-2 text-pink-600" />
                Order Summary
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({validItems.length} items)</span>
                  <span className="font-medium flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {formatPrice(subtotal)}
                  </span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium flex items-center">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <>
                        <FaRupeeSign className="mr-1 text-xs" />
                        {formatPrice(shipping)}
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-medium flex items-center">
                    <FaRupeeSign className="mr-1 text-xs" />
                    {formatPrice(tax)}
                  </span>
                </div>

                {promoApplied && promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium flex items-center">
                      -<FaRupeeSign className="mr-1 text-xs" />
                      {formatPrice(promoDiscount)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-3xl text-pink-600 flex items-center">
                      <FaRupeeSign className="mr-1" />
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    Including GST & shipping
                  </p>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <FaTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      disabled={promoApplied}
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoApplied || !promoCode}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Promo code applied successfully!
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Try: FLOWER20 (20% off) or FREESHIP (free shipping)
                </p>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please login to checkout');
                    navigate('/login', { state: { from: '/cart' } });
                  } else {
                    navigate('/checkout');
                  }
                }}
                className="w-full btn-primary py-4 text-lg font-semibold mb-4 flex items-center justify-center"
              >
                <FaRupeeSign className="mr-2" />
                Proceed to Checkout
              </button>

              {/* Payment Methods */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">We accept</p>
                <div className="flex justify-center space-x-4">
                  <FaCreditCard className="text-2xl text-gray-600" />
                  <span className="text-xl font-bold text-blue-600">VISA</span>
                  <span className="text-xl font-bold text-red-600">Mastercard</span>
                  <span className="text-xl font-bold text-blue-400">Amex</span>
                  <span className="text-xl font-bold text-purple-600">RuPay</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">UPI | NetBanking | Card</p>
              </div>

              {/* Secure Checkout Notice */}
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg text-center border border-blue-200 flex items-center justify-center">
                <FaLock className="mr-2" />
                <FaShieldAlt className="mr-2" />
                Secure checkout guaranteed
              </div>

              {/* Free Shipping Notice */}
              {shipping === 0 && validItems.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg text-center border border-green-200">
                  <FaTruck className="inline mr-2" />
                  🎉 You've got FREE shipping!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;