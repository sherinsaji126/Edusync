import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '../services/courseService';
import api from '../services/api';
import AssessmentResults from './AssessmentResults';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set active tab from navigation state or default to 'courses'
  const [activeLink, setActiveLink] = useState('courses');
  
  // Update active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveLink(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const [allCourses, setAllCourses] = useState([]);
  const [coursesWithQuizzes, setCoursesWithQuizzes] = useState([]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First, fetch all courses
      const coursesResponse = await courseService.getCourses();
      setAllCourses(coursesResponse);
      
      // For each course, fetch its assessments
      const coursesWithAssessments = await Promise.all(
        coursesResponse.map(async (course) => {
          try {
            const courseId = course.courseId || course.CourseId;
            console.log(`Fetching assessments for course: ${courseId}`);
            console.log('Course data structure:', course); // Debug log
            const assessmentsResponse = await api.get(`/Assessment/course/${courseId}`);
            const assessments = Array.isArray(assessmentsResponse.data) ? assessmentsResponse.data : [];
            console.log(`Assessments for course ${courseId}:`, assessments);
            
            return {
              ...course,
              quizzes: assessments.map(assessment => ({
                id: assessment.AssessmentId,
                Title: assessment.Title || 'Untitled Assessment',
                Description: assessment.Description || 'Click to attempt the assessment',
                maxScore: assessment.MaxScore || 100,
                questions: assessment.Questions ? 
                           (typeof assessment.Questions === 'string' ? 
                               JSON.parse(assessment.Questions).Questions || [] : 
                               assessment.Questions) : 
                           []
              }))
            };
          } catch (error) {
            console.error(`Error fetching assessments for course ${course.courseId}:`, error);
            return {
              ...course,
              quizzes: []
            };
          }
        })
      );
      
      // Set courses with quizzes for the quiz section
      const filteredCourses = coursesWithAssessments.filter(course => 
        course.quizzes && course.quizzes.length > 0
      );
      
      setCoursesWithQuizzes(filteredCourses);
      
      // If we're on the courses tab, show all courses
      if (activeLink === 'courses') {
        setCourses(coursesResponse);
      } else {
        setCourses(filteredCourses);
      }
    } catch (err) {
      console.error('Error fetching courses with assessments:', err);
      setError('Failed to load data. Please try again later.');
      setCourses([]);
      setCoursesWithQuizzes([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Update courses when activeLink changes
  useEffect(() => {
    if (activeLink === 'courses') {
      setCourses(allCourses);
    } else {
      setCourses(coursesWithQuizzes);
    }
  }, [activeLink, allCourses, coursesWithQuizzes]);

  const handleLogout = () => {
    // Clear any stored user data/tokens
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    // Navigate to login page
    navigate('/login');
  };

  const handleNavClick = (link) => {
    if (link === 'logout') {
      handleLogout();
    } else {
      setActiveLink(link);
    }
  };

  const handleMyCoursesClick = () => {
    setShowEnrolledOnly(!showEnrolledOnly);
  };

  // Filter courses based on both search term and enrollment status
  const filteredCourses = courses.filter(course => {
    if (!course) return false;
    const courseTitle = course.Title || course.title || '';
    const matchesSearch = courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return showEnrolledOnly ? (matchesSearch && course.isEnrolled) : matchesSearch;
  });

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar Navigation */}
      <nav className="side-navbar">
        <div className="nav-brand">EduSync</div>
        <div className="nav-links">
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'courses' ? 'active' : ''}`}
            onClick={() => handleNavClick('courses')}
          >
            View Courses
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'quiz' ? 'active' : ''}`}
            onClick={() => handleNavClick('quiz')}
          >
            Attempt Quiz
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'results' ? 'active' : ''}`}
            onClick={() => handleNavClick('results')}
          >
            View Assessment Result
          </a>
          <a 
            href="#" 
            className="nav-link logout"
            onClick={() => handleLogout()}
          >
            Log Out
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="dashboard-container">
          {/* Welcome Header */}
          <div className="welcome-header">
            <h1>Welcome Student</h1>
          </div>

          {/* Content based on active link */}
          {activeLink === 'courses' && (
            <>
              <div className="courses-header">
                <div className="courses-filters">
                  <input
                    type="text"
                    placeholder="Filter by course title"
                    className="filter-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEnrolledOnly(false);
                      setSearchTerm('');
                    }}
                    className="view-all-link"
                  >
                    View All Courses
                  </a>
                  <span 
                    onClick={handleMyCoursesClick}
                    className={showEnrolledOnly ? 'active' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    MyCourses
                  </span>
                </div>
              </div>

              <div className="courses-list-header">
                <span className="course-title-header">
                  {showEnrolledOnly ? 'Enrolled Courses' : 'All Courses'}
                </span>
              </div>

              <div className="courses-grid">
                {filteredCourses.length === 0 ? (
                  <div className="no-courses-message">
                    {showEnrolledOnly ? 'No enrolled courses found.' : 'No courses match your search.'}
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <div 
                      key={course.CourseId || course.courseId} 
                      className="course-card clickable"
                      onClick={() => navigate(`/course/${course.CourseId || course.courseId}`)}
                    >
                      <h3>{course.Title || course.title}</h3>
                      <div className="course-info">
                        <p><strong>Instructor:</strong> {course.InstructorName || 'Instructor'}</p>
                        <p className="course-description">
                          {course.Description || course.description || 'No description available'}
                        </p>
                        <div className={`enroll-status ${course.isEnrolled ? 'enrolled' : ''}`}>
                          {course.isEnrolled ? 'Enrolled' : 'View Details'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeLink === 'quiz' && (
            <div className="quiz-dashboard">
              <div className="page-header">
                <h1>Available Quizzes</h1>
              </div>
              
              <div className="quizzes-grid">
                {loading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading quizzes...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : coursesWithQuizzes.length > 0 ? (
                  coursesWithQuizzes.flatMap(course => 
                    course.quizzes?.map(quiz => (
                      <div 
                        key={quiz.id}
                        className="quiz-card"
                      >
                        <h3>{quiz.Title || 'Untitled Course'}</h3>
                        <div className="quiz-meta" style={{ color: 'black' }}>
                          <span>Max Score: {quiz.maxScore}</span>
                        </div>
                        <button 
                          className="attempt-button"
                          onClick={() => navigate(`/quiz-attempt/${quiz.id}`)}
                        >
                          Attempt Quiz
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  <div className="no-quizzes">
                    <p>No quizzes available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLink === 'results' && (
            <div className="assessment-results-container">
              <AssessmentResults />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 