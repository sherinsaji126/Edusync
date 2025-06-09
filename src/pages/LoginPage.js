import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user was redirected from registration
    if (location.state?.fromRegister) {
      setSuccess('Registration successful! Please log in with your credentials.');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get form data
      const formData = new FormData(e.target);
      const credentials = {
        Email: formData.get('email').trim(),
        Password: formData.get('password')
      };

      // Clear any existing auth data before login
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');

      const response = await authService.login(credentials);
      console.log('Login response:', response);
      
      // Get the token from localStorage (it was set by authService)
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token received');
      }

      // Parse the token to get user data
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const userData = JSON.parse(jsonPayload);
      console.log('Decoded user data from token:', userData);
      
      // Extract user data from token
      const userRole = userData.role ? userData.role.toLowerCase() : null;
      const userName = userData.name || '';
      const userEmail = userData.email || '';
      const userId = userData.sub || '';
      
      // Store user data in localStorage
      if (userRole) {
        localStorage.setItem('userRole', userRole);
        console.log('Setting user role in localStorage:', userRole);
      }
      if (userName) localStorage.setItem('userName', userName);
      if (userId) localStorage.setItem('userId', userId);
      if (userEmail) localStorage.setItem('userEmail', userEmail);

      console.log('All localStorage items:', {
        userEmail: localStorage.getItem('userEmail'),
        token: localStorage.getItem('token') ? 'exists' : 'missing',
        userRole: localStorage.getItem('userRole'),
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName')
      });

      // Redirect based on role
      if (userRole) {
        console.log('Redirecting to dashboard for role:', userRole);
        
        if (userRole === 'student') {
          navigate('/student-dashboard');
        } else if (userRole === 'instructor' || userRole === 'admin') {
          navigate('/instructor-dashboard');
        } else {
          console.error('Invalid user role:', userRole);
          setError('Your account has an invalid role. Please contact support.');
        }
      } else {
        console.error('No role found in user data');
        setError('Unable to determine user role. Please try again.');
      }
    } catch (err) {
      // Extract error message from response
      const errorData = err.response?.data || {};
      const errorMessage = errorData.error || errorData.message || err.message;
      console.error('Login error:', { error: err, response: err.response });
      setError(errorMessage || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h1 className="login-title">Welcome Back to EduSync</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <label className="input-label">Email</label>
        <input 
          type="email" 
          name="email" 
          placeholder="Enter your email" 
          required 
          disabled={loading}
        />

        <label className="input-label">Password</label>
        <input 
          type="password" 
          name="password" 
          placeholder="Enter your password" 
          required 
          disabled={loading}
        />

        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="login-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
