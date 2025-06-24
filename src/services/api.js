import axios from 'axios';

// Create axios instance with base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define public routes that don't require authentication
const publicRoutes = [
  '/events',
  '/api/events',
  '/events/featured',
  '/api/events/featured',
  '/events/search',
  '/api/events/search',
  '/tickets/purchase',
  '/api/tickets/purchase',
  '/tickets/verify',
  '/api/tickets/verify'
];

// Check if a URL is a public route that doesn't require authentication
const isPublicRoute = (url) => {
  return publicRoutes.some(route => url.includes(route));
};

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // For network errors (no response)
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        ...error,
        response: {
          status: 0,
          data: { message: 'Network error. Please check your connection.' }
        }
      });
    }

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      const url = error.config.url;
      
      // Only redirect to login for protected routes, not for public browsing
      const publicRouteRequest = isPublicRoute(url);
      
      // Clear token and redirect to login if not already there and not a public route
      if (localStorage.getItem('token') && !publicRouteRequest) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 