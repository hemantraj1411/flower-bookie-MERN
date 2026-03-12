// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyPayment,
  handlePaymentFailure
} = require('../controllers/paymentController');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failure', protect, handlePaymentFailure);

module.exports = router;