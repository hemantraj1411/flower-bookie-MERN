const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  cancelOrder
} = require('../controllers/orderController');

router.route('/')
  .post(protect, createOrder)
  .get(protect, getOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

router.route('/:id/deliver')
  .put(protect, updateOrderToDelivered);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

module.exports = router;