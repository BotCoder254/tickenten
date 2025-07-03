import React from 'react';

const Spinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-t-[3px] border-b-[3px]',
    medium: 'h-8 w-8 border-t-[4px] border-b-[4px]',
    large: 'h-12 w-12 border-t-[5px] border-b-[5px]'
  };

  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} border-primary rounded-full animate-spin [animation-duration:1.2s]`}
          style={{ 
            animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
          }}
        ></div>
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full blur-[2px] opacity-30 bg-primary animate-pulse`}
        ></div>
      </div>
    </div>
  );
};

export default Spinner;
