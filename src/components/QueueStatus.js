import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import queueService from '../services/queueService';

/**
 * Queue Status Component
 * Displays the user's position in a ticket purchase queue
 * 
 * @param {Object} props
 * @param {string} props.eventId - The ID of the event
 * @param {string} props.queueId - Optional queue ID for unauthenticated users
 * @param {Function} props.onReady - Callback when user reaches the front of the queue
 * @param {boolean} props.autoRefresh - Whether to automatically refresh the queue status
 * @param {number} props.refreshInterval - Interval in ms for auto-refresh (default: 5000)
 */
const QueueStatus = ({ 
  eventId, 
  queueId = null, 
  onReady = () => {}, 
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [position, setPosition] = useState(null);
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimerId, setRefreshTimerId] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [countdown, setCountdown] = useState(refreshInterval / 1000);
  const [retryCount, setRetryCount] = useState(0);
  const [storedQueueId, setStoredQueueId] = useState(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(60);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Refs to keep track of the latest values in event callbacks
  const positionRef = useRef(position);
  const isProcessingRef = useRef(isProcessing);
  const timeoutWarningRef = useRef(timeoutWarning);
  
  // Update refs when state changes
  useEffect(() => {
    positionRef.current = position;
    isProcessingRef.current = isProcessing;
    timeoutWarningRef.current = timeoutWarning;
  }, [position, isProcessing, timeoutWarning]);

  // Calculate estimated wait time (2 minutes per person in queue)
  const estimatedWaitTime = position > 0 ? position * 2 : 0;
  
  // Format the wait time into minutes
  const formatWaitTime = (minutes) => {
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  // Check for stored queueId on component mount
  useEffect(() => {
    const stored = localStorage.getItem(`queue_${eventId}`);
    if (stored) {
      setStoredQueueId(stored);
    }
  }, [eventId]);

  // Try to rejoin the queue if we've lost our position
  const tryRejoinQueue = async () => {
    try {
      setLoading(true);
      setError('Attempting to rejoin queue...');
      const response = await queueService.joinQueue(eventId, {});
      
      if (response.success) {
        // Successfully rejoined
        setPosition(response.data.position);
        setTotal(response.data.total);
        setIsProcessing(response.data.isProcessing);
        setError(null);
        setRetryCount(0);
        setTimeoutWarning(false);
        setTimeoutCountdown(60);
        
        if (response.data.queueId) {
          setStoredQueueId(response.data.queueId);
          localStorage.setItem(`queue_${eventId}`, response.data.queueId);
        }
        
        // If user is at position 0 (processing) or 1 (next), call onReady
        if (response.data.position <= 1 || response.data.isProcessing) {
          onReady(response.data);
        }
      } else {
        setError('Could not rejoin the queue. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Error rejoining queue:', err);
      setError('Failed to rejoin the queue. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Check queue position
  const checkQueuePosition = async () => {
    try {
      setLoading(true);
      // Use stored queueId if available and no queueId was provided as prop
      const queueIdToUse = queueId || storedQueueId;
      const response = await queueService.checkPosition(eventId, queueIdToUse);
      
      if (response.success) {
        // Special case: if position is -1 but we know the user was previously processing,
        // they might have completed their purchase but the queue modal is still open
        if (response.data.position === -1 && isProcessing) {
          // Assume they've completed their purchase
          setError(null);
          onReady({
            position: 0,
            total: 0,
            isProcessing: true
          });
          return;
        }
        
        setPosition(response.data.position);
        setTotal(response.data.total);
        setIsProcessing(response.data.isProcessing);
        setError(null);
        setRetryCount(0); // Reset retry count on success
        
        // Reset timeout warning if user is still active
        if (timeoutWarning) {
          setTimeoutWarning(false);
          setTimeoutCountdown(60);
        }
        
        // If response contains a queueId, store it
        if (response.data.queueId && response.data.queueId !== storedQueueId) {
          setStoredQueueId(response.data.queueId);
          localStorage.setItem(`queue_${eventId}`, response.data.queueId);
        }
        
        // If user is at position 0 (processing) or 1 (next), call onReady
        if (response.data.position <= 1 || response.data.isProcessing) {
          onReady(response.data);
        }
      } else {
        // If we have a specific error message from the API, use it
        const errorMessage = response.data?.error || 'Failed to get queue position';
        setError(errorMessage);
        
        // If position is -1, try to rejoin the queue after a few retries
        if (response.data?.position === -1 && retryCount >= 3) {
          tryRejoinQueue();
        } else {
          setRetryCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error checking queue position:', err);
      setError('Error checking queue position. Please try again.');
      setRetryCount(prev => prev + 1);
      
      // If we've retried several times, try to rejoin the queue
      if (retryCount >= 3) {
        tryRejoinQueue();
      }
    } finally {
      setLoading(false);
      setLastChecked(new Date());
      setCountdown(refreshInterval / 1000);
    }
  };

  // Subscribe to socket.io updates
  useEffect(() => {
    if (!eventId) return;
    
    // Subscribe to real-time updates
    const unsubscribe = queueService.subscribeToQueueUpdates(eventId, (data) => {
      setSocketConnected(true);
      
      // Only trigger a full refresh if we're not already loading
      if (!loading) {
        checkQueuePosition();
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [eventId]);

  // Initial check and setup auto-refresh
  useEffect(() => {
    // Initial check
    checkQueuePosition();
    
    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const timerId = setInterval(checkQueuePosition, refreshInterval);
      setRefreshTimerId(timerId);
      
      // Set up countdown timer
      const countdownId = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : refreshInterval / 1000));
      }, 1000);
      
      // Clean up on unmount
      return () => {
        clearInterval(timerId);
        clearInterval(countdownId);
      };
    }
  }, [eventId, queueId, autoRefresh, refreshInterval]);

  // Set up timeout warning when user is processing
  useEffect(() => {
    let timeoutId;
    
    // If user is processing, start a countdown to warn about timeout
    if (isProcessing && !timeoutWarning) {
      // Start warning at 30 seconds before timeout (assuming 1 minute timeout)
      timeoutId = setTimeout(() => {
        setTimeoutWarning(true);
        
        // Start countdown from 30 seconds
        setTimeoutCountdown(30);
        
        // Set up countdown timer
        const countdownId = setInterval(() => {
          setTimeoutCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Clean up countdown on unmount
        return () => {
          clearInterval(countdownId);
        };
      }, 30000); // Show warning after 30 seconds of processing
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isProcessing, timeoutWarning]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    checkQueuePosition();
  };

  // If there's an error or position is -1, show error state
  if (error || position === -1) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-800 dark:text-red-300 mb-2">
          {error || 'We couldn\'t find your position in the queue.'}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
          This could happen for several reasons:
          <br />• Your queue session may have expired after inactivity
          <br />• You may have already completed your purchase
          <br />• There might be a temporary connection issue
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Try Again'}
          </button>
          <button
            onClick={tryRejoinQueue}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
            disabled={loading}
          >
            Rejoin Queue
          </button>
        </div>
      </div>
    );
  }

  // If position is null (initial loading)
  if (position === null) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500 mr-2"></div>
          <p className="text-gray-700 dark:text-gray-300">Checking queue position...</p>
        </div>
      </div>
    );
  }

  // If user is currently processing their purchase
  if (isProcessing) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2 text-center">
          It's Your Turn!
        </h3>
        <p className="text-green-700 dark:text-green-400 text-center">
          You can now complete your purchase. Please proceed within the next {timeoutWarning ? timeoutCountdown : '60'} seconds.
        </p>
        
        {timeoutWarning && (
          <div className="mt-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-yellow-800 dark:text-yellow-300 text-center font-medium">
              Warning: Your session will expire in {timeoutCountdown} seconds!
            </p>
            <p className="text-yellow-700 dark:text-yellow-400 text-center text-sm mt-1">
              Please complete your purchase or you'll lose your place in line.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Normal queue display
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-1">
          You're in Line
        </h3>
        <p className="text-blue-700 dark:text-blue-400">
          Please don't refresh or close this page
        </p>
      </div>

      {/* Queue position indicator */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-full max-w-xs h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-2">
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-400"
            initial={{ width: 0 }}
            animate={{ 
              width: position > 0 && total > 0 
                ? `${Math.max(5, 100 - ((position / total) * 100))}%` 
                : '5%' 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between w-full max-w-xs text-xs text-blue-700 dark:text-blue-400">
          <span>Queue Start</span>
          <span>Your Position</span>
          <span>Front</span>
        </div>
      </div>

      {/* Queue stats */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
          Position: {position} {total > 0 ? `of ${total}` : ''}
        </p>
        {estimatedWaitTime > 0 && (
          <p className="text-blue-700 dark:text-blue-400 text-sm">
            Estimated wait time: ~{formatWaitTime(estimatedWaitTime)}
          </p>
        )}
      </div>

      {/* Socket connection status */}
      <div className="text-center mb-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          socketConnected 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1 ${socketConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          {socketConnected ? 'Real-time updates active' : 'Using polling updates'}
        </span>
      </div>

      {/* Auto-refresh info */}
      {autoRefresh && (
        <div className="text-center text-xs text-blue-600 dark:text-blue-500">
          <p>Refreshing in {countdown} seconds</p>
          {lastChecked && (
            <p>Last updated: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>
      )}

      {/* Manual refresh button */}
      <div className="text-center mt-4">
        <button
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>
    </div>
  );
};

export default QueueStatus; 