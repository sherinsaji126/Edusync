import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AssessmentResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch assessments when component mounts
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await api.get('/Assessment/ListAllAssessments');
        if (response.data && response.data.Assessments) {
          // Create a map of assessmentId to assessment details
          const assessmentsMap = response.data.Assessments.reduce((acc, assessment) => ({
            ...acc,
            [assessment.AssessmentId]: assessment
          }), {});
          setAssessments(assessmentsMap);
        }
      } catch (err) {
        console.error('Error fetching assessments:', err);
      }
    };

    fetchAssessments();
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the current user's ID from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No user ID found in localStorage');
        setError('User session expired. Please log in again.');
        return;
      }
      
      // Try to fetch from API first
      try {
        console.log(`Fetching results for user: ${userId}`);
        const response = await api.get('/Result/user');
        
        if (response.status === 200 && Array.isArray(response.data)) {
          if (response.data.length > 0) {
            console.log(`Successfully fetched ${response.data.length} results`);
            // Map the API response to match our expected format
            const formattedResults = response.data.map(result => ({
              attemptId: result.ResultId,
              assessmentId: result.AssessmentId,
              assessmentTitle: `Assessment ${result.AssessmentId.substring(0, 8)}`,
              score: result.Score,
              maxScore: 10, // Default max score since it's not provided by the API
              date: result.AttemptDate,
              timeTaken: 'N/A', // Not provided by the API
              isDemo: false
            }));
            
            setAttempts(formattedResults);
            return; // Exit if API call is successful and has data
          } else {
            console.log('No results found for this user');
            setError('No assessment results found. Showing demo data.');
          }
        } else {
          console.warn('Unexpected response format:', response);
          throw new Error('Unexpected response from server');
        }
      } catch (apiError) {
        // For 404 specifically, we'll use mock data without showing an error
        if (apiError.response && apiError.response.status === 404) {
          console.log('Assessment attempts endpoint not found (404). Using demo data.');
          // Don't show an error for 404 since we're handling it gracefully with mock data
        } else {
          console.error('Error fetching attempts:', apiError);
          setError('Could not connect to the server. Some features may be limited.');
        }
      }
      
      // Fallback to mock data if API fails or returns no data
      const mockAttempts = [
        {
          attemptId: `demo-${Date.now()}-1`,
          assessmentId: 'a843e48d-fcf0-49a6-b33e-125ed86933bd',
          assessmentTitle: 'Introduction to Programming',
          score: 8,
          maxScore: 10,
          percentage: 80,
          date: new Date().toISOString(),
          timeTaken: '15:30',
          isDemo: true // Mark as demo data
        },
        {
          attemptId: `demo-${Date.now()}-2`,
          assessmentId: 'a843e48d-fcf0-49a6-b33e-125ed86933bd',
          assessmentTitle: 'Introduction to Programming',
          score: 6,
          maxScore: 10,
          percentage: 60,
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          timeTaken: '12:15',
          isDemo: true // Mark as demo data
        },
        {
          attemptId: `demo-${Date.now()}-3`,
          assessmentId: 'b953e48d-abcd-49a6-b33e-125ed86933bc',
          assessmentTitle: 'Web Development Basics',
          score: 9,
          maxScore: 10,
          percentage: 90,
          date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
          timeTaken: '18:45',
          isDemo: true // Mark as demo data
        }
      ];
      
      setAttempts(mockAttempts);
    } catch (err) {
      console.error('Error fetching attempts:', err);
      setError('Failed to load assessment results. Please try again later.');
      // For demo purposes, we'll use mock data if the API fails
      setAttempts([
        {
          attemptId: 'attempt-123',
          assessmentId: 'a843e48d-fcf0-49a6-b33e-125ed86933bd',
          assessmentTitle: 'Sample Quiz',
          score: 8,
          maxScore: 10,
          percentage: 80,
          date: '2025-06-08T10:30:00Z',
          timeTaken: '15:30'
        },
        {
          attemptId: 'attempt-124',
          assessmentId: 'a843e48d-fcf0-49a6-b33e-125ed86933bd',
          assessmentTitle: 'Sample Quiz',
          score: 6,
          maxScore: 10,
          percentage: 60,
          date: '2025-06-07T14:45:00Z',
          timeTaken: '12:15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (attempt) => {
    try {
      // Get the assessment details
      const assessment = assessments[attempt.assessmentId] || {};
      
      // Fetch the full assessment details to get questions
      const response = await api.get(`/Assessment/${attempt.assessmentId}`);
      const assessmentDetails = response.data || {};
      
      // Parse questions if they exist in the response
      let questions = [];
      try {
        if (assessmentDetails.Questions) {
          const parsedQuestions = JSON.parse(assessmentDetails.Questions);
          questions = parsedQuestions.Questions || [];
        }
      } catch (e) {
        console.error('Error parsing questions:', e);
      }
      
      const totalQuestions = questions.length || assessment.QuestionCount || attempt.maxScore || 10;
      const correctAnswers = attempt.score;
      const wrongAnswers = totalQuestions - correctAnswers;
      
      // Create answers array with actual questions and user responses
      const answers = questions.map((q, index) => ({
        question: q.questionText || `Question ${index + 1}`,
        correctAnswer: q.correctAnswer || 'N/A',
        userAnswer: index < correctAnswers ? 'Correct Answer' : 'Incorrect Answer',
        isCorrect: index < correctAnswers
      }));
      
      // If no questions were found, create placeholders
      if (answers.length === 0) {
        for (let i = 0; i < totalQuestions; i++) {
          answers.push({
            question: `Question ${i + 1}`,
            correctAnswer: 'N/A',
            userAnswer: i < correctAnswers ? 'Correct' : 'Incorrect',
            isCorrect: i < correctAnswers
          });
        }
      }
      
      navigate(`/quiz/results/${attempt.attemptId}`, {
        state: {
          result: {
            score: attempt.score,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            percentage: Math.round((correctAnswers / totalQuestions) * 100),
            timeTaken: attempt.timeTaken || 'N/A',
            date: new Date(attempt.date).toLocaleDateString(),
            answers: answers
          },
          quiz: {
            id: attempt.assessmentId,
            title: assessment.Title || attempt.assessmentTitle || 'Quiz',
            description: assessment.Description || '',
            maxScore: attempt.maxScore || totalQuestions,
            courseId: assessment.CourseId,
            questions: questions // Pass the questions for reference
          },
          assessmentId: attempt.assessmentId
        },
        replace: true
      });
    } catch (error) {
      console.error('Error fetching assessment details:', error);
      // Fallback to basic data if there's an error
      const totalQuestions = 10;
      const correctAnswers = attempt.score;
      const wrongAnswers = totalQuestions - correctAnswers;
      
      const answers = [];
      for (let i = 0; i < totalQuestions; i++) {
        answers.push({
          question: `Question ${i + 1}`,
          correctAnswer: 'N/A',
          userAnswer: i < correctAnswers ? 'Correct' : 'Incorrect',
          isCorrect: i < correctAnswers
        });
      }
      
      navigate(`/quiz/results/${attempt.attemptId}`, {
        state: {
          result: {
            score: attempt.score,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            percentage: Math.round((correctAnswers / totalQuestions) * 100),
            timeTaken: attempt.timeTaken || 'N/A',
            date: new Date(attempt.date).toLocaleDateString(),
            answers: answers
          },
          quiz: {
            id: attempt.assessmentId,
            title: attempt.assessmentTitle || 'Quiz',
            description: '',
            maxScore: attempt.maxScore || totalQuestions,
            courseId: ''
          },
          assessmentId: attempt.assessmentId
        },
        replace: true
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && attempts.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading assessment results...</p>
      </div>
    );
  }

  // Show error message if there's an error but we have no attempts to show
  if (error && attempts.length === 0) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchAttempts} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // Check if we're showing demo data
  const isDemoData = attempts.length > 0 && attempts[0].isDemo;

  return (
    <div className="assessment-results">
      <div className="results-header">
        <h2>Assessment Results</h2>
        {isDemoData && (
          <div className="demo-banner">
            <span className="demo-tag">Demo Data</span>
            <p>This is sample data. Your actual attempts will appear here once available.</p>
          </div>
        )}
        {error && (
          <div className="info-message">
            <p>{error}</p>
            <button onClick={fetchAttempts} className="retry-button small">
              Retry
            </button>
          </div>
        )}
      </div>
      
      {attempts.length === 0 ? (
        <div className="no-results">
          <p>No assessment attempts found.</p>
          <button onClick={fetchAttempts} className="retry-button">
            Refresh
          </button>
        </div>
      ) : (
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Assessment Title</th>
                <th>Course</th>
                <th>Date</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {[...attempts]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((attempt) => (
                <tr 
                  key={attempt.attemptId}
                  onClick={() => handleRowClick(attempt)}
                  className="result-row"
                >
                  <td>{assessments[attempt.assessmentId]?.Title || attempt.assessmentId}</td>
                  <td>{assessments[attempt.assessmentId]?.CourseTitle || 'N/A'}</td>
                  <td>{formatDate(attempt.date)}</td>
                  <td>{attempt.score} / {assessments[attempt.assessmentId]?.MaxScore || attempt.maxScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper function to determine percentage color class
const getPercentageClass = (percentage) => {
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
};

export default AssessmentResults;
