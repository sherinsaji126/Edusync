import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Simple function to ensure we have a string error message
  const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return String(error);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Debug log
    console.log('Starting registration...');

    try {
      const formData = new FormData(e.target);
      
      // Validate input before sending
      const name = formData.get('name').trim();
      const email = formData.get('email').trim();
      const password = formData.get('password');
      const role = formData.get('role');

      if (!name || name.length === 0) {
        throw new Error('Name is required');
      }
      
      if (!email || !email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      // Password must be at least 8 characters, with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
      
      if (!password) {
        throw new Error('Password is required');
      }
      
      if (!passwordRegex.test(password)) {
        throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
      }
      
      if (!role || !['Student', 'Instructor'].includes(role)) {
        throw new Error('Role must be either Student or Instructor');
      }

      // Prepare user data with proper case sensitivity
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role // This should be 'Student' or 'Instructor'
      };
      
      console.log('Sending registration data:', {
        ...userData,
        password: '[REDACTED]' // Don't log the actual password
      });

      const response = await authService.register(userData);
      setSuccess('Registration successful! Redirecting to login...');
      
      // Wait for 2 seconds before redirecting to show the success message
      setTimeout(() => {
        navigate('/login', { state: { fromRegister: true } });
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = getErrorMessage(error);
      console.log('Registration failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleRegister}>
        <h1 className="register-title">Create Your EduSync Account</h1>

        {error && (
          <div className="error-message">
            {getErrorMessage(error)
              .split('\n')
              .map((line, i) => (
                <div key={i}>{line}</div>
              ))}
          </div>
        )}
        {success && <div className="success-message">{success}</div>}

        <label className="input-label">Full Name</label>
        <input 
          type="text" 
          name="name" 
          placeholder="Full Name" 
          required 
          disabled={loading}
        />

        <label className="input-label">Email</label>
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          required 
          disabled={loading}
        />

        <label className="input-label">Role</label>
        <select name="role" required disabled={loading}>
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
        </select>

        <label className="input-label">Password</label>
        <input 
          type="password" 
          name="password" 
          placeholder="Create a strong password" 
          required 
          disabled={loading}
          minLength="8"
        />
        <div className="password-hint">
          Password must be at least 8 characters and include:
          <ul>
            <li>One uppercase letter (A-Z)</li>
            <li>One lowercase letter (a-z)</li>
            <li>One number (0-9)</li>
            <li>One special character (!@#$%^&*)</li>
          </ul>
        </div>

        <button 
          type="submit" 
          className="register-button"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="register-footer">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

const styles = `
  .password-hint {
    margin: 8px 0;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
    font-size: 0.9em;
    color: #666;
  }
  
  .password-hint ul {
    margin: 5px 0 0 20px;
    padding: 0;
  }
  
  .password-hint li {
    margin: 3px 0;
  }
`;

// Add styles to the document head when the component mounts
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

export default RegisterPage;
