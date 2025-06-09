import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  // Debug log the course data
  React.useEffect(() => {
    if (course) {
      console.log('Course data in CourseCard:', {
        ...course,
        hasInstructorName: 'instructorName' in course,
        instructorName: course.instructorName,
        allKeys: Object.keys(course)
      });
    } else {
      console.log('No course data provided to CourseCard');
    }
  }, [course]);
  
  // Safely get instructor name with fallbacks
  const getInstructorName = () => {
    if (!course) return 'Instructor';
    
    // Try different possible property names
    const possibleNames = [
      course.instructorName,
      course.InstructorName,
      course.instructor?.name,
      course.instructor?.Name,
      'Instructor' // Default fallback
    ];
    
    return possibleNames.find(name => name && name !== 'Instructor') || 'Instructor';
  };

  if (!course) {
    return <div className="course-card">No course data</div>;
  }

  // Safely extract values with fallbacks
  const courseId = course.CourseId || course.courseId || course.id || '';
  const title = course.Title || course.title || 'Untitled Course';
  const description = course.Description || course.description || 'No description available';
  const instructorName = getInstructorName();

  if (!courseId) {
    console.error('Cannot render CourseCard: No course ID found', { course });
    return <div className="course-card">Invalid course data</div>;
  }

  return (
    <Link to={`/course/${courseId}`} className="course-card" style={{ textDecoration: 'none' }}>
      <div className="course-icon">
        <i className="fas fa-book"></i>
      </div>
      <div className="course-content">
        <h3 className="course-title">{title}</h3>
        <p className="course-description">
          {description.length > 100 
            ? `${description.substring(0, 100)}...` 
            : description}
        </p>
        <div className="course-meta">
          {instructorName && (
            <span className="instructor">
              <i className="fas fa-user"></i> {instructorName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const CourseCardContainer = ({ children, ...props }) => (
  <Link {...props} className="course-card" style={{ textDecoration: 'none' }}>
    {children}
  </Link>
);

const CourseImage = ({ children }) => (
  <div className="course-image">
    {children}
  </div>
);

const ThumbnailContainer = ({ children }) => (
  <div className="thumbnail-container">
    {children}
  </div>
);

const CourseImageContent = ({ src, alt, ...props }) => (
  <img src={src} alt={alt} className="course-image-content" {...props} />
);

const PlayButton = ({ children }) => (
  <div className="play-button">
    {children}
  </div>
);

const CoursePlaceholder = ({ children }) => (
  <div className="course-image-placeholder">
    {children}
  </div>
);

const CourseContent = ({ children }) => (
  <div className="course-content">
    {children}
  </div>
);

const CourseTitle = ({ children }) => (
  <h3 className="course-title">
    {children}
  </h3>
);

const CourseDescription = ({ children }) => (
  <p className="course-description">
    {children}
  </p>
);

const CourseMeta = ({ children }) => (
  <div className="course-meta">
    {children}
  </div>
);

export default CourseCard;
