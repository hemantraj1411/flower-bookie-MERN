import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const { user, token, isAuthenticated } = useAuth();

  // Load cart from localStorage only if user is logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartFromStorage();
    } else {
      // Clear cart when user logs out
      setCartItems([]);
      setCartTotal(0);
      setItemCount(0);
    }
  }, [isAuthenticated, user]);

  // Update totals whenever cart changes
  useEffect(() => {
    calculateTotals();
    if (isAuthenticated && user) {
      saveCartToStorage(cartItems);
    }
  }, [cartItems, isAuthenticated, user]);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem(`cart_${user?._id}`);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        const validatedCart = parsedCart
          .map(item => validateAndFormatItem(item))
          .filter(item => item !== null);
        setCartItems(validatedCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCartToStorage = (items) => {
    if (isAuthenticated && user) {
      localStorage.setItem(`cart_${user._id}`, JSON.stringify(items));
    }
  };

  // Helper function to validate and format a single item
  const validateAndFormatItem = (item) => {
    if (!item) return null;
    
    return {
      _id: item._id || item.productId || null,
      productId: item.productId || item._id || null,
      name: item.name || 'Unknown Item',
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
      image: item.image || (item.images?.[0]?.url) || null,
      images: item.images || [],
      quantity: item.quantity || 1,
      stock: item.stock || 10
    };
  };

  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      return sum + (itemPrice * itemQuantity);
    }, 0);
    setCartTotal(total);

    const count = cartItems.reduce((sum, item) => {
      return sum + (item.quantity || 1);
    }, 0);
    setItemCount(count);
  };

  // Updated addToCart with authentication check
  const addToCart = async (product, quantity = 1) => {
    // CHECK IF USER IS LOGGED IN FIRST
    if (!isAuthenticated || !user) {
      toast.error('Please login to add items to cart');
      // Redirect to login page with return URL
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    try {
      setLoading(true);
      
      if (!product || (!product._id && !product.productId)) {
        toast.error('Invalid product');
        return false;
      }

      const safeProduct = {
        _id: product._id || product.productId,
        productId: product._id || product.productId,
        name: product.name || 'Unknown Item',
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        image: product.image || (product.images?.[0]?.url) || null,
        images: product.images || [],
        stock: product.stock || 10,
        quantity: quantity
      };

      if (safeProduct.price <= 0) {
        toast.error('Cannot add item with invalid price');
        return false;
      }

      if (safeProduct.name === 'Unknown Item' || !safeProduct.name) {
        toast.error('Cannot add item with invalid name');
        return false;
      }

      console.log('🛒 Adding to cart:', safeProduct);

      if (user && token) {
        // If user is logged in, sync with backend
        try {
          const response = await axios.post('/api/cart/add', 
            { productId: safeProduct._id, quantity },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const items = response.data.items || [];
          const formattedItems = items
            .map(item => ({
              _id: item.product?._id || item._id,
              productId: item.product?._id || item.productId,
              name: item.product?.name || item.name || 'Unknown Item',
              price: item.product?.price || item.price || 0,
              image: item.product?.images?.[0]?.url || item.image || null,
              images: item.product?.images || [],
              quantity: item.quantity || 1,
              stock: item.product?.stock || item.stock || 10
            }))
            .filter(item => item.name !== 'Unknown Item' && item.price > 0);
          
          setCartItems(formattedItems);
        } catch (error) {
          console.error('Backend sync error:', error);
          // Fallback to local storage
          addToLocalCart(safeProduct);
        }
      } else {
        addToLocalCart(safeProduct);
      }
      
      toast.success(`${safeProduct.name} added to cart!`);
      return true;
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addToLocalCart = (safeProduct) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item._id === safeProduct._id || item.productId === safeProduct._id
      );
      
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          (item._id === safeProduct._id || item.productId === safeProduct._id)
            ? { ...item, quantity: (item.quantity || 1) + safeProduct.quantity }
            : item
        );
      } else {
        newItems = [...prevItems, safeProduct];
      }
      
      return newItems;
    });
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to update cart');
      return false;
    }

    if (newQuantity < 1) return removeFromCart(productId);

    try {
      setLoading(true);

      if (user && token) {
        try {
          const response = await axios.put('/api/cart/update',
            { productId, quantity: newQuantity },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const items = response.data.items || [];
          const formattedItems = items
            .map(item => ({
              _id: item.product?._id || item._id,
              productId: item.product?._id || item.productId,
              name: item.product?.name || item.name || 'Unknown Item',
              price: item.product?.price || item.price || 0,
              image: item.product?.images?.[0]?.url || item.image || null,
              images: item.product?.images || [],
              quantity: item.quantity || 1,
              stock: item.product?.stock || item.stock || 10
            }))
            .filter(item => item.name !== 'Unknown Item' && item.price > 0);
          
          setCartItems(formattedItems);
        } catch (error) {
          console.error('Backend sync error:', error);
          // Fallback to local update
          updateLocalQuantity(productId, newQuantity);
        }
      } else {
        updateLocalQuantity(productId, newQuantity);
      }
      
      return true;
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateLocalQuantity = (productId, newQuantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        (item._id === productId || item.productId === productId)
          ? { ...item, quantity: newQuantity }
          : item
      );
      return updatedItems;
    });
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to manage cart');
      return false;
    }

    try {
      setLoading(true);

      if (user && token) {
        try {
          const response = await axios.delete(`/api/cart/remove/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const items = response.data.items || [];
          const formattedItems = items
            .map(item => ({
              _id: item.product?._id || item._id,
              productId: item.product?._id || item.productId,
              name: item.product?.name || item.name || 'Unknown Item',
              price: item.product?.price || item.price || 0,
              image: item.product?.images?.[0]?.url || item.image || null,
              images: item.product?.images || [],
              quantity: item.quantity || 1,
              stock: item.product?.stock || item.stock || 10
            }))
            .filter(item => item.name !== 'Unknown Item' && item.price > 0);
          
          setCartItems(formattedItems);
        } catch (error) {
          console.error('Backend sync error:', error);
          // Fallback to local removal
          removeLocalItem(productId);
        }
      } else {
        removeLocalItem(productId);
      }
      
      toast.success('Item removed from cart');
      return true;
    } catch (error) {
      console.error('Remove from cart error:', error);
      toast.error('Failed to remove item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeLocalItem = (productId) => {
    setCartItems(prevItems => {
      const filteredItems = prevItems.filter(item => 
        item._id !== productId && item.productId !== productId
      );
      return filteredItems;
    });
  };

  const clearCart = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      if (user && token) {
        try {
          await axios.delete('/api/cart/clear', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Backend clear error:', error);
        }
      }
      
      setCartItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartTotal = () => cartTotal;
  const getCartCount = () => itemCount;

  // Indian Rupee calculations
  const getShippingCost = () => {
    // Free shipping over ₹5000
    return cartTotal > 5000 ? 0 : 100; // ₹100 shipping
  };

  const getTax = () => {
    // GST 18% in India
    return cartTotal * 0.18;
  };

  const getGrandTotal = () => {
    return cartTotal + getShippingCost() + getTax();
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartCount,
      getShippingCost,
      getTax,
      getGrandTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};