import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import CourseCard from './CourseCard';
import '../styles/Dashboard.css';

const ViewCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterInstructor, setFilterInstructor] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            console.log('Fetching courses...');
            setLoading(true);
            setError('');
            
            // Fetch all available courses
            console.log('Calling courseService.getCourses()...');
            const allCourses = await courseService.getCourses();
            console.log('Courses received from API:', allCourses);
            
            if (!Array.isArray(allCourses)) {
                console.error('Expected an array of courses but received:', typeof allCourses);
                setError('Invalid course data received from server');
                return;
            }
            
            console.log(`Received ${allCourses.length} courses`);
            if (allCourses.length > 0) {
                console.log('First course sample:', allCourses[0]);
            }
            
            setCourses(allCourses);
        } catch (err) {
            console.error('Error fetching courses:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError('Failed to load courses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter courses based on search term and instructor filter
    const filteredCourses = courses.filter(course => {
        const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesInstructor = filterInstructor === '' || 
                                (course.instructorName && 
                                 course.instructorName.toLowerCase().includes(filterInstructor.toLowerCase()));
        
        return matchesSearch && matchesInstructor;
    });

    if (loading) {
        return <div className="loading">Loading courses...</div>;
    }

    if (error) {
        return (
            <div className="view-courses-container">
                <div className="error-message">
                    <h2>Error Loading Courses</h2>
                    <p>{error}</p>
                    <button onClick={fetchCourses} className="retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="view-courses-container">
            <div className="welcome-header">
                <h1>Available Courses</h1>
                <p>Browse and enroll in courses that interest you</p>
            </div>

            <div className="courses-section">
                <div className="filters-container">
                    <div className="search-filter">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="instructor-filter">
                        <input
                            type="text"
                            placeholder="Filter by instructor..."
                            className="search-input"
                            value={filterInstructor}
                            onChange={(e) => setFilterInstructor(e.target.value)}
                        />
                    </div>
                </div>

                {filteredCourses.length > 0 ? (
                    <div className="courses-grid">
                        {filteredCourses.map(course => (
                            <CourseCard key={course.courseId || course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="no-courses">
                        <h3>No courses found</h3>
                        <p>No courses match your search criteria. Try adjusting your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewCourses; 