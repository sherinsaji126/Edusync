import api from './api';

export const authService = {
    async register(userData) {
        try {
            console.log('Registering user with data:', {
                ...userData,
                Password: userData.Password ? '[REDACTED]' : 'undefined',
                Role: userData.Role,
                RoleType: typeof userData.Role
            });
            
            // Format the data with properties at root level and PascalCase
            const registrationData = {
                Name: userData.name,
                Email: userData.email,
                Password: userData.password,
                Role: userData.role === 'Student' ? 0 : 1 // 0 for Student, 1 for Teacher
            };
            
            console.log('Sending registration data to server:', {
                ...registrationData,
                Password: '[REDACTED]' // Don't log the actual password
            });
            
            const response = await api.post('/auth/register', registrationData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                transformRequest: [(data, headers) => {
                    // Ensure we're sending proper JSON
                    return JSON.stringify(data);
                }]
            });
            
            console.log('Registration response:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers
            });
            
            if (response.status >= 200 && response.status < 300) {
                console.log('Registration successful:', response.data);
                return response.data;
            } else {
                // Handle 4xx errors
                const errorMessage = response.data?.title || 'Registration failed';
                const errorDetails = response.data?.errors ? 
                    Object.entries(response.data.errors).map(([key, value]) => `${key}: ${value}`).join('\n') :
                    response.data?.detail || JSON.stringify(response.data);
                
                const error = new Error(errorMessage);
                error.details = errorDetails;
                error.status = response.status;
                throw error;
            }
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Registration error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                config: error.config,
                request: error.request
            });
            
            // Log the full error for debugging
            console.error('Registration error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data
                }
            });

            // Default error message
            let errorMessage = 'Registration failed. ';
            
            // Try to extract a meaningful error message
            try {
                // Check if we have a response with data
                if (error.response?.data) {
                    const errorData = error.response.data;
                    
                    // Handle validation errors (MVC model state)
                    if (errorData.errors) {
                        errorMessage = Object.entries(errorData.errors)
                            .map(([key, value]) => {
                                const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                                const message = Array.isArray(value) ? value.join('. ') : String(value);
                                return `${fieldName}: ${message}`;
                            })
                            .join('\n');
                    }
                    // Handle standard error format
                    else if (errorData.title || errorData.detail) {
                        errorMessage = errorData.detail || errorData.title || errorMessage;
                    }
                    // Handle string error
                    else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                    // Handle other object formats
                    else {
                        errorMessage = JSON.stringify(errorData);
                    }
                }
                // Handle network errors
                else if (error.message) {
                    errorMessage = `Network error: ${error.message}`;
                }
                
                console.log('Processed error message:', errorMessage);
                
            } catch (e) {
                console.error('Error processing error:', e);
                errorMessage = 'An error occurred during registration. Please try again.';
            }
            
            // Create a simple error with the message
            const registrationError = new Error(errorMessage);
            registrationError.status = error.response?.status;
            throw registrationError;
        }
    },

    async login(credentials) {
        try {
            console.log('Sending login request to:', `${api.defaults.baseURL}/auth/login`);
            const response = await api.post('/auth/login', credentials);
            
            if (!response.data) {
                console.error('Empty response from server');
                throw new Error('Invalid response from server');
            }
            
            console.log('Login response data:', response.data);
            
            // Extract token and user data from the response
            const { token, user: userData } = response.data;
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            // Store the token in localStorage
            localStorage.setItem('token', token);
            
            // Parse the token to get user data
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const tokenData = JSON.parse(jsonPayload);
            console.log('Decoded token data:', tokenData);
            
            // Extract user data from token
            const userId = tokenData.sub;
            const userEmail = tokenData.email || '';
            const userName = tokenData.name || tokenData.unique_name || '';
            
            // Handle role extraction - check both 'role' and 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
            let userRole = tokenData.role || tokenData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
            
            // Handle role array or single value
            if (Array.isArray(userRole) && userRole.length > 0) {
                // Use the first role if it's an array
                userRole = userRole[0];
            }
            
            // Ensure role is properly capitalized and handle numeric roles
            if (userRole) {
                if (typeof userRole === 'number') {
                    userRole = userRole === 1 ? 'Instructor' : 'Student';
                } else if (typeof userRole === 'string') {
                    userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
                }
            }
            
            // Store user data in localStorage
            if (userRole) localStorage.setItem('userRole', userRole);
            if (userName) localStorage.setItem('userName', userName);
            if (userId) localStorage.setItem('userId', userId);
            if (userEmail) localStorage.setItem('userEmail', userEmail);
            
            console.log('Stored user data in localStorage:', {
                userRole: localStorage.getItem('userRole'),
                userName: localStorage.getItem('userName'),
                userId: localStorage.getItem('userId'),
                userEmail: localStorage.getItem('userEmail')
            });
            
            return {
                token,
                user: {
                    id: userId,
                    name: userName,
                    email: userEmail,
                    role: userRole
                }
            };
            
            // Token parsing and user data extraction is now handled above
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
    },

    getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const userData = JSON.parse(jsonPayload);
            
            // Get role from token first, fallback to localStorage
            let userRole = userData.role || 
                         userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                         localStorage.getItem('userRole') ||
                         '';
            
            // Ensure consistent role formatting
            if (userRole) {
                if (typeof userRole === 'number') {
                    userRole = userRole === 1 ? 'Instructor' : 'Student';
                } else if (typeof userRole === 'string') {
                    userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
                }
            }
            
            return {
                id: userData.sub,
                name: userData.name || userData.unique_name || localStorage.getItem('userName') || '',
                email: userData.email || localStorage.getItem('userEmail') || '',
                role: userRole
            };
        } catch (error) {
            console.error('Error parsing token:', error);
            // Fallback to localStorage if token parsing fails
            return {
                id: localStorage.getItem('userId'),
                name: localStorage.getItem('userName') || '',
                email: localStorage.getItem('userEmail') || '',
                role: localStorage.getItem('userRole') || ''
            };
        }
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};