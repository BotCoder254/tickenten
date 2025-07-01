/**
 * PayPal Controller
 * Handles PayPal API interactions and payment verification
 */

const paypalConfig = require('../config/paypal');

/**
 * Get PayPal SDK configuration for client-side initialization
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getClientConfig = async (req, res) => {
  try {
    // Return the PayPal SDK configuration for client-side
    const config = paypalConfig.getClientSdkConfig();
    
    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting PayPal client config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get PayPal configuration'
    });
  }
};

/**
 * Verify a PayPal payment
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    
    if (!paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and Order ID are required'
      });
    }
    
    // Verify the payment with PayPal
    const verification = await paypalConfig.verifyTransaction(paymentId, orderId);
    
    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verification.error || 'Invalid payment'
      });
    }
    
    // Return success with verification details
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: verification.details
    });
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Create an order with PayPal
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, description } = req.body;
    
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      });
    }
    
    // In a real implementation, you would use the PayPal SDK to create an order
    // This is a placeholder that returns a mock order ID
    const mockOrderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return res.status(200).json({
      success: true,
      data: {
        id: mockOrderId,
        status: 'CREATED',
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`,
            rel: 'approve',
            method: 'GET'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create PayPal order'
    });
  }
};

/**
 * Capture a PayPal payment
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.capturePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    // In a real implementation, you would use the PayPal SDK to capture the payment
    // This is a placeholder that returns a successful capture
    const captureData = {
      id: `CAPTURE-${Date.now()}`,
      status: 'COMPLETED',
      order_id: orderId,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      message: 'Payment captured successfully',
      data: captureData
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to capture payment'
    });
  }
}; 