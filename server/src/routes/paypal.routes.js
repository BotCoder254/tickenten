/**
 * PayPal API Routes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paypalController = require('../controllers/paypal.controller');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

// GET /api/paypal/config - Get PayPal client config (public)
router.get('/config', paypalController.getClientConfig);

// POST /api/paypal/create-order - Create a new PayPal order
router.post(
  '/create-order',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').isString().withMessage('Currency must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    validateRequest
  ],
  paypalController.createOrder
);

// POST /api/paypal/verify - Verify a PayPal payment
router.post(
  '/verify',
  [
    body('paymentId').isString().withMessage('Payment ID must be a string'),
    body('orderId').isString().withMessage('Order ID must be a string'),
    validateRequest
  ],
  paypalController.verifyPayment
);

// POST /api/paypal/capture/:orderId - Capture a PayPal payment
router.post('/capture/:orderId', paypalController.capturePayment);

module.exports = router; 