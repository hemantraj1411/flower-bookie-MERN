const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const { upload } = require('../utils/cloudinary');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort('-createdAt')
      .limit(5);

    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .limit(5);

    res.json({
      stats: {
        totalProducts,
        totalCategories,
        totalUsers,
        totalOrders,
        totalRevenue
      },
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        isPrimary: index === 0
      }));
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      Object.assign(product, req.body);

      if (req.files && req.files.length > 0) {
        // Add new images
        const newImages = req.files.map((file, index) => ({
          url: file.path,
          publicId: file.filename,
          isPrimary: product.images.length === 0 && index === 0
        }));
        product.images = [...product.images, ...newImages];
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.remove();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('order');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    
    if (req.file) {
      categoryData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const category = await Category.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      Object.assign(category, req.body);

      if (req.file) {
        category.image = {
          url: req.file.path,
          publicId: req.file.filename
        };
      }

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await category.remove();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = orderStatus || order.orderStatus;
      order.paymentStatus = paymentStatus || order.paymentStatus;

      if (orderStatus === 'delivered') {
        order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
      user.role = role;
      await user.save();
      res.json({ message: 'User role updated' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  updateOrderStatus,
  getUsers,
  updateUserRole
};