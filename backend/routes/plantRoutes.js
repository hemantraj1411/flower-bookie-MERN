const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createPlant,
  getPlants,
  getPlantById,
  updatePlant,
  deletePlant
} = require('../controllers/plantController');

// Public routes
router.get('/', getPlants);
router.get('/:id', getPlantById);

// Admin routes
router.post('/', protect, admin, createPlant);
router.put('/:id', protect, admin, updatePlant);
router.delete('/:id', protect, admin, deletePlant);

module.exports = router;