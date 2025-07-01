import api from './api';

/**
 * PayPal service for handling PayPal-related API calls
 */
const paypalService = {
  /**
   * Get PayPal client configuration
   * @returns {Promise} - API response with PayPal client config
   */
  getClientConfig: async () => {
    try {
      const response = await api.get('/paypal/config');
      return response.data;
    } catch (error) {
      console.error('Error getting PayPal client config:', error);
      throw error;
    }
  },

  /**
   * Create a PayPal order
   * @param {Object} orderData - Order data with amount and currency
   * @returns {Promise} - API response with order details
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/paypal/create-order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  },

  /**
   * Verify a PayPal payment
   * @param {Object} paymentData - Payment data with payment ID and order ID
   * @returns {Promise} - API response with verification result
   */
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/paypal/verify', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying PayPal payment:', error);
      throw error;
    }
  },

  /**
   * Capture a PayPal payment
   * @param {string} orderId - PayPal order ID
   * @returns {Promise} - API response with capture result
   */
  capturePayment: async (orderId) => {
    try {
      const response = await api.post(`/paypal/capture/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      throw error;
    }
  },
  
  /**
   * Load the PayPal JavaScript SDK dynamically
   * @param {string} clientId - PayPal client ID
   * @returns {Promise} - Resolves when the SDK is loaded
   */
  loadScript: (clientId) => {
    return new Promise((resolve, reject) => {
      // Check if the script is already loaded
      const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
      if (existingScript) {
        console.log('PayPal script already loaded, reusing existing script');
        // If script exists but PayPal object isn't available, the script might be loading
        if (window.paypal) {
          resolve(window.paypal);
        } else {
          // Wait for script to finish loading
          existingScript.addEventListener('load', () => resolve(window.paypal));
          existingScript.addEventListener('error', () => reject(new Error('Failed to load existing PayPal SDK')));
        }
        return;
      }
      
      // Create the script element with cache-busting parameter to prevent caching issues
      const script = document.createElement('script');
      const timestamp = new Date().getTime();
      const uniqueId = Math.floor(Math.random() * 100000);
      
      // Add multiple parameters to prevent PayPal zoid issues:
      // - timestamp to prevent caching
      // - components to specify what to load
      // - a unique ID to prevent conflicts
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&t=${timestamp}&components=buttons&uid=${uniqueId}`;
      script.async = true;
      script.id = `paypal-script-${uniqueId}`;
      
      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        // Add a small delay to ensure proper initialization
        setTimeout(() => resolve(window.paypal), 100);
      };
      
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        reject(new Error('Failed to load PayPal SDK'));
        // Remove the failed script
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
      
      // Append the script to the document
      document.body.appendChild(script);
      
      // Set a timeout to prevent hanging if script fails to load correctly
      setTimeout(() => {
        if (!window.paypal) {
          console.error('PayPal SDK load timeout');
          reject(new Error('PayPal SDK load timeout'));
        }
      }, 10000); // 10 second timeout
    });
  }
};

export default paypalService; 