import api from './api';

export const courseService = {
    async createCourse(formData) {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            // Verify user role (case-insensitive check)
            const userRole = localStorage.getItem('userRole');
            if (!userRole || typeof userRole !== 'string' || !userRole.match(/instructor/i)) {
                console.error('User role check failed. Current role:', userRole);
                throw new Error('Only instructors can create courses. Your account does not have the required permissions.');
            }

            // Log the form data being sent for debugging
            console.log('Creating course with form data:', {
                title: formData.get('title'),
                description: formData.get('description'),
                hasMediaFile: formData.get('mediaFile') ? 'Yes' : 'No'
            });

            // Make the request with the authorization header and form data
            const response = await api.post('/course', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
                withCredentials: true
            });

            console.log('Course creation successful:', response.data);
            return response.data;
        } catch (error) {
            // Log the error for debugging
            console.error('Course creation error:', error.response?.data || error);
            
            // If it's an axios error with a response, throw the response data
            if (error.response?.data) {
                throw error.response.data;
            }
            
            // If it's a client-side error (like validation), throw the error as is
            if (error instanceof Error) {
                throw error;
            }
            
            // For any other type of error, throw a generic error
            throw new Error('Failed to create course. Please try again.');
        }
    },

    async getCourses() {
        try {
            // Get the current user's role
            const userRole = localStorage.getItem('userRole');
            console.log('Current user role:', userRole);
            
            // Choose the appropriate endpoint based on user role
            const endpoint = userRole === 'Instructor' 
                ? '/course/GetInstructorCourses' 
                : '/course';
                
            console.log(`Fetching courses from ${endpoint}...`);
            const response = await api.get(endpoint);
            console.log('Response status:', response.status);
            console.log('Courses received:', response.data);
            
            // Extract the courses array from the response
            // The response has a structure like: { success: true, data: [...], message: null }
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            
            // If the expected structure is not found, return an empty array
            console.warn('Unexpected response format, returning empty array');
            return [];
        } catch (error) {
            console.error('Error fetching courses:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });
            throw new Error(error.response?.data?.message || 'Failed to fetch courses. Please try again later.');
        }
    },

    async getCourseById(id) {
        const response = await api.get(`/course/${id}`);
        return response.data;
    },

    async updateCourse(id, courseData) {
        const response = await api.put(`/course/${id}`, courseData);
        return response.data;
    },

    async deleteCourse(id) {
        const response = await api.delete(`/course/${id}`);
        return response.data;
    },

    async uploadCourseContent(id, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post(`/course/${id}/content`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async getCourseStudents(id) {
        const response = await api.get(`/course/${id}/students`);
        return response.data;
    }
}; 