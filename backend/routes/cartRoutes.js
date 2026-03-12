const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Cart = require('../models/Cart');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({ product: productId, quantity: quantity || 1 });
    }
    
    await cart.save();
    await cart.populate('items.product');
    
    res.json(cart);
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
router.put('/update', protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const item = cart.items.find(item => item.product.toString() === productId);
    
    if (item) {
      item.quantity = quantity;
      await cart.save();
      await cart.populate('items.product');
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.product');
    
    res.json(cart);
  } catch (error) {
    console.error('Cart remove error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ message: 'Cart cleared', items: [] });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;