import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuizCard = ({ quiz }) => {
    const navigate = useNavigate();

    const handleAttemptQuiz = () => {
        navigate(`/attempt-quiz/${quiz.id}`);
    };

    // Inline styles for debugging
    const styles = {
        card: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            margin: '10px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '300px'
        },
        title: {
            fontSize: '1.2rem',
            margin: '0 0 10px 0',
            color: '#333'
        },
        score: {
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'inline-block',
            marginBottom: '15px',
            fontSize: '0.9rem'
        },
        button: {
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '1rem'
        }
    };

    return (
        <div style={styles.card}>
            <h3 style={styles.title}>{quiz.title}</h3>
            <div style={styles.score}>Max Score: {quiz.maxScore}</div>
            <button 
                style={styles.button}
                onClick={handleAttemptQuiz}
            >
                Attempt Quiz
            </button>
        </div>
    );
};

export default QuizCard;
