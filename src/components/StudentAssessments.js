import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Dashboard.css';

// API endpoints
const API_ENDPOINTS = {
    GET_ASSESSMENTS: '/Assessment/GetStudentAssessments'
};

const StudentAssessments = () => {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to view assessments');
                return;
            }

            const response = await api.get(API_ENDPOINTS.GET_ASSESSMENTS);

            if (Array.isArray(response.data)) {
                setAssessments(response.data);
            } else {
                setAssessments([]);
            }
        } catch (err) {
            console.error('Error fetching assessments:', err);
            setError('Failed to load assessments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAttemptQuiz = (assessmentId) => {
        navigate(`/student/quiz/${assessmentId}`);
    };

    if (loading) {
        return <div className="loading-spinner">Loading assessments...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="dashboard-section">
            <h2 className="section-title">Available Assessments</h2>
            
            {assessments.length === 0 ? (
                <div className="no-assessments-message">
                    No assessments available at the moment.
                </div>
            ) : (
                <div className="assessments-grid">
                    {assessments.map(assessment => (
                        <div key={assessment.assessmentId} className="assessment-card">
                            <h3>{assessment.title}</h3>
                            <div className="assessment-details">
                                <p><strong>Course:</strong> {assessment.courseName}</p>
                                <p><strong>Maximum Score:</strong> {assessment.maxScore}</p>
                            </div>
                            <button
                                className="button primary"
                                onClick={() => handleAttemptQuiz(assessment.assessmentId)}
                            >
                                Attempt Quiz
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentAssessments; 