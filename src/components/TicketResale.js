import React, { useState } from 'react';
import { FaTag, FaUndo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';
import ticketService from '../services/ticketService';

const TicketResale = ({ ticket, onResaleComplete }) => {
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme();
  const [isResaleMode, setIsResaleMode] = useState(false);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check if the ticket is valid for resale
  const canResell = ticket && 
                    (ticket.status === 'active' || ticket.status === 'valid') && 
                    isAuthenticated && 
                    user && 
                    ticket.user === user._id;

  // Check if ticket is already listed for resale
  const isListed = ticket && ticket.isForResale;

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
        description: description.trim() || 'Ticket for resale'
      };

      await ticketService.listTicketForResale(ticket._id, resaleData);
      toast.success('Your ticket has been listed for resale');
      setIsResaleMode(false);
      setPrice('');
      setDescription('');
      
      if (onResaleComplete) {
        onResaleComplete();
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
      await ticketService.cancelTicketResale(ticket._id);
      toast.success('Your ticket has been removed from resale');
      
      if (onResaleComplete) {
        onResaleComplete();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel ticket resale');
      console.error('Error canceling ticket resale:', err);
    } finally {
      setIsSubmitting(false);
    }
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'List for Resale'}
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