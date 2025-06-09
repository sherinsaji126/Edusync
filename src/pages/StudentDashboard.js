import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { courseService } from '../services/courseService';
import '../styles/Dashboard.css';

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstructor, setFilterInstructor] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
    
    // Check for submission result in location state
    if (location.state?.submissionResult) {
      setResult(location.state.submissionResult);
      setShowResult(true);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    filterCourses();
  }, [searchTerm, filterInstructor, courses]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const filterCourses = () => {
    let filtered = [...courses];
    
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterInstructor) {
      filtered = filtered.filter(course =>
        course.instructor?.name?.toLowerCase().includes(filterInstructor.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching courses...');
      const fetchedCourses = await courseService.getCourses();
      console.log('Fetched courses:', fetchedCourses);
      setCourses(fetchedCourses);
      setFilteredCourses(fetchedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <div className="dashboard-layout">
      {showResult && result && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>Quiz Submitted Successfully!</h2>
            <div className="result-score">
              Your Score: <span className="score">{result.score}</span> / {result.maxScore}
              <div className="score-percentage">
                ({(result.score / result.maxScore * 100).toFixed(1)}%)
              </div>
            </div>
            <button 
              onClick={handleCloseResult}
              className="close-result-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <nav className="side-navbar">
        <Link to="/dashboard" className="nav-brand">EduSync</Link>
        <div className="nav-links">
          <Link to="/courses" className={`nav-link ${location.pathname === '/courses' ? 'active' : ''}`}>
            View Courses
          </Link>
          <Link to="/quiz" className={`nav-link ${location.pathname === '/quiz' ? 'active' : ''}`}>
            Attempt Quiz
          </Link>
          <Link to="/results" className={`nav-link ${location.pathname === '/results' ? 'active' : ''}`}>
            View Assessment Result
          </Link>
          <Link to="#" className="nav-link" onClick={handleLogout}>
            Log Out
          </Link>
        </div>
      </nav>

      <main className="main-content">
        <div className="dashboard-container">
          <div className="welcome-header">
            <h1>Welcome, {user?.name || 'Student'}</h1>
          </div>

          <div className="courses-header">
            <h2>All Courses</h2>
            <div className="courses-filters">
              <input
                type="text"
                placeholder="Search by course title"
                className="filter-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <input
                type="text"
                placeholder="Filter by instructor name"
                className="filter-input"
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
              />
            </div>
          </div>

          <div className="courses-grid">
            {filteredCourses.length === 0 ? (
              <div className="no-courses">No courses found</div>
            ) : (
              filteredCourses.map((course, index) => {
                console.log(`Rendering course ${index + 1}:`, course);
                return (
                  <div key={course.courseId} className="course-card">
                    <h3 className="course-title" style={{ 
                      fontSize: '1.2rem', 
                      marginBottom: '1rem',
                      color: '#2c3e50'
                    }}>
                      {course.title || 'No Title'}
                    </h3>
                    <div className="course-content">
                      <p className="course-instructor" style={{ 
                        marginBottom: '1rem',
                        color: '#34495e'
                      }}>
                        <i className="fas fa-chalkboard-teacher"></i> 
                        Instructor: {course.instructorName || 'Unknown'}
                      </p>
                      <p className="course-description" style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontSize: '1rem', 
                        lineHeight: '1.5', 
                        color: 'black',
                        margin: '1rem 0'
                      }}>
                        {course.description || 'No description available'}
                      </p>
                      {course.mediaUrl && (
                        <div className="course-media">
                          <img 
                            src={course.mediaUrl} 
                            alt="Course thumbnail" 
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto', 
                              borderRadius: '8px',
                              marginBottom: '1rem'
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="course-actions">
                      <button 
                        className="button primary-button"
                        onClick={() => navigate(`/course/${course.courseId}`)}
                        style={{ 
                          padding: '8px 16px', 
                          fontSize: '1rem',
                          borderRadius: '4px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                      >
                        View Course Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;