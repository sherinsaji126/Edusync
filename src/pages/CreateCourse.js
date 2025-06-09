import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { authService } from '../services/authService';
import '../styles/CourseForm.css';
import { FaUpload, FaTimes, FaFileAlt, FaCloudUploadAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf'
];

const CreateCourse = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    
    // Get current user on component mount
    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        
        // Check if user is an instructor
        const userRole = localStorage.getItem('userRole');
        if (!userRole || !userRole.match(/instructor/i)) {
            toast.error('Only instructors can create courses');
            navigate('/');
        }
    }, [navigate]);

    // Format file size to human readable format
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Validate file
    const validateFile = (file) => {
        if (!file) return 'Please select a file';
        
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return 'Invalid file type. Please upload an image, video, or PDF file.';
        }
        
        if (file.size > MAX_FILE_SIZE) {
            return `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
        }
        
        return null;
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const validationError = validateFile(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }
        
        setMediaFile(file);
        setError('');
    };

    // Handle drag and drop
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const validationError = validateFile(file);
            
            if (validationError) {
                toast.error(validationError);
                return;
            }
            
            setMediaFile(file);
            setError('');
        }
    }, []);

    // Remove selected file
    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setMediaFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Trigger file input click
    const handleUploadClick = (e) => {
        e.preventDefault();
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        if (!mediaFile) {
            setError('Please select a media file');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('mediaFile', mediaFile);
            
            // Show loading toast
            const toastId = toast.loading('Uploading course...');
            
            await courseService.createCourse(formData);
            
            // Reset form fields
            setTitle('');
            setDescription('');
            setMediaFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Update toast to success
            toast.update(toastId, {
                render: 'Course created successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 3000
            });
            
        } catch (err) {
            console.error('Error creating course:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create course. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <h1>Create New Course</h1>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Course Title *</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter course title"
                            disabled={isSubmitting}
                            required
                            maxLength={100}
                        />
                        <small className="help-text">Maximum 100 characters</small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="description">Course Description *</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter course description"
                            rows="5"
                            disabled={isSubmitting}
                            required
                            maxLength={1000}
                        ></textarea>
                        <small className="help-text">Maximum 1000 characters</small>
                    </div>
                    
                    <div className="form-group">
                        <label>Course Media *</label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                id="mediaFile"
                                onChange={handleFileChange}
                                accept={ALLOWED_FILE_TYPES.join(',')}
                                style={{ display: 'none' }}
                                disabled={isSubmitting}
                                ref={fileInputRef}
                            />
                            
                            {!mediaFile ? (
                                <div 
                                    className={`file-drop-zone ${isDragging ? 'active' : ''}`}
                                    onClick={handleUploadClick}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <FaCloudUploadAlt className="icon" />
                                    <p>Drag & drop your file here or click to browse</p>
                                    <p className="file-hint">Supports: JPG, PNG, GIF, MP4, WebM, PDF (Max 10MB)</p>
                                </div>
                            ) : (
                                <div className="file-info">
                                    <FaFileAlt className="icon" />
                                    <div className="file-details">
                                        <div className="file-name">{mediaFile.name}</div>
                                        <div className="file-size">{formatFileSize(mediaFile.size)}</div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="button secondary" 
                                        onClick={handleRemoveFile}
                                        disabled={isSubmitting}
                                        aria-label="Remove file"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="button primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating...
                                </>
                            ) : (
                                'Create Course'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCourse; 