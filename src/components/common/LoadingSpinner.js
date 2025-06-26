import React from 'react';
import Spinner from '../Spinner';

// This component exists for backwards compatibility
const LoadingSpinner = (props) => {
  return <Spinner {...props} />;
};

export default LoadingSpinner; 