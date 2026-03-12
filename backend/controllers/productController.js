const Product = require('../models/Product');
const Category = require('../models/Category');

// Define plant categories for automatic type detection (for backward compatibility)
const PLANT_CATEGORIES = [
  'Snake Plant', 'Peace Lily', 'Monstera', 'Succulents', 'Cactus', 'Fern',
  'Pothos', 'ZZ Plant', 'Air Plants', 'Bonsai', 'Aloe', 'Spider Plant',
  'Rubber Plant', 'Fiddle Leaf Fig', 'Calathea', 'Philodendron', 'bosaï plant'
];

const FLOWER_CATEGORIES = [
  'Roses', 'Tulips', 'Lilies', 'Orchids', 'Sunflowers', 'Mixed Bouquets',
  'Daisies', 'Carnations', 'Chrysanthemums', 'Peonies', 'Hydrangeas'
];

// Helper function to determine product type based on category (for backward compatibility)
const determineProductType = (product) => {
  if (product.type) return product.type; // Use existing type if present
  
  const categoryName = product.category?.name || 
                       (typeof product.category === 'string' ? product.category : '');
  const productName = product.name?.toLowerCase() || '';
  
  // Check if it's a plant
  if (PLANT_CATEGORIES.some(cat => categoryName.toLowerCase().includes(cat.toLowerCase())) ||
      PLANT_CATEGORIES.some(cat => productName.includes(cat.toLowerCase())) ||
      productName.includes('plant') || 
      productName.includes('cactus') || 
      productName.includes('succulent')) {
    return 'indoor';
  }
  
  // Check if it's a flower
  if (FLOWER_CATEGORIES.some(cat => categoryName.toLowerCase().includes(cat.toLowerCase())) ||
      FLOWER_CATEGORIES.some(cat => productName.includes(cat.toLowerCase())) ||
      productName.includes('rose') || 
      productName.includes('lily') || 
      productName.includes('tulip')) {
    return 'flower';
  }
  
  return 'flower'; // Default to flower
};

// @desc    Get all products (unified endpoint)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;
    
    // Build query
    let query = {};
    
    // Handle type filtering - now using direct type field
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

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
              products: [],
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
              products: [],
              page,
              pages: 1,
              total: 0
            });
          }
        }
      } catch (catError) {
        console.error('Error finding category:', catError);
        return res.json({
          products: [],
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
        case 'price':
          sortOption.price = 1;
          break;
        case '-price':
          sortOption.price = -1;
          break;
        case 'rating':
          sortOption.rating = -1;
          break;
        case '-rating':
          sortOption.rating = -1;
          break;
        case 'newest':
          sortOption.createdAt = -1;
          break;
        case 'oldest':
          sortOption.createdAt = 1;
          break;
        case 'name':
          sortOption.name = 1;
          break;
        case '-name':
          sortOption.name = -1;
          break;
        default:
          sortOption.createdAt = -1;
      }
    } else {
      sortOption.createdAt = -1;
    }

    // Get products with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(total / pageSize),
      total
    });
  } catch (error) {
    console.error('❌ Error in getProducts:', error);
    res.status(500).json({ 
      message: error.message,
      error: 'Failed to fetch products'
    });
  }
};

// @desc    Get flowers only (using dedicated flower routes)
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

// @desc    Get plants only (using dedicated plant routes)
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');
    
    if (product) {
      // Get related products from same category and type
      const relatedProducts = await Product.find({
        category: product.category,
        type: product.type,
        _id: { $ne: product._id },
        stock: { $gt: 0 }
      })
      .populate('category', 'name slug')
      .limit(4);

      res.json({
        product,
        relatedProducts
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('❌ Error in getProductById:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name slug');
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('❌ Error in getProductBySlug:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const { type } = req.query;
    let query = { isFeatured: true, stock: { $gt: 0 } };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .limit(8);

    res.json(products);
  } catch (error) {
    console.error('❌ Error in getFeaturedProducts:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get best seller products
// @route   GET /api/products/bestsellers
// @access  Public
const getBestSellers = async (req, res) => {
  try {
    const { type } = req.query;
    let query = { isBestSeller: true, stock: { $gt: 0 } };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .limit(8);

    res.json(products);
  } catch (error) {
    console.error('❌ Error in getBestSellers:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const pageSize = 12;
    const page = Number(req.query.page) || 1;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const query = { category: categoryId };
    
    // Filter by type if specified
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    const total = await Product.countDocuments(query);
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(req.query.sort || '-createdAt')
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug
      },
      page,
      pages: Math.ceil(total / pageSize),
      total
    });
  } catch (error) {
    console.error('❌ Error in getProductsByCategory:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = {
      name: `${req.user.firstName} ${req.user.lastName}`,
      rating: Number(rating),
      comment,
      user: req.user._id
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    const totalRating = product.reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = totalRating / product.reviews.length;

    await product.save();

    res.status(201).json({ 
      message: 'Review added successfully',
      review: {
        rating: product.rating,
        numReviews: product.numReviews,
        reviews: product.reviews
      }
    });
  } catch (error) {
    console.error('❌ Error in createProductReview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Public
const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalStock: { $sum: '$stock' },
          averageRating: { $avg: '$rating' },
          inStock: { $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
        }
      }
    ]);

    // Get stats by type
    const typeStats = await Product.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          count: 1,
          totalStock: 1
        }
      }
    ]);

    res.json({
      overall: stats[0] || { 
        totalProducts: 0, 
        inStock: 0, 
        outOfStock: 0 
      },
      byType: typeStats,
      byCategory: categoryStats
    });
  } catch (error) {
    console.error('❌ Error in getProductStats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ],
      stock: { $gt: 0 }
    };

    // Filter by type if specified
    if (type && type !== 'all') {
      query.type = type;
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .limit(20);

    res.json({
      products,
      total: products.length,
      query: q,
      type: type || 'all'
    });
  } catch (error) {
    console.error('❌ Error in searchProducts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Export all functions
module.exports = {
  getProducts,
  getFlowers,
  getPlants,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getBestSellers,
  getProductsByCategory,
  createProductReview,
  getProductStats,
  searchProducts
};