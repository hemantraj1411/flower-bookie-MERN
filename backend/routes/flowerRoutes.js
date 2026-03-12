const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createFlower,
  getFlowers,
  getFlowerById,
  updateFlower,
  deleteFlower
} = require('../controllers/flowerController');

// Public routes
router.get('/', getFlowers);
router.get('/:id', getFlowerById);

// Admin routes
router.post('/', protect, admin, createFlower);
router.put('/:id', protect, admin, updateFlower);
router.delete('/:id', protect, admin, deleteFlower);

module.exports = router;