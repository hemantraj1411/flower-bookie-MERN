const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');

// @desc    Create a new flower (with image upload)
// @route   POST /api/admin/flowers
// @access  Private/Admin
const createFlower = async (req, res) => {
  try {
    console.log('🌸 Creating flower with data:', req.body);
    console.log('📸 Files received:', req.files?.length || 0);

    const {
      name,
      shortDescription,
      description,
      price,
      oldPrice,
      category,
      occasion,
      stock,
      isFeatured,
      isBestSeller,
      badge
    } = req.body;

    // Parse tags if they're sent as JSON string
    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch {
        tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    }

    // Parse occasion if it's sent as JSON string
    let occasions = [];
    if (req.body.occasion) {
      try {
        occasions = JSON.parse(req.body.occasion);
      } catch {
        occasions = req.body.occasion.split(',').map(occ => occ.trim());
      }
    }

    // Validate required fields
    if (!name || !shortDescription || !description || !price || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'shortDescription', 'description', 'price', 'category']
      });
    }

    // Validate category
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if product exists
    const productExists = await Product.findOne({ slug });
    if (productExists) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    // Process uploaded images
    let processedImages = [];
    if (req.files && req.files.length > 0) {
      processedImages = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        publicId: file.filename,
        isPrimary: index === 0 // First image is primary
      }));
    } else {
      // If no images uploaded, use placeholder
      processedImages = [{
        url: 'https://via.placeholder.com/500x500?text=Flower',
        publicId: `flower-default-${Date.now()}`,
        isPrimary: true
      }];
    }

    // Parse boolean values
    const parseBoolean = (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);
    };

    // Create flower with type='flower'
    const flowerData = {
      name,
      slug,
      shortDescription,
      description,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : 0,
      category,
      type: 'flower', // Force type to flower
      images: processedImages,
      stock: Number(stock) || 0,
      occasion: occasions,
      tags: tags,
      isFeatured: parseBoolean(isFeatured),
      isBestSeller: parseBoolean(isBestSeller),
      badge: badge || ''
    };

    console.log('📦 Creating flower with processed data:', flowerData);

    const flower = await Product.create(flowerData);

    // Populate category for response
    const populatedFlower = await Product.findById(flower._id)
      .populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Flower created successfully',
      flower: populatedFlower
    });
  } catch (error) {
    console.error('❌ Error creating flower:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Deleted file:', file.filename);
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: error.message,
      error: 'Failed to create flower'
    });
  }
};

// @desc    Get all flowers
// @route   GET /api/flowers
// @access  Public
const getFlowers = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;
    
    // Build query for flowers only
    const query = { type: 'flower' };
    
    // Keyword search
    if (req.query.keyword) {
      query.name = { $regex: req.query.keyword, $options: 'i' };
    }

    // Category filter - FIXED: Handle both ID and name
    if (req.query.category) {
      try {
        // First try to find by ID
        if (req.query.category.match(/^[0-9a-fA-F]{24}$/)) {
          const categoryDoc = await Category.findById(req.query.category);
          if (categoryDoc) {
            query.category = categoryDoc._id;
          } else {
            return res.json({
              flowers: [],
              page,
              pages: 1,
              total: 0
            });
          }
        } else {
          // It's a category name, find by name or slug
          const categoryDoc = await Category.findOne({
            $or: [
              { name: { $regex: new RegExp(`^${req.query.category}$`, 'i') } },
              { slug: req.query.category.toLowerCase() }
            ]
          });
          
          if (categoryDoc) {
            query.category = categoryDoc._id;
          } else {
            // If no category found, return empty result
            return res.json({
              flowers: [],
              page,
              pages: 1,
              total: 0
            });
          }
        }
      } catch (catError) {
        console.error('Error finding category:', catError);
        return res.json({
          flowers: [],
          page,
          pages: 1,
          total: 0
        });
      }
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Occasion filter
    if (req.query.occasion) {
      if (Array.isArray(req.query.occasion)) {
        query.occasion = { $in: req.query.occasion };
      } else {
        query.occasion = { $in: [req.query.occasion] };
      }
    }

    // Featured filter
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }

    // Best seller filter
    if (req.query.bestSeller === 'true') {
      query.isBestSeller = true;
    }

    // In stock filter
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Get total count
    const total = await Product.countDocuments(query);

    // Determine sort order
    let sortOption = {};
    if (req.query.sort) {
      switch(req.query.sort) {
        case 'price': sortOption.price = 1; break;
        case '-price': sortOption.price = -1; break;
        case 'rating': sortOption.rating = -1; break;
        case 'newest': sortOption.createdAt = -1; break;
        default: sortOption.createdAt = -1;
      }
    } else {
      sortOption.createdAt = -1;
    }

    // Get flowers with pagination
    const flowers = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Get unique occasions for filter
    const occasions = await Product.distinct('occasion', { type: 'flower' });

    res.json({
      flowers,
      page,
      pages: Math.ceil(total / pageSize),
      total,
      filters: {
        occasions: occasions.filter(Boolean)
      }
    });
  } catch (error) {
    console.error('❌ Error in getFlowers:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single flower
// @route   GET /api/flowers/:id
// @access  Public
const getFlowerById = async (req, res) => {
  try {
    const flower = await Product.findOne({ 
      _id: req.params.id,
      type: 'flower' 
    }).populate('category', 'name slug');

    if (flower) {
      res.json(flower);
    } else {
      res.status(404).json({ message: 'Flower not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching flower:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update flower
// @route   PUT /api/admin/flowers/:id
// @access  Private/Admin
const updateFlower = async (req, res) => {
  try {
    const flower = await Product.findOne({ 
      _id: req.params.id,
      type: 'flower' 
    });

    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    // Parse boolean values
    const parseBoolean = (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);
    };

    // Parse tags
    let tags = flower.tags;
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch {
        tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    }

    // Parse occasions
    let occasions = flower.occasion;
    if (req.body.occasion) {
      try {
        occasions = JSON.parse(req.body.occasion);
      } catch {
        occasions = req.body.occasion.split(',').map(occ => occ.trim());
      }
    }

    // Process new images if uploaded
    let images = flower.images;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        publicId: file.filename,
        isPrimary: flower.images.length === 0 && index === 0
      }));
      images = [...flower.images, ...newImages];
    }

    const updateData = {
      name: req.body.name || flower.name,
      shortDescription: req.body.shortDescription || flower.shortDescription,
      description: req.body.description || flower.description,
      price: req.body.price ? Number(req.body.price) : flower.price,
      oldPrice: req.body.oldPrice ? Number(req.body.oldPrice) : flower.oldPrice,
      category: req.body.category || flower.category,
      stock: req.body.stock ? Number(req.body.stock) : flower.stock,
      occasion: occasions,
      tags: tags,
      isFeatured: req.body.isFeatured !== undefined ? parseBoolean(req.body.isFeatured) : flower.isFeatured,
      isBestSeller: req.body.isBestSeller !== undefined ? parseBoolean(req.body.isBestSeller) : flower.isBestSeller,
      badge: req.body.badge || flower.badge,
      images: images,
      type: 'flower'
    };

    const updatedFlower = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Flower updated successfully',
      flower: updatedFlower
    });
  } catch (error) {
    console.error('❌ Error updating flower:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete flower
// @route   DELETE /api/admin/flowers/:id
// @access  Private/Admin
const deleteFlower = async (req, res) => {
  try {
    const flower = await Product.findOne({ 
      _id: req.params.id,
      type: 'flower' 
    });

    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    // Delete associated images
    if (flower.images && flower.images.length > 0) {
      flower.images.forEach(image => {
        if (image.publicId && !image.url.includes('placeholder')) {
          const filePath = path.join(__dirname, '../uploads', image.publicId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Deleted image:', image.publicId);
          }
        }
      });
    }

    await flower.deleteOne();
    res.json({ success: true, message: 'Flower removed successfully' });
  } catch (error) {
    console.error('❌ Error deleting flower:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFlower,
  getFlowers,
  getFlowerById,
  updateFlower,
  deleteFlower
};