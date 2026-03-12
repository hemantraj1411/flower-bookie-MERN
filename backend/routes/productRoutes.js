const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/flowers', getFlowers);
router.get('/plants', getPlants);
router.get('/stats', getProductStats);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestSellers);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/search', searchProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;