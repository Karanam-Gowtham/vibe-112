-- ================================
-- USERS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    streak INT DEFAULT 0,
    last_active_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ================================
-- COURSES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    last_accessed TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_email
        FOREIGN KEY (email)
        REFERENCES users(email)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ================================
-- QUIZ RESULTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    score INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    course VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_email
        FOREIGN KEY (email)
        REFERENCES users(email)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_quiz_course
        FOREIGN KEY (course)
        REFERENCES courses(course_name)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;
