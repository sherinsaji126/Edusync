import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ResultView = () => {
    const { attemptId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [quiz, setQuiz] = useState(null);

    useEffect(() => {
        fetchResult();
    }, [attemptId]);

    const fetchResult = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to view results');
                return;
            }

            // In a real app, you would fetch the result from your API
            // For now, we'll use the location state if available
            if (location.state?.result) {
                setResult(location.state.result);
                setQuiz(location.state.quiz);
            } else {
                // Fallback to mock data if no state is passed
                setResult({
                    score: 8,
                    totalQuestions: 10,
                    correctAnswers: 8,
                    wrongAnswers: 2,
                    percentage: 80,
                    timeTaken: '15:30',
                    date: new Date().toLocaleDateString(),
                    answers: [
                        { question: 'What is 2+2?', correctAnswer: '4', userAnswer: '4', isCorrect: true },
                        { question: 'Capital of France?', correctAnswer: 'Paris', userAnswer: 'Paris', isCorrect: true },
                        { question: 'Largest planet?', correctAnswer: 'Jupiter', userAnswer: 'Mars', isCorrect: false },
                    ]
                });
                setQuiz({
                    title: 'Sample Quiz',
                    description: 'This is a sample quiz for demonstration',
                    maxScore: 10
                });
            }
        } catch (err) {
            console.error('Error fetching result:', err);
            setError('Failed to load results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 80) return '#4caf50'; // Green
        if (percentage >= 50) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading results...</p>
            </div>
        );
    }


    if (error) {
        return (
            <div style={styles.errorContainer}>
                <p style={styles.errorText}>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    style={styles.retryButton}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Quiz Results</h1>
                <p style={styles.subtitle}>{quiz?.title || 'Quiz'}</p>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statItem}>
                    <span style={styles.statValue}>{result?.score || 0}/{result?.totalQuestions || 0}</span>
                    <span style={styles.statLabel}>Score</span>
                </div>
                <div style={styles.statItem}>
                    <span style={styles.statValue}>{result?.correctAnswers || 0}</span>
                    <span style={styles.statLabel}>Correct</span>
                </div>
                <div style={styles.statItem}>
                    <span style={styles.statValue}>{result?.wrongAnswers || 0}</span>
                    <span style={styles.statLabel}>Incorrect</span>
                </div>
            </div>

            <div style={styles.answersContainer}>
                <h3 style={styles.answersTitle}>Question Review</h3>
                {result?.answers?.map((answer, index) => (
                    <div key={index} style={styles.answerCard(answer.isCorrect)}>
                        <div style={styles.questionHeader}>
                            <span style={styles.questionNumber}>Q{index + 1}.</span>
                            <span style={styles.questionText}>{answer.question}</span>
                            <span style={styles.answerStatus(answer.isCorrect)}>
                                {answer.isCorrect ? '✓' : '✗'}
                            </span>
                        </div>
                        <div style={styles.answerDetails}>
                            <div style={styles.answerRow}>
                                <span style={styles.answerLabel}>Your Answer:</span>
                                <span style={styles.answerText}>{answer.userAnswer}</span>
                            </div>
                            {!answer.isCorrect && (
                                <div style={styles.answerRow}>
                                    <span style={styles.answerLabel}>Correct Answer:</span>
                                    <span style={styles.correctAnswer}>{answer.correctAnswer}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.buttonContainer}>
                <button 
                    onClick={() => navigate('/student', { state: { activeTab: 'results' } })} 
                    style={styles.dashboardButton}
                >
                    Back to Results
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px',
    },
    title: {
        fontSize: '2rem',
        color: '#333',
        marginBottom: '10px',
    },
    subtitle: {
        fontSize: '1.2rem',
        color: '#666',
    },
    scoreContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '30px 0',
    },
    scoreCircle: {
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginBottom: '20px',
    },
    scoreProgress: (percentage, color = '#e0e0e0') => ({
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `conic-gradient(${color} 0% ${percentage}%, transparent ${percentage}% 100%)`,
        transform: 'rotate(-90deg)',
    }),
    scoreText: {
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
    },
    scoreNumber: {
        fontSize: '3rem',
        fontWeight: 'bold',
        color: '#333',
    },
    scoreTotal: {
        fontSize: '1.5rem',
        color: '#666',
    },
    percentage: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#333',
        marginTop: '10px',
    },
    statsContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        margin: '30px 0',
        flexWrap: 'wrap',
    },
    statItem: {
        textAlign: 'center',
        padding: '15px',
        minWidth: '120px',
    },
    statValue: {
        display: 'block',
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: '5px',
    },
    statLabel: {
        fontSize: '1rem',
        color: '#666',
    },
    answersContainer: {
        margin: '30px 0',
    },
    answersTitle: {
        fontSize: '1.5rem',
        color: '#333',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee',
    },
    answerCard: (isCorrect) => ({
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#f44336'}`,
    }),
    questionHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
    },
    questionNumber: {
        fontWeight: 'bold',
        marginRight: '10px',
        color: '#333',
    },
    questionText: {
        flex: 1,
        fontSize: '1rem',
        color: '#333',
    },
    answerStatus: (isCorrect) => ({
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: isCorrect ? '#e8f5e9' : '#ffebee',
        color: isCorrect ? '#4caf50' : '#f44336',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        marginLeft: '10px',
    }),
    answerDetails: {
        padding: '10px 0 0 10px',
    },
    answerRow: {
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
    },
    answerLabel: {
        fontWeight: 'bold',
        marginRight: '10px',
        color: '#666',
        minWidth: '120px',
    },
    answerText: {
        color: '#333',
    },
    correctAnswer: {
        color: '#4caf50',
        fontWeight: 'bold',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '30px',
        flexWrap: 'wrap',
    },
    dashboardButton: {
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'background-color 0.3s',
    },
    retakeButton: {
        backgroundColor: '#f57c00',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'background-color 0.3s',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
    },
    errorContainer: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    errorText: {
        color: '#f44336',
        marginBottom: '20px',
        fontSize: '1.1rem',
    },
    retryButton: {
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
};

export default ResultView;