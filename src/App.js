import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import CourseDetail from './components/CourseDetail';
import QuizAttempt from './components/QuizAttempt';
import ResultView from './components/ResultView';
import './App.css';

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return element;
};

const RoleBasedRoute = ({ element, requiredRole }) => {
  const userRole = localStorage.getItem('userRole');

  if (userRole !== requiredRole) {
    return <Navigate to={userRole === 'Student' ? '/student' : '/instructor'} />;
  }

  return element;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/student" 
          element={
            <PrivateRoute 
              element={
                <RoleBasedRoute 
                  element={<StudentDashboard />} 
                  requiredRole="Student" 
                />
              } 
            />
          } 
        />
        <Route 
          path="/instructor" 
          element={
            <PrivateRoute 
              element={
                <RoleBasedRoute 
                  element={<InstructorDashboard />} 
                  requiredRole="Instructor" 
                />
              } 
            />
          } 
        />
        <Route 
          path="/course/:courseId" 
          element={
            <PrivateRoute 
              element={<CourseDetail />}
            />
          } 
        />
        <Route 
          path="/quiz-attempt/:assessmentId" 
          element={
            <PrivateRoute 
              element={<QuizAttempt />}
            />
          } 
        />
        <Route 
          path="/quiz/results/:attemptId" 
          element={
            <PrivateRoute 
              element={<ResultView />}
            />
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
