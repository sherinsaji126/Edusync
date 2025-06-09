import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateCourse from '../pages/CreateCourse';
import UploadAssessment from './UploadAssessment';
import ViewCourses from './ViewCourses';
import '../styles/Dashboard.css';

const InstructorDashboard = () => {
  const [activeLink, setActiveLink] = useState('courses');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleNavClick = (link) => {
    if (link === 'logout') {
      handleLogout();
    } else {
      setActiveLink(link);
    }
  };

  const renderContent = () => {
    switch (activeLink) {
      case 'courses':
        return <ViewCourses />;
      case 'upload':
        return <CreateCourse />;
      case 'assessments':
        return <UploadAssessment />;
      case 'results':
        return (
          <div className="dashboard-container">
            <h2>Assessment Results</h2>
            {/* Results content will go here */}
          </div>
        );
      default:
        return <ViewCourses />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar Navigation */}
      <nav className="side-navbar">
        <div className="nav-brand">EduSync</div>
        <div className="nav-links">
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'courses' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('courses');
            }}
          >
            View Courses
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'upload' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('upload');
            }}
          >
            Upload Course
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'assessments' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('assessments');
            }}
          >
            Upload Assessment
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeLink === 'results' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('results');
            }}
          >
            View Assessment Results
          </a>
          <a 
            href="#" 
            className="nav-link logout"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            Log Out
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default InstructorDashboard; 