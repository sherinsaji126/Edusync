import axios from 'axios';

const API_BASE_URL = 'http://localhost:7154/api';  // Add /api to base URL

// Create the axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true // Enable CORS credentials
});

// Add a request interceptor for JWT tokens
api.interceptors.request.use(
    (config) => {
        // For multipart/form-data requests, don't set Content-Type
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle specific status codes
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        // Create a more informative error message
        let errorMessage = 'An error occurred';
        const responseData = error.response?.data;
        
        if (responseData) {
            if (typeof responseData === 'string') {
                errorMessage = responseData;
            } else if (responseData.title || responseData.detail) {
                errorMessage = responseData.detail || responseData.title;
            } else if (responseData.errors) {
                errorMessage = Object.entries(responseData.errors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
            } else if (responseData.message) {
                errorMessage = responseData.message;
            }
        }
        
        // Create enhanced error with all details
        const enhancedError = new Error(errorMessage);
        enhancedError.response = error.response;
        enhancedError.status = error.response?.status;
        
        return Promise.reject(enhancedError);
    }
);

export default api;