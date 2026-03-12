const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/authController');

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('phone').isMobilePhone()
  ],
  registerUser
);

router.post('/login', loginUser);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router
  .route('/wishlist')
  .post(protect, addToWishlist);

router
  .route('/wishlist/:productId')
  .delete(protect, removeFromWishlist);

module.exports = router;