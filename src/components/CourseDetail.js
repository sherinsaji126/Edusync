import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Dashboard.css';

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isUnenrolling, setIsUnenrolling] = useState(false);
    const [enrollError, setEnrollError] = useState('');
    const userRole = localStorage.getItem('userRole');
    const isInstructor = userRole === 'Instructor';
    
    // Get media URL with fallbacks
    const mediaUrl = course?.mediaUrl || course?.MediaUrl || course?.mediaURL || course?.MediaURL;
    
    // Log enrollment status changes
    useEffect(() => {
        console.log('Enrollment status changed:', { isEnrolled, course });
        if (isEnrolled) {
            console.log('User is now enrolled in the course');
        }
    }, [isEnrolled, course]);

    const fetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching course data for ID:', courseId);
            const response = await api.get(`/Course/${courseId}`);
            console.log('API Response:', response);
            
            // Handle the response structure: response.data.data for the actual course data
            const responseData = response.data;
            const courseData = responseData.data || responseData; // Handle both {data: {...}} and direct response
            
            console.log('Fetched course data:', courseData);
            
            // Set isEnrolled based on the course data if available
            if (!isInstructor) {
                // Check if the course data includes enrollment status (check both cases for the property name)
                const isUserEnrolled = courseData.isEnrolled === true || courseData.IsEnrolled === true;
                console.log('Setting isEnrolled to:', isUserEnrolled);
                
                // Update the course data to ensure both property names are set consistently
                const updatedCourseData = {
                    ...courseData,
                    isEnrolled: isUserEnrolled,
                    IsEnrolled: isUserEnrolled
                };
                
                setCourse(updatedCourseData);
                setIsEnrolled(isUserEnrolled);
                
                if (isUserEnrolled) {
                    console.log('User is already enrolled in this course');
                } else {
                    console.log('User is not enrolled in this course');
                }
            } else {
                setCourse(courseData);
            }
        } catch (err) {
            console.error('Error fetching course:', err);
            setError('Failed to load course details');
        } finally {
            setLoading(false);
        }
    }, [courseId, isInstructor]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    const handleEnroll = async () => {
        try {
            console.log('Starting enrollment process...');
            setIsEnrolling(true);
            setEnrollError('');
            
            // Use the courseId from the URL if available, otherwise use the one from course object
            const effectiveCourseId = courseId || (course?.courseId || course?.id);
            console.log('Attempting to enroll in course ID:', effectiveCourseId);
            
            if (!effectiveCourseId) {
                const error = new Error('Course ID is missing');
                console.error(error);
                throw error;
            }
            
            // Call the enrollment API with courseId in the URL (note: URL is case-sensitive)
            console.log('Making API call to enroll...');
            const response = await api.post(`/enrollment/enroll/${effectiveCourseId}`).catch(error => {
                console.error('API Error:', error);
                console.error('Error response:', error.response);
                throw error;
            });
            
            console.log('Enrollment API response:', response);
            
            if (response && (response.data?.success || response.status === 200 || response.status === 204)) {
                console.log('Enrollment successful, updating UI...');
                
                // Manually set enrolled to true since the server response might not include it
                setIsEnrolled(true);
                setEnrollError('');
                
                // Update the course data with the response if available
                if (response.data) {
                    console.log('Updating course data from response:', response.data);
                    setCourse(prev => ({
                        ...prev,
                        ...response.data,
                        isEnrolled: true,  // Force set isEnrolled to true
                        IsEnrolled: true    // Also set the capitalized version for consistency
                    }));
                } else {
                    // If no course data in response, update the course state manually
                    console.log('No course data in response, updating state manually');
                    setCourse(prev => ({
                        ...prev,
                        isEnrolled: true,
                        IsEnrolled: true
                    }));
                }
            } else {
                const errorMessage = response?.data?.message || 'Failed to enroll in course. Please try again.';
                console.error('Enrollment failed:', errorMessage);
                setEnrollError(errorMessage);
            }
        } catch (err) {
            console.error('Error enrolling in course:', err);
            let errorMessage = 'Failed to enroll. Please try again.';
            
            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage = 'Course not found.';
                } else if (err.response.status === 409) {
                    errorMessage = 'You are already enrolled in this course.';
                    setIsEnrolled(true);
                } else if (err.response.data) {
                    errorMessage = err.response.data.message || 
                                 err.response.data.title || 
                                 JSON.stringify(err.response.data);
                } else {
                    errorMessage = err.response.statusText || errorMessage;
                }
            } else if (err.request) {
                errorMessage = 'No response from server. Please check your connection.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setEnrollError(errorMessage);
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleUnenroll = async () => {
        if (!window.confirm('Are you sure you want to unenroll from this course?')) {
            return;
        }

        try {
            console.log('Starting unenrollment process...');
            setIsUnenrolling(true);
            setEnrollError('');
            
            const effectiveCourseId = courseId || (course?.courseId || course?.id);
            console.log('Attempting to unenroll from course ID:', effectiveCourseId);
            
            if (!effectiveCourseId) {
                const error = new Error('Course ID is missing');
                console.error(error);
                throw error;
            }
            
            console.log('Making API call to unenroll...');
            const response = await api.delete(`/Enrollment/Unenroll/${effectiveCourseId}`).catch(error => {
                console.error('API Error:', error);
                console.error('Error response:', error.response);
                throw error;
            });
            
            console.log('Unenrollment API response:', response);
            
            if (response && (response.data?.success || response.status === 200 || response.status === 204)) {
                console.log('Unenrollment successful, updating UI...');
                
                // Manually set enrolled to false since the server response might not include it
                setIsEnrolled(false);
                setEnrollError('');
                
                // Update the course data to reflect unenrollment
                setCourse(prev => ({
                    ...prev,
                    isEnrolled: false,
                    IsEnrolled: false
                }));
                
                // Show success message
                console.log('Successfully unenrolled from the course');
            } else {
                const errorMessage = response?.data?.message || 'Failed to unenroll from course. Please try again.';
                console.error('Unenrollment failed:', errorMessage);
                setEnrollError(errorMessage);
            }
        } catch (err) {
            console.error('Error unenrolling from course:', err);
            let errorMessage = 'Failed to unenroll. Please try again.';
            
            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage = 'Enrollment not found.';
                } else if (err.response.data) {
                    errorMessage = err.response.data.message || 
                                 err.response.data.title || 
                                 JSON.stringify(err.response.data);
                } else {
                    errorMessage = err.response.statusText || errorMessage;
                }
            } else if (err.request) {
                errorMessage = 'No response from server. Please check your connection.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setEnrollError(errorMessage);
        } finally {
            setIsUnenrolling(false);
        }
    };

    const handleEdit = () => {
        navigate(`/edit-course/${courseId}`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await api.delete(`/Course/${courseId}`);
                navigate('/instructor');
            } catch (err) {
                console.error('Error deleting course:', err);
                setError('Failed to delete course');
            }
        }
    };

    if (loading) return <div className="loading">Loading course details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!course) return <div className="error-message">Course not found</div>;

    return (
        <div className="dashboard-container">
            <div className="welcome-header">
                <h1>{course.title || course.Title || 'Course Details'}</h1>
                <p>{isInstructor ? 'Manage your course' : 'Course Details'}</p>
                {enrollError && <div className="error-message">{enrollError}</div>}
            </div>

            <div className="course-detail-container">
                <div className="course-card">
                    <div className="course-content">
                        <h2 className="course-title">{course.title || course.Title || 'Untitled Course'}</h2>
                        <p className="course-description">{course.description || course.Description || 'No description available'}</p>
                        {course.InstructorName && (
                            <p className="instructor-info">
                                <i className="fas fa-chalkboard-teacher"></i> Instructor: {course.InstructorName}
                            </p>
                        )}
                        
                        {/* Course Media Section */}
                        <div className="course-media-url" style={{ marginTop: '20px' }}>
                            {isInstructor || isEnrolled ? (
                                mediaUrl ? (
                                    <div>
                                        <h4 style={{ marginBottom: '10px' }}>Course Media:</h4>
                                        <a 
                                            href={mediaUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="media-link"
                                            style={{
                                                display: 'inline-block',
                                                padding: '10px 15px',
                                                backgroundColor: '#e9ecef',
                                                borderRadius: '4px',
                                                color: '#007bff',
                                                textDecoration: 'none',
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            {mediaUrl}
                                        </a>
                                    </div>
                                ) : (
                                    <div className="media-availability">
                                        <p>No media available for this course.</p>
                                    </div>
                                )
                            ) : (
                                <div className="media-availability" style={{
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    borderLeft: '4px solid #6c757d'
                                }}>
                                    <p style={{ margin: 0 }}>Please enroll to access the course media</p>
                                </div>
                            )}
                        </div>

                        {!isInstructor && (
                            <div className="enrollment-section" style={{
                                margin: '30px 0',
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <div className="enroll-container" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    flexWrap: 'wrap'
                                }}>
                                    {isEnrolled ? (
                                        <>
                                            <div className="enrolled-badge" style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 20px',
                                                backgroundColor: '#e8f5e9',
                                                color: '#2e7d32',
                                                borderRadius: '20px',
                                                fontWeight: '500',
                                                fontSize: '1rem'
                                            }}>
                                                <i className="fas fa-check-circle"></i> Enrolled
                                            </div>
                                            <button 
                                                className="unEnroll-button"
                                                onClick={handleUnenroll}
                                                disabled={isUnenrolling}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem',
                                                    transition: 'all 0.3s ease',
                                                    opacity: isUnenrolling ? 0.7 : 1
                                                }}
                                            >
                                                {isUnenrolling ? 'Unenrolling...' : 'Unenroll'}
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            className="enroll-button"
                                            onClick={handleEnroll}
                                            disabled={isEnrolling}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: '500',
                                                transition: 'all 0.3s ease',
                                                opacity: isEnrolling ? 0.7 : 1
                                            }}
                                        >
                                            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                                        </button>
                                    )}
                                </div>
                                
                                {enrollError && (
                                    <div className="error-message" style={{
                                        marginTop: '15px',
                                        padding: '10px 15px',
                                        backgroundColor: '#f8d7da',
                                        color: '#721c24',
                                        borderRadius: '4px',
                                        border: '1px solid #f5c6cb',
                                        fontSize: '0.9rem'
                                    }}>
                                        {enrollError}
                                    </div>
                                )}
                                
                                {isEnrolled && mediaUrl && (
                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e9ecef' }}>
                                        <p style={{ margin: '0 0 10px 0', color: '#495057' }}>
                                            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                                            You now have access to the course media above.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {isInstructor && (
                        <div className="course-actions">
                            <button 
                                className="edit-button"
                                onClick={handleEdit}
                            >
                                Edit Course
                            </button>
                            <button 
                                className="delete-button"
                                onClick={handleDelete}
                            >
                                Delete Course
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
