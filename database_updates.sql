-- Add weak topics tracking table
CREATE TABLE IF NOT EXISTS weak_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    course VARCHAR(150) NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    quiz_score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_weak_topics_email
        FOREIGN KEY (email)
        REFERENCES users(email)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_weak_topics_course
        FOREIGN KEY (course)
        REFERENCES courses(course_name)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    UNIQUE KEY unique_user_topic (email, course, topic_name)
) ENGINE=InnoDB;

-- Add topic progress tracking table
CREATE TABLE IF NOT EXISTS topic_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    course VARCHAR(150) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_topic_progress_email
        FOREIGN KEY (email)
        REFERENCES users(email)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_topic_progress_course
        FOREIGN KEY (course)
        REFERENCES courses(course_name)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    UNIQUE KEY unique_user_topic_progress (email, course, topic_name)
) ENGINE=InnoDB;
