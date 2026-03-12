// backend/controllers/paymentController.js
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret'
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    console.log('🔍 Verifying payment:', req.body);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing payment verification details' 
      });
    }

    // Generate signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_secret')
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid payment signature' 
      });
    }

    // Update order payment status if orderId is provided
    if (orderId) {
      const order = await Order.findById(orderId);
      
      if (order) {
        order.paymentStatus = 'completed';
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: razorpay_payment_id,
          status: 'completed',
          update_time: new Date().toISOString(),
          email_address: req.user?.email || ''
        };
        
        // Add to timeline
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'payment_completed',
          description: 'Payment completed successfully',
          timestamp: new Date()
        });
        
        // Add to tracking history
        order.trackingHistory = order.trackingHistory || [];
        order.trackingHistory.push({
          status: 'payment_completed',
          timestamp: new Date(),
          note: 'Payment completed successfully'
        });
        
        await order.save();
        console.log('✅ Order payment updated:', orderId);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Payment verification failed',
      error: error.message 
    });
  }
};

// @desc    Handle payment failure
// @route   POST /api/payment/failure
// @access  Private
const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, error } = req.body;
    
    if (orderId) {
      const order = await Order.findById(orderId);
      
      if (order) {
        order.paymentStatus = 'failed';
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'payment_failed',
          description: error?.description || 'Payment failed',
          timestamp: new Date()
        });
        
        await order.save();
      }
    }
    
    res.json({
      success: false,
      message: 'Payment failed'
    });
  } catch (error) {
    console.error('Payment failure handler error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error handling payment failure' 
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  handlePaymentFailure
};