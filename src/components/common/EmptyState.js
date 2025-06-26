import React from 'react';
import { motion } from 'framer-motion';
import { FaTicketAlt } from 'react-icons/fa';

const EmptyState = ({ 
  title = 'No Items Found', 
  message = 'There are no items to display.', 
  icon = <FaTicketAlt className="w-12 h-12" />,
  actionButton = null 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 dark:bg-dark-100 rounded-lg"
    >
      <div className="text-gray-400 dark:text-gray-500 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
        {message}
      </p>
      {actionButton && (
        <div>
          {actionButton}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState; 