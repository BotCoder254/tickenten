/**
 * PayPal Configuration
 * This module provides configuration for PayPal API integration
 */

const dotenv = require('dotenv');
dotenv.config();

// PayPal configuration object
const paypalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID || 'AW6MOo3Tp54j86UI4EhDQLdeg6CflDSlz76o8IDLNE0TExi9PliIFg1lU1iAK_HxuvYS44QdSliyCXyu',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'EHYnX6ObyaQNBFqTKWDPtK_X3qepMOeu5qTQKhwszqYwocJ_LTGygepO5X02-ey03goRLfytynRfR14x',
  environment: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
  
  // Utility function to get PayPal SDK initialization object for client-side
  getClientSdkConfig: () => {
    return {
      'client-id': process.env.PAYPAL_CLIENT_ID || 'AW6MOo3Tp54j86UI4EhDQLdeg6CflDSlz76o8IDLNE0TExi9PliIFg1lU1iAK_HxuvYS44QdSliyCXyu',
      currency: 'USD',
      intent: 'capture'
    };
  },
  
  // Function to verify a PayPal transaction
  async verifyTransaction(paymentId, orderId) {
    try {
      // In a real implementation, you would use the PayPal SDK to verify the transaction
      // This is a placeholder that assumes the transaction is valid if both IDs are provided
      if (paymentId && orderId) {
        return {
          verified: true,
          details: {
            id: paymentId,
            orderId: orderId,
            status: 'COMPLETED',
            update_time: new Date().toISOString()
          }
        };
      }
      return { verified: false };
    } catch (error) {
      console.error('PayPal verification error:', error);
      return { verified: false, error: error.message };
    }
  }
};

module.exports = paypalConfig; 