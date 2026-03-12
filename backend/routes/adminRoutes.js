const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const upload = require('../utils/upload'); // Import the Cloudinary upload utility
const cloudinary = require('../config/cloudinary');

// Import plant controller functions
const {
  createPlant,
  updatePlant,
  deletePlant
} = require('../controllers/plantController');

// Import flower controller functions
const {
  createFlower,
  updateFlower,
  deleteFlower
} = require('../controllers/flowerController');

// All admin routes are protected and require admin role
router.use(protect, admin);

// ============ PLANT-SPECIFIC ROUTES ============

// @desc    Create a new plant
// @route   POST /api/admin/plants
router.post('/plants', upload.array('images', 5), createPlant);

// @desc    Update plant
// @route   PUT /api/admin/plants/:id
router.put('/plants/:id', upload.array('images', 5), updatePlant);

// @desc    Delete plant
// @route   DELETE /api/admin/plants/:id
router.delete('/plants/:id', deletePlant);

// ============ FLOWER-SPECIFIC ROUTES ============

// @desc    Create a new flower
// @route   POST /api/admin/flowers
router.post('/flowers', upload.array('images', 5), createFlower);

// @desc    Update flower
// @route   PUT /api/admin/flowers/:id
router.put('/flowers/:id', upload.array('images', 5), updateFlower);

// @desc    Delete flower
// @route   DELETE /api/admin/flowers/:id
router.delete('/flowers/:id', deleteFlower);

// ============ GENERIC PRODUCT ROUTES ============

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort('-createdAt')
      .limit(5);

    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .limit(5)
      .select('name stock price');

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
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all products (admin)
// @route   GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const query = {};
    
    // Filter by type if specified
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    const products = await Product.find(query).populate('category', 'name slug');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create product with image upload (CLOUDINARY VERSION)
// @route   POST /api/admin/products
router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    console.log('📦 Creating product - Body:', req.body);
    console.log('📸 Files received:', req.files?.length || 0);

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Create slug from name
    const slug = req.body.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Parse the product data
    let productData = {
      name: req.body.name,
      slug: slug,
      description: req.body.description,
      shortDescription: req.body.shortDescription,
      price: parseFloat(req.body.price),
      oldPrice: req.body.oldPrice ? parseFloat(req.body.oldPrice) : 0,
      category: req.body.category, // Can be string ID or ObjectId
      stock: parseInt(req.body.stock) || 0,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      isBestSeller: req.body.isBestSeller === 'true' || req.body.isBestSeller === true,
      badge: req.body.badge || '',
      careInstructions: req.body.careInstructions || '',
      type: req.body.type || 'flower'
    };
    
    // Handle tags array
    if (req.body.tags) {
      try {
        productData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        productData.tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    } else {
      productData.tags = [];
    }
    
    // Handle occasion array for flowers
    if (req.body.occasion) {
      try {
        productData.occasion = JSON.parse(req.body.occasion);
      } catch (e) {
        productData.occasion = req.body.occasion.split(',').map(occ => occ.trim());
      }
    } else {
      productData.occasion = [];
    }
    
    // Handle plant-specific fields
    if (req.body.careLevel) productData.careLevel = req.body.careLevel;
    if (req.body.waterNeeds) productData.waterNeeds = req.body.waterNeeds;
    
    productData.petFriendly = req.body.petFriendly === 'true' || req.body.petFriendly === true;
    productData.airPurifying = req.body.airPurifying === 'true' || req.body.airPurifying === true;
    
    // Process uploaded images - CLOUDINARY VERSION
    productData.images = req.files.map((file, index) => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      isPrimary: index === 0
    }));

    console.log('📊 Final product data:', {
      name: productData.name,
      slug: productData.slug,
      price: productData.price,
      category: productData.category,
      type: productData.type,
      imagesCount: productData.images.length,
      firstImageUrl: productData.images[0]?.url
    });

    // Check if product with same slug already exists
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      // Delete uploaded files from Cloudinary
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
      return res.status(400).json({ 
        message: 'Product with this name already exists',
        slug: productData.slug 
      });
    }

    // Create the product
    const product = await Product.create(productData);
    
    console.log('✅ Product created with ID:', product._id);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    // Delete uploaded files from Cloudinary if product creation failed
    if (req.files) {
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
    }
    
    res.status(500).json({ 
      message: error.message,
      errors: error.errors 
    });
  }
});

// @desc    Update product with image upload
// @route   PUT /api/admin/products/:id
router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Build update data
    let updateData = {
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      shortDescription: req.body.shortDescription || product.shortDescription,
      price: req.body.price ? parseFloat(req.body.price) : product.price,
      oldPrice: req.body.oldPrice ? parseFloat(req.body.oldPrice) : product.oldPrice,
      category: req.body.category || product.category,
      stock: req.body.stock ? parseInt(req.body.stock) : product.stock,
      isFeatured: req.body.isFeatured ? req.body.isFeatured === 'true' : product.isFeatured,
      isBestSeller: req.body.isBestSeller ? req.body.isBestSeller === 'true' : product.isBestSeller,
      badge: req.body.badge || product.badge,
      careInstructions: req.body.careInstructions || product.careInstructions,
    };
    
    // Update slug if name changed
    if (req.body.name && req.body.name !== product.name) {
      updateData.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    // Handle tags array
    if (req.body.tags) {
      try {
        updateData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        updateData.tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Handle occasion array
    if (req.body.occasion) {
      try {
        updateData.occasion = JSON.parse(req.body.occasion);
      } catch (e) {
        updateData.occasion = req.body.occasion.split(',').map(occ => occ.trim());
      }
    }
    
    // Handle plant-specific fields
    if (req.body.careLevel) updateData.careLevel = req.body.careLevel;
    if (req.body.waterNeeds) updateData.waterNeeds = req.body.waterNeeds;
    
    if (req.body.petFriendly !== undefined) {
      updateData.petFriendly = req.body.petFriendly === 'true' || req.body.petFriendly === true;
    }
    if (req.body.airPurifying !== undefined) {
      updateData.airPurifying = req.body.airPurifying === 'true' || req.body.airPurifying === true;
    }
    
    // Handle new images - CLOUDINARY VERSION
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.path, // Cloudinary URL
        publicId: file.filename, // Cloudinary public ID
        isPrimary: product.images.length === 0 && index === 0
      }));
      
      updateData.images = [...(product.images || []), ...newImages];
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
    
    console.log('✅ Product updated successfully:', updatedProduct._id);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Delete uploaded files from Cloudinary if update failed
    if (req.files) {
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
    }
    
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
            console.log('🗑️ Deleted image from Cloudinary:', image.publicId);
          } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError);
          }
        }
      }
    }
    
    await product.deleteOne();
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all categories (admin)
// @route   GET /api/admin/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create category
// @route   POST /api/admin/categories
router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const categoryData = {
      name: req.body.name,
      description: req.body.description || '',
      slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
      type: req.body.type || 'flower'
    };
    
    if (req.file) {
      categoryData.image = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename // Cloudinary public ID
      };
    }
    
    const category = await Category.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const updateData = {
      name: req.body.name || category.name,
      description: req.body.description || category.description,
      slug: req.body.slug || category.slug,
      type: req.body.type || category.type
    };
    
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (category.image && category.image.publicId) {
        try {
          await cloudinary.uploader.destroy(category.image.publicId);
        } catch (cloudinaryError) {
          console.error('Error deleting old image:', cloudinaryError);
        }
      }
      
      updateData.image = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename // Cloudinary public ID
      };
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products. Please reassign products first.' 
      });
    }
    
    // Delete category image from Cloudinary if exists
    if (category.image && category.image.publicId) {
      try {
        await cloudinary.uploader.destroy(category.image.publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting category image:', cloudinaryError);
      }
    }
    
    await category.deleteOne();
    res.json({ message: 'Category removed successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all orders
// @route   GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'firstName lastName email')
      .populate('orderItems.product', 'name price images')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
router.put('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.orderStatus = status;
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
      order.isDelivered = true;
    }
    
    await order.save();
    
    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('orderItems.product', 'name price images');
      
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ 
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check Cloudinary connection
router.get('/debug/cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      message: 'Cloudinary connection successful',
      ping: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

module.exports = router;