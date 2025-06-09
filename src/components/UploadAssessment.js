import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/CourseForm.css';

// API endpoints
const API_ENDPOINTS = {
    GET_COURSES: '/Course/GetInstructorCourses',
    CREATE_ASSESSMENT: '/Assessment/upload-questions'
};

const UploadAssessment = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [assessmentData, setAssessmentData] = useState({
        courseId: '',
        title: '',
        maxScore: '',
        questionsFile: null
    });

    // Load courses on mount
    useEffect(() => {
        const userRole = localStorage.getItem('userRole')?.toLowerCase();
        if (!userRole || userRole !== 'instructor') {
            setError('Access denied. This page is for instructors only.');
            setLoading(false);
            // Optionally redirect to a different page
            // navigate('/unauthorized');
        } else {
            fetchInstructorCourses();
        }
    }, []);

    const fetchInstructorCourses = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.GET_COURSES);
            console.log('Fetched courses:', response.data);
            
            // Handle the response structure: { success: true, data: [...], message: null }
            const coursesData = response.data?.data || [];
            console.log('Processed courses data:', coursesData);
            
            // Ensure we have an array of courses
            if (Array.isArray(coursesData)) {
                // Map the courses to ensure we have the correct property names
                const formattedCourses = coursesData.map(course => ({
                    CourseId: course.courseId || course.CourseId,
                    Title: course.title || course.Title,
                    Description: course.description || course.Description,
                    InstructorId: course.instructorId || course.InstructorId,
                    MediaUrl: course.mediaUrl || course.MediaUrl
                }));
                
                console.log('Formatted courses:', formattedCourses);
                setCourses(formattedCourses);
            } else {
                console.warn('Unexpected courses data format:', coursesData);
                setCourses([]);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            if (error.response?.status === 403) {
                setError('You do not have permission to access this resource.');
            } else {
                setError('Failed to load courses. Please try again later.');
            }
            setCourses([]); // Ensure courses is always an array
        } finally {
            setLoading(false);
        }
    };

    // Add a useEffect to log courses state changes
    useEffect(() => {
        console.log('Current courses state:', courses);
    }, [courses]);

    // Add debug logging for assessmentData changes
    useEffect(() => {
        console.log('Current assessmentData:', assessmentData);
    }, [assessmentData]);

    const resetForm = () => {
        setAssessmentData({
            courseId: '',
            title: '',
            maxScore: '',
            questionsFile: null
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setAssessmentData(prev => ({
                ...prev,
                questionsFile: files[0]
            }));
        } else if (name === 'maxScore') {
            setAssessmentData(prev => ({
                ...prev,
                [name]: parseInt(value) || ''
            }));
        } else if (name === 'courseId') {
            // Find the selected course
            const selectedCourse = courses.find(course => course.CourseId === value);
            console.log('Selected course:', selectedCourse); // Debug log
            
            if (selectedCourse) {
                setAssessmentData(prev => ({
                    ...prev,
                    courseId: selectedCourse.CourseId // Make sure we're using the GUID
                }));
            } else {
                console.error('Selected course not found:', value);
            }
        } else {
            setAssessmentData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const validateAssessmentData = () => {
        if (!assessmentData.courseId) {
            setError('Please select a course');
            return false;
        }

        if (!assessmentData.title || assessmentData.title.trim().length === 0) {
            setError('Please enter an assessment title');
            return false;
        }

        if (!assessmentData.maxScore || isNaN(parseInt(assessmentData.maxScore)) || parseInt(assessmentData.maxScore) <= 0) {
            setError('Please enter a valid maximum score (greater than 0)');
            return false;
        }

        if (!assessmentData.questionsFile) {
            setError('Please upload a JSON file containing the questions');
            return false;
        }

        if (!assessmentData.questionsFile.type.includes('json')) {
            setError('Please upload a valid JSON file');
            return false;
        }

        return true;
    };

    const validateJsonFormat = (questions) => {
        if (!Array.isArray(questions)) {
            throw new Error('The JSON file must contain an array of questions. Please ensure your JSON has a "Questions" array property');
        }

        if (questions.length === 0) {
            throw new Error('The questions array cannot be empty. Please add at least one question.');
        }

        const requiredFields = ['questionId', 'questionText', 'options', 'correctAnswer', 'points'];
        let totalPoints = 0;
        
        questions.forEach((q, index) => {
            // Check for missing fields
            const missingFields = requiredFields.filter(field => !q.hasOwnProperty(field) || q[field] === undefined || q[field] === null);
            if (missingFields.length > 0) {
                throw new Error(`Question ${index + 1} is missing these required fields: ${missingFields.join(', ')}`);
            }

            // Validate options array
            if (!Array.isArray(q.options) || q.options.length !== 4) {
                throw new Error(`Question ${index + 1} must have exactly 4 options in the options array`);
            }

            // Validate correctAnswer is a valid index
            if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
                throw new Error(`Question ${index + 1} must have a valid correctAnswer index (0-3)`);
            }

            // Validate points is a positive number
            if (typeof q.points !== 'number' || q.points <= 0) {
                throw new Error(`Question ${index + 1} must have points greater than 0`);
            }

            totalPoints += q.points;
        });

        // Validate total points matches maxScore
        const maxScore = parseInt(assessmentData.maxScore);
        if (totalPoints !== maxScore) {
            throw new Error(`The sum of question points (${totalPoints}) must match the maximum score (${maxScore})`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!validateAssessmentData()) {
                setLoading(false);
                return;
            }

            // Read the JSON file content
            const fileReader = new FileReader();
            
            try {
                const jsonContent = await new Promise((resolve, reject) => {
                    fileReader.onload = (event) => resolve(event.target.result);
                    fileReader.onerror = (error) => reject(error);
                    fileReader.readAsText(assessmentData.questionsFile);
                });

                // Parse and validate JSON format
                const parsedJson = JSON.parse(jsonContent);
                
                // Check if the JSON is already in the correct format
                const rawQuestions = parsedJson.Questions || parsedJson;
                validateJsonFormat(rawQuestions);

                // Create form data
                const formData = new FormData();
                
                // Create a new file with the raw questions JSON, wrapping the array in a Questions object if needed
                const wrappedQuestions = parsedJson.Questions ? parsedJson : { Questions: rawQuestions };
                const file = new File(
                    [JSON.stringify(wrappedQuestions)],
                    assessmentData.questionsFile.name,
                    { type: 'application/json' }
                );
                
                console.log('Preparing to send assessment data:', {
                    courseId: assessmentData.courseId,
                    title: assessmentData.title,
                    maxScore: parseInt(assessmentData.maxScore),
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    questionCount: rawQuestions.length,
                    wrappedQuestions: wrappedQuestions
                });

                formData.append('file', file);
                formData.append('courseId', assessmentData.courseId);
                formData.append('title', assessmentData.title.trim());
                formData.append('maxScore', parseInt(assessmentData.maxScore));

                // Log the actual FormData contents
                console.log('Form data entries:');
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }

                const response = await api.post(API_ENDPOINTS.CREATE_ASSESSMENT, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                console.log('Server response:', response);

                if (response.data) {
                    setSuccess('Assessment created successfully! You can create another assessment.');
                    resetForm();
                }
            } catch (error) {
                console.error('Error:', error);
                setError(error.message || 'Failed to create assessment');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'Failed to create assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleApiError = (err, defaultMessage) => {
        console.error('API Error:', {
            error: err,
            response: err.response?.data,
            status: err.response?.status
        });

        if (err.code === 'ERR_NETWORK') {
            setError('Network error: Cannot connect to the server. Please check your connection.');
        } else if (err.response) {
            const serverError = err.response.data;
            let errorMessage = defaultMessage;
            
            if (typeof serverError === 'string') {
                errorMessage = serverError;
            } else if (typeof serverError === 'object') {
                errorMessage = serverError.message || 
                             serverError.title || 
                             serverError.error ||
                             JSON.stringify(serverError);
            }
            
            setError(`Server error: ${errorMessage}`);
        } else {
            setError(`${defaultMessage}. Please try again.`);
        }
    };

    return (
        <div className="course-form-container">
            <h2>Upload Assessment</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit} className="course-form">
                <div className="form-group">
                    <label htmlFor="courseId">Select Course:</label>
                            <select
                                id="courseId"
                                name="courseId"
                                value={assessmentData.courseId}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                disabled={loading || courses.length === 0}
                            >
                                <option value="">
                                    {loading ? 'Loading courses...' : 
                                     courses.length === 0 ? 'No courses available' : 'Select a course'}
                                </option>
                                {courses.map(course => {
                                    console.log('Rendering course option:', course);
                                    return (
                                        <option key={course.CourseId} value={course.CourseId}>
                                            {course.Title}
                                        </option>
                                    );
                                })}
                            </select>
                </div>

                <div className="form-group">
                    <label htmlFor="title">Assessment Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={assessmentData.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="maxScore">Maximum Score:</label>
                    <input
                        type="number"
                        id="maxScore"
                        name="maxScore"
                        value={assessmentData.maxScore}
                        onChange={handleInputChange}
                        required
                        min="1"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="questionsFile">Questions (JSON File):</label>
                    <input
                        type="file"
                        id="questionsFile"
                        name="questionsFile"
                        accept=".json"
                        onChange={handleInputChange}
                        required
                    />
                   
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload Assessment'}
                </button>
            </form>
        </div>
    );
};

export default UploadAssessment; 