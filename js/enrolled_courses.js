document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
        window.location.href = 'index.html'; // Redirect if not logged in
        return;
    }

    const coursesListContainer = document.getElementById('enrolled-courses-list');
    const noCoursesMessage = document.getElementById('no-courses-message');
    const loadingMessage = document.getElementById('loading-message');

    try {
        const response = await fetch('api/get_user_courses.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail })
        });

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            loadingMessage.style.display = 'none';

            // Clear container but keep loading message hidden
            coursesListContainer.innerHTML = '';

            result.data.forEach(course => {
                const courseItem = document.createElement('div');
                courseItem.className = 'course-item';
                courseItem.style.cursor = 'default'; // Override pointer cursor

                courseItem.innerHTML = `
                    <div class="course-item-info">
                        <h4>${course.course_name}</h4>
                        <p>Enrolled on: ${new Date(course.created_at).toLocaleDateString()}</p>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="takeQuiz('${course.course_name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-pencil-alt"></i> Take Quiz
                    </button>
                `;
                coursesListContainer.appendChild(courseItem);
            });
        } else {
            loadingMessage.style.display = 'none';
            noCoursesMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        loadingMessage.textContent = 'Error loading courses. Please try again.';
    }
});

async function takeQuiz(courseName) {
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
        try {
            await fetch('api/update_course_access.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, course_name: courseName })
            });
        } catch (e) {
            console.error('Failed to update course access', e);
        }
    }
    window.location.href = `quiz.html?course=${encodeURIComponent(courseName)}`;
}
