// InstructorDashboard.js - Main dashboard for instructors
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import axios from '../services/api';
import CourseCard from '../components/CourseCard';
import '../styles/Dashboard.css';

function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch instructor's courses using axios directly
      console.log('Fetching courses...');
      const response = await axios.get('/course/GetInstructorCourses');
      const coursesData = response.data;
      console.log('Courses data received:', coursesData);
      
      // Transform course data to match UI requirements
      const courses = coursesData.map(course => ({
        // Map all possible property names to ensure we get the data
        ...course,
        // Ensure we have all required fields with fallbacks
        id: course.CourseId || course.id || '',
        courseId: course.CourseId || course.id || '',
        title: course.Title || course.title || 'Untitled Course',
        description: course.Description || course.description || 'No description available',
        mediaUrl: course.MediaUrl || course.mediaUrl || null,
        instructorName: course.InstructorName || course.instructorName || user?.name || 'Instructor'
      }));
      
      console.log('Transformed courses:', courses);

      // TODO: Add API calls for assessments and stats
      // For now, we'll keep the placeholder data for assessments and stats
      setCourses(courses);
      setAssessments([
        {
          id: 1,
          title: 'Programming Fundamentals Quiz',
          courseTitle: 'Introduction to Programming',
          submissions: 0,
          averageScore: 0
        }
      ]);

      setStats({
        totalStudents: 0,
        totalCourses: courses.length,
        totalAssessments: 0,
        averageScore: 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'Instructor'}</h1>
        <p>Manage your courses and assessments</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Active Courses</h3>
          <p>{stats.totalCourses}</p>
        </div>
        <div className="stat-card">
          <h3>Assessments</h3>
          <p>{stats.totalAssessments}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p>{stats.averageScore}%</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Courses</h2>
            <Link to="/create-course" className="button">
              Create New Course
            </Link>
          </div>
          <div className="courses-grid">
            {courses.map(course => (
              <CourseCard 
                key={course.id}
                course={{
                  ...course,
                  courseId: course.id, // Ensure courseId is set for navigation
                  instructorName: user?.name || 'Instructor' // Add instructor name
                }}
              />
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Assessments</h2>
            <Link to="/create-assessment" className="button">
              Create New Assessment
            </Link>
          </div>
          <div className="assessments-list">
            {assessments.map(assessment => (
              <div key={assessment.id} className="assessment-card">
                <h3>{assessment.title}</h3>
                <p>Course: {assessment.courseTitle}</p>
                <p>Submissions: {assessment.submissions}</p>
                <p>Average Score: {assessment.averageScore}%</p>
                <div className="card-actions">
                  <Link to={`/assessment/${assessment.id}/edit`} className="button">
                    Edit
                  </Link>
                  <Link to={`/assessment/${assessment.id}/results`} className="button">
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;