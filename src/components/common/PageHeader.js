import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon = null, 
  action = null,
  className = ''
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 ${className}`}
    >
      <div className="flex items-center mb-4 md:mb-0">
        {icon && (
          <div className="mr-3 text-2xl">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="w-full md:w-auto">
          {action}
        </div>
      )}
    </motion.div>
  );
};

export default PageHeader; 