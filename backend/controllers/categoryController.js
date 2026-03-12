const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get flower categories only
// @route   GET /api/categories/flowers
// @access  Public
const getFlowerCategories = async (req, res) => {
  try {
    const categories = await Category.find({ type: 'flower' }).sort('name');
    res.json(categories);
  } catch (error) {
    console.error('Error in getFlowerCategories:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get plant categories only
// @route   GET /api/categories/plants
// @access  Public
const getPlantCategories = async (req, res) => {
  try {
    const categories = await Category.find({ type: 'plant' }).sort('name');
    res.json(categories);
  } catch (error) {
    console.error('Error in getPlantCategories:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error in getCategoryBySlug:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check if category already exists
    const categoryExists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    const category = await Category.create({
      name,
      slug,
      description: description || `${name} ${type === 'plant' ? 'plants' : 'flowers'}`,
      type: type || 'flower',
      isActive: true
    });
    
    console.log('✅ Category created:', category);
    
    res.status(201).json(category);
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    
    if (description) category.description = description;
    if (type) category.type = type;
    
    await category.save();
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getFlowerCategories,
  getPlantCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};