document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
        window.location.href = 'index.html'; // Redirect if not logged in
        return;
    }

    const coursesListContainer = document.getElementById('completed-courses-list');
    const noCoursesMessage = document.getElementById('no-courses-message');
    const loadingMessage = document.getElementById('loading-message');

    try {
        const response = await fetch('api/get_completed_courses.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail })
        });

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            loadingMessage.style.display = 'none';
            coursesListContainer.innerHTML = '';

            result.data.forEach(course => {
                const courseItem = document.createElement('div');
                courseItem.className = 'course-item';
                courseItem.classList.add('completed'); // Optional CSS class for styling
                courseItem.style.borderLeft = '4px solid #4CAF50'; // Green border for completion

                courseItem.innerHTML = `
                    <div class="course-item-info">
                        <h4>${course.course_name} <i class="fas fa-check-circle" style="color: #4CAF50; margin-left: 0.5rem;"></i></h4>
                        <p>High Score: <strong>${course.score}%</strong></p>
                    </div>
                `;
                coursesListContainer.appendChild(courseItem);
            });
        } else {
            loadingMessage.style.display = 'none';
            noCoursesMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching completed courses:', error);
        loadingMessage.textContent = 'Error loading courses. Please try again.';
    }
});
