import axios from 'axios';

// Create axios instance with base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define public routes that don't require authentication
const publicRoutes = [
  // Events
  '/events',
  '/api/events',
  '/events/featured',
  '/api/events/featured',
  '/events/search',
  '/api/events/search',
  '/events/categories',
  '/api/events/categories',
  
  // Tickets
  '/tickets/purchase',
  '/api/tickets/purchase',
  '/tickets/verify',
  '/api/tickets/verify',
  
  // Authentication
  '/auth/login',
  '/api/auth/login',
  '/auth/register',
  '/api/auth/register',
  '/auth/forgot-password',
  '/api/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/reset-password',
  '/auth/verify-email',
  '/api/auth/verify-email',
  
  // Patterns for dynamic routes
  '/events/',
  '/api/events/'
];

// Check if a URL is a public route that doesn't require authentication
const isPublicRoute = (url) => {
  // Remove query parameters for comparison
  const cleanUrl = url.split('?')[0];
  
  // For exact matches
  if (publicRoutes.includes(cleanUrl)) {
    return true;
  }
  
  // For pattern matches (like specific event routes)
  for (const route of publicRoutes) {
    // If it's a pattern route (ends with '/')
    if (route.endsWith('/')) {
      // Check if URL starts with the route pattern
      if (cleanUrl.startsWith(route)) {
        return true;
      }
    }
  }
  
  // Special case for event ID routes like /events/123456
  if (/^\/events\/[0-9a-fA-F]{24}$/.test(cleanUrl) || 
      /^\/api\/events\/[0-9a-fA-F]{24}$/.test(cleanUrl)) {
    return true;
  }
  
  return false;
};

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Log request details for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Always add token if it exists, regardless of route
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    } else {
      console.log('No token found, proceeding without authentication');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} for ${response.config.url}`);
    return response;
  },
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

    console.error(`API Error: ${error.response.status} for ${error.config?.url}`, error.response.data);

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      const url = error.config.url;
      
      // Only redirect to login for protected routes, not for public browsing
      const publicRouteRequest = isPublicRoute(url);
      console.log(`Route ${url} is public: ${publicRouteRequest}`);
      
      // Clear token and redirect to login if not already there and not a public route
      if (localStorage.getItem('token') && !publicRouteRequest) {
        console.log('Unauthorized access to protected route, redirecting to login');
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