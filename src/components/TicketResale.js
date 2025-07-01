import React, { useState, useEffect, useRef } from 'react';
import { FaTag, FaUndo, FaPaypal, FaCreditCard } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';
import ticketService from '../services/ticketService';
import paypalService from '../services/paypalService';

const TicketResale = ({ ticket, onResaleComplete }) => {
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme();
  const [isResaleMode, setIsResaleMode] = useState(false);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  
  // Ref for the PayPal button container
  const paypalButtonRef = useRef(null);

  // Check if the ticket is valid for resale
  const canResell = ticket && 
                    (ticket.status === 'active' || ticket.status === 'valid') && 
                    isAuthenticated && 
                    user && 
                    ticket.user === user._id;

  // Check if ticket is already listed for resale
  const isListed = ticket && ticket.isForResale;

  // Update useEffect to load PayPal script
  useEffect(() => {
    if (isResaleMode && paymentMethod === 'paypal' && !paypalLoaded) {
      const loadPayPalScript = async () => {
        try {
          // Get client ID from our server
          const config = await paypalService.getClientConfig();
          if (config && config.success && config.data && config.data['client-id']) {
            await paypalService.loadScript(config.data['client-id']);
            setPaypalLoaded(true);
          } else {
            console.error('Invalid PayPal configuration from server');
            toast.error('PayPal is not available. Please use card payment instead.');
            setPaymentMethod('card');
          }
        } catch (error) {
          console.error('Error loading PayPal script:', error);
          toast.error('Failed to load PayPal. Please try again later.');
          setPaymentMethod('card');
        }
      };
      
      loadPayPalScript();
    }
  }, [isResaleMode, paymentMethod, paypalLoaded]);

  const validateForm = () => {
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      setError('Please enter a valid price greater than 0');
      return false;
    }
    setError('');
    return true;
  };

  const handleResale = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const resaleData = {
        resalePrice: parseFloat(price),
        description: description.trim() || 'Ticket for resale',
        paymentMethod: paymentMethod
      };

      const response = await ticketService.listTicketForResale(ticket._id, resaleData);
      
      if (response && response.success) {
        toast.success('Your ticket has been listed for resale');
        setIsResaleMode(false);
        setPrice('');
        setDescription('');
        
        if (onResaleComplete) {
          onResaleComplete();
        }
      } else {
        toast.error(response?.message || 'Failed to list ticket for resale');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list ticket for resale');
      console.error('Error listing ticket for resale:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelResale = async () => {
    try {
      setIsSubmitting(true);
      const response = await ticketService.cancelTicketResale(ticket._id);
      
      if (response && response.success) {
        toast.success('Your ticket has been removed from resale');
        
        if (onResaleComplete) {
          onResaleComplete();
        }
      } else {
        toast.error(response?.message || 'Failed to cancel ticket resale');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel ticket resale');
      console.error('Error canceling ticket resale:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setPaypalLoaded(false); // Reset PayPal loaded state when changing payment methods
  };

  if (!canResell) {
    return null;
  }

  if (isListed) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-yellow-50 dark:bg-dark-100 dark:border-dark-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Listed for Resale</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This ticket is currently listed for ${ticket.resalePrice?.toFixed(2) || '0.00'}
            </p>
            {ticket.paymentMethod && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Accepted payment: {ticket.paymentMethod === 'paypal' ? 'PayPal' : 'Card Payment'}
              </p>
            )}
          </div>
          <button
            onClick={handleCancelResale}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
          >
            <FaUndo className="inline-block mr-2" />
            {isSubmitting ? 'Processing...' : 'Cancel Resale'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border rounded-lg p-4 bg-gray-50 dark:bg-dark-100 dark:border-dark-300">
      {isResaleMode ? (
        <form onSubmit={handleResale}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">List Ticket for Resale</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resale Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-200 dark:border-dark-300 dark:text-white"
              placeholder="Enter price"
              required
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-200 dark:border-dark-300 dark:text-white"
              placeholder="Add details about your ticket"
              rows="3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Accepted Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-100 dark:hover:bg-dark-200 cursor-pointer">
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => handlePaymentMethodChange('card')}
                  className="h-4 w-4"
                />
                <FaCreditCard className="text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Card Payment (Paystack)</span>
              </label>
              
              <label className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-100 dark:hover:bg-dark-200 cursor-pointer">
                <input
                  type="radio"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => handlePaymentMethodChange('paypal')}
                  className="h-4 w-4"
                />
                <FaPaypal className="text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">PayPal</span>
              </label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting || (paymentMethod === 'paypal' && !paypalLoaded)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'List for Resale'}
              {paymentMethod === 'paypal' && !paypalLoaded && ' (Loading PayPal...)'}
            </button>
            <button
              type="button"
              onClick={() => setIsResaleMode(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-dark-400 rounded-md hover:bg-gray-100 dark:hover:bg-dark-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Resell Your Ticket</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Can't attend? List your ticket for resale to other users.
            </p>
          </div>
          <button
            onClick={() => setIsResaleMode(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            <FaTag className="inline-block mr-2" />
            Resell Ticket
          </button>
        </div>
      )}
    </div>
  );
};

export default TicketResale; 