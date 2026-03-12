const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
  getCategories,
  getFlowerCategories,
  getPlantCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Public routes
router.get('/', getCategories);
router.get('/flowers', getFlowerCategories);
router.get('/plants', getPlantCategories);
router.get('/id/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);

// Admin routes (protected)
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;