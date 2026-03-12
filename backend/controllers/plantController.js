const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new plant (with image upload)
// @route   POST /api/admin/plants
// @access  Private/Admin
const createPlant = async (req, res) => {
  try {
    console.log('🌱 Creating plant with data:', req.body);
    console.log('📸 Files received:', req.files?.length || 0);

    const {
      name,
      shortDescription,
      description,
      price,
      oldPrice,
      category,
      careLevel,
      waterNeeds,
      petFriendly,
      airPurifying,
      careInstructions,
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

    // Process uploaded images - CLOUDINARY VERSION
    let processedImages = [];
    if (req.files && req.files.length > 0) {
      processedImages = req.files.map((file, index) => ({
        url: file.path, // Cloudinary returns the full URL in file.path
        publicId: file.filename, // Cloudinary public ID
        isPrimary: index === 0 // First image is primary
      }));
    } else {
      // If no images uploaded, use high-quality Unsplash image
      processedImages = [{
        url: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        publicId: `plant-default-${Date.now()}`,
        isPrimary: true
      }];
    }

    // Parse boolean values
    const parseBoolean = (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);
    };

    // Create plant with type='indoor'
    const plantData = {
      name,
      slug,
      shortDescription,
      description,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : 0,
      category,
      type: 'indoor', // Force type to indoor for plants
      images: processedImages,
      stock: Number(stock) || 0,
      careLevel: careLevel || 'easy',
      waterNeeds: waterNeeds || 'weekly',
      airPurifying: parseBoolean(airPurifying),
      petFriendly: parseBoolean(petFriendly),
      careInstructions: careInstructions || '',
      tags: tags,
      isFeatured: parseBoolean(isFeatured),
      isBestSeller: parseBoolean(isBestSeller),
      badge: badge || ''
    };

    console.log('📦 Creating plant with processed data:', plantData);

    const plant = await Product.create(plantData);

    // Populate category for response
    const populatedPlant = await Product.findById(plant._id)
      .populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Plant created successfully',
      plant: populatedPlant
    });
  } catch (error) {
    console.error('❌ Error creating plant:', error);
    
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
      error: 'Failed to create plant'
    });
  }
};

// @desc    Get all plants
// @route   GET /api/plants
// @access  Public
const getPlants = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;
    
    // Build query for plants only
    const query = { type: 'indoor' };
    
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
              plants: [],
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
              plants: [],
              page,
              pages: 1,
              total: 0
            });
          }
        }
      } catch (catError) {
        console.error('Error finding category:', catError);
        return res.json({
          plants: [],
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

    // Care level filter
    if (req.query.careLevel) {
      query.careLevel = req.query.careLevel.toLowerCase();
    }

    // Water needs filter
    if (req.query.waterNeeds) {
      query.waterNeeds = req.query.waterNeeds.toLowerCase();
    }

    // Air purifying filter
    if (req.query.airPurifying === 'true') {
      query.airPurifying = true;
    }

    // Pet friendly filter
    if (req.query.petFriendly === 'true') {
      query.petFriendly = true;
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

    // Get plants with pagination
    const plants = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      plants,
      page,
      pages: Math.ceil(total / pageSize),
      total,
      filters: {
        careLevels: ['easy', 'moderate', 'difficult'],
        waterNeeds: ['weekly', 'bi-weekly', 'monthly']
      }
    });
  } catch (error) {
    console.error('❌ Error in getPlants:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single plant
// @route   GET /api/plants/:id
// @access  Public
const getPlantById = async (req, res) => {
  try {
    const plant = await Product.findOne({ 
      _id: req.params.id,
      type: 'indoor' 
    }).populate('category', 'name slug');

    if (plant) {
      res.json(plant);
    } else {
      res.status(404).json({ message: 'Plant not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching plant:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update plant
// @route   PUT /api/admin/plants/:id
// @access  Private/Admin
const updatePlant = async (req, res) => {
  try {
    const plant = await Product.findOne({ 
      _id: req.params.id,
      type: 'indoor' 
    });

    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Parse boolean values
    const parseBoolean = (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);
    };

    // Parse tags
    let tags = plant.tags;
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch {
        tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    }

    // Process new images if uploaded - CLOUDINARY VERSION
    let images = plant.images;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.path, // Cloudinary returns the full URL
        publicId: file.filename, // Cloudinary public ID
        isPrimary: plant.images.length === 0 && index === 0
      }));
      images = [...plant.images, ...newImages];
    }

    const updateData = {
      name: req.body.name || plant.name,
      shortDescription: req.body.shortDescription || plant.shortDescription,
      description: req.body.description || plant.description,
      price: req.body.price ? Number(req.body.price) : plant.price,
      oldPrice: req.body.oldPrice ? Number(req.body.oldPrice) : plant.oldPrice,
      category: req.body.category || plant.category,
      stock: req.body.stock ? Number(req.body.stock) : plant.stock,
      careLevel: req.body.careLevel || plant.careLevel,
      waterNeeds: req.body.waterNeeds || plant.waterNeeds,
      airPurifying: req.body.airPurifying !== undefined ? parseBoolean(req.body.airPurifying) : plant.airPurifying,
      petFriendly: req.body.petFriendly !== undefined ? parseBoolean(req.body.petFriendly) : plant.petFriendly,
      careInstructions: req.body.careInstructions || plant.careInstructions,
      tags: tags,
      isFeatured: req.body.isFeatured !== undefined ? parseBoolean(req.body.isFeatured) : plant.isFeatured,
      isBestSeller: req.body.isBestSeller !== undefined ? parseBoolean(req.body.isBestSeller) : plant.isBestSeller,
      badge: req.body.badge || plant.badge,
      images: images,
      type: 'indoor'
    };

    const updatedPlant = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Plant updated successfully',
      plant: updatedPlant
    });
  } catch (error) {
    console.error('❌ Error updating plant:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete plant
// @route   DELETE /api/admin/plants/:id
// @access  Private/Admin
const deletePlant = async (req, res) => {
  try {
    const plant = await Product.findOne({ 
      _id: req.params.id,
      type: 'indoor' 
    });

    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Delete associated images from Cloudinary
    if (plant.images && plant.images.length > 0) {
      for (const image of plant.images) {
        if (image.publicId && !image.url.includes('unsplash')) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
            console.log('🗑️ Deleted image from Cloudinary:', image.publicId);
          } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError);
          }
        }
      }
    }

    await plant.deleteOne();
    res.json({ success: true, message: 'Plant removed successfully' });
  } catch (error) {
    console.error('❌ Error deleting plant:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPlant,
  getPlants,
  getPlantById,
  updatePlant,
  deletePlant
};