import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

function ProtectedRoute({ children, roles }) {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    // Role not authorized, redirect to home page
    return <Navigate to="/" />;
  }

  // Authorized, render component
  return children;
}

export default ProtectedRoute; 