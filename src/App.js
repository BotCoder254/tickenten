import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import QueryProvider from './context/QueryProvider';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard from './pages/dashboard/Dashboard';
import EventForm from './pages/dashboard/EventForm';
import EventDetails from './pages/EventDetails';
import TicketDetails from './pages/TicketDetails';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import Events from './pages/Events';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Create theme context
export const ThemeContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user previously enabled dark mode
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    } else if (prefersDark) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Update class on html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <QueryProvider>
      <Router>
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<LandingPage />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:eventId" element={<EventDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password/:token" element={<ResetPassword />} />
                <Route path="verify-email/:token" element={<VerifyEmail />} />
              
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="dashboard/events/new" element={<EventForm />} />
                  <Route path="dashboard/events/edit/:eventId" element={<EventForm isEditing={true} />} />
                  <Route path="dashboard/events" element={<Dashboard />} />
                  <Route path="tickets/:ticketId" element={<TicketDetails />} />
                  <Route path="profile" element={<UserProfile />} />
                </Route>
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeContext.Provider>
      </Router>
    </QueryProvider>
  );
}

// Custom hook for using theme context
export const useTheme = () => useContext(ThemeContext);

export default App;
