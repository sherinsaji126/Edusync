import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import Navbar from './Navbar';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  useEffect(() => {
    let isMounted = true;
    return () => { isMounted = false };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', { email }); // Don't log password

      try {
        // Format credentials according to backend requirements
        const loginData = {
          Email: email.trim(),
          Password: password
        };

        console.log('Sending login data:', { 
          email: loginData.Email,
          password: 'REDACTED' 
        });

        const response = await authService.login(loginData);

        console.log('Login response:', {
          token: response.token ? 'received' : 'missing',
          user: response.user ? 'received' : 'missing',
          role: response.user?.role
        });

        // Store token and user info
        if (!response.token) {
          throw new Error('Invalid response from server - no token received');
        }

        // Store token
        localStorage.setItem('token', response.token);
        
        // Store user data if available
        if (response.user) {
          const { id, name, email, role } = response.user;
          console.log('Setting user role in localStorage:', role); // Debug log
          localStorage.setItem('userRole', role);
          console.log('userRole after setting:', localStorage.getItem('userRole')); // Verify
          localStorage.setItem('userName', name);
          localStorage.setItem('userId', id);
          localStorage.setItem('userEmail', email);
          
          // Debug: Log all localStorage items
          console.log('All localStorage items:', JSON.stringify(localStorage, null, 2));
          
          // Redirect based on role (case-insensitive check)
          const normalizedRole = role?.toLowerCase();
          if (normalizedRole === 'student') {
            navigate('/student');
          } else if (normalizedRole === 'instructor') {
            navigate('/instructor');
          } else {
            console.error('Invalid user role received:', role);
            setError('Invalid user role received');
          }
        } else {
          setError('User data missing from response');
        }
      } catch (error) {
        console.error('Login error in LoginPage:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="welcome-banner">
          <h1>Welcome to EduSync</h1>
          <p>Your Smart Learning Management Platform</p>
        </div>
        <div className="login-container">
          <div className="login-box">
            <h2 className="login-title">Sign In</h2>

            {state?.registrationSuccess && (
              <div className="success-message">
                Registration successful! Please log in with your credentials.
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="login-footer">
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
