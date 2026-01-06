document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('user_name');
    const welcomeElement = document.getElementById('user-name');
    if (userName && welcomeElement) {
        welcomeElement.textContent = userName;
    }

    updateDashboardStats();
    loadProgressChart();
    loadWeakTopics();
});

async function updateDashboardStats() {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) return;

    try {
        const response = await fetch('api/get_dashboard_stats.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail })
        });

        const result = await response.json();
        console.log('Dashboard Stats Result:', result); // Formatting Fix

        if (result.success) {
            updateStat('enrolled-count', result.stats.enrolled);
            updateStat('completed-count', result.stats.completed);
            updateStat('quizzes-attempted', result.stats.quizzes);
            updateStat('learning-streak', result.stats.streak);
        } else {
            console.error('Failed to load stats:', result.message);
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

function updateStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Animate the number change
        animateValue(element, parseInt(element.textContent) || 0, value, 1000);
    }
}

function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

async function loadProgressChart() {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) return;

    const canvas = document.getElementById('activityChart');
    const noData = document.getElementById('no-progress-data');
    if (!canvas) return;

    try {
        const response = await fetch('api/get_progress_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (typeof Chart === 'undefined') {
            return;
        }

        if (result.success && result.data && result.data.length > 0) {
            canvas.style.display = 'block';
            noData.style.display = 'none';

            const labels = result.data.map(item => item.date + ' (' + item.course + ')');
            const scores = result.data.map(item => item.score);

            // Destroy existing chart if it exists to prevent overlap
            const existingChart = Chart.getChart("activityChart");
            if (existingChart) {
                existingChart.destroy();
            }

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quiz Score (%)',
                        data: scores,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#6366f1',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: (items) => {
                                    return result.data[items[0].dataIndex].course;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            canvas.style.display = 'none';
            noData.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading progress chart:', error);
        canvas.style.display = 'none';
        noData.style.display = 'block';
    }
}

async function loadWeakTopics() {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) return;

    const container = document.getElementById('weak-topics-container');
    if (!container) return;

    try {
        const response = await fetch('api/get_weak_topics.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        const result = await response.json();

        if (result.success && result.topics && result.topics.length > 0) {
            displayWeakTopics(result.topics);
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem; color: #10b981;"></i>
                    <p>Great job! No topics to improve identified. Keep up the excellent work!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading weak topics:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc2626;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>Error loading topics. Please try again later.</p>
            </div>
        `;
    }
}

function displayWeakTopics(topics) {
    const container = document.getElementById('weak-topics-container');

    const completedCount = topics.filter(t => t.is_completed).length;
    const totalCount = topics.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    let html = `
        <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span><strong>Progress:</strong> ${completedCount}/${totalCount} topics completed</span>
                <span style="color: #6366f1; font-weight: bold;">${progressPercentage}%</span>
            </div>
            <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: ${progressPercentage}%; transition: width 0.3s ease;"></div>
            </div>
        </div>
        <div class="weak-topics-checklist">
    `;

    topics.forEach(topic => {
        html += `
            <div class="weak-topic-item" style="display: flex; align-items: center; padding: 1rem; margin-bottom: 0.5rem; background: ${topic.is_completed ? '#d1fae5' : '#fef3c7'}; border-radius: 8px; border-left: 4px solid ${topic.is_completed ? '#10b981' : '#f59e0b'};">
                <input 
                    type="checkbox" 
                    ${topic.is_completed ? 'checked' : ''} 
                    onchange="updateTopicProgress('${topic.topic_name.replace(/'/g, "\\'")}', '${topic.course.replace(/'/g, "\\'")}', this.checked)"
                    style="margin-right: 1rem; width: 20px; height: 20px; cursor: pointer;"
                >
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 0.25rem;">${topic.topic_name}</div>
                    <div style="font-size: 0.875rem; color: #666;">
                        Course: ${topic.course} | Score: ${topic.quiz_score}%
                        ${topic.is_completed && topic.completed_at ? ` | Completed: ${new Date(topic.completed_at).toLocaleDateString()}` : ''}
                    </div>
                </div>
                ${topic.is_completed ? '<i class="fas fa-check-circle" style="color: #10b981; font-size: 1.25rem;"></i>' : ''}
            </div>
        `;
    });

    html += `
        </div>
        <div style="margin-top: 1rem; text-align: center;">
            <a href="index.html#recommendations" class="btn btn-primary" style="text-decoration: none;">
                <i class="fas fa-lightbulb"></i> Get AI Recommendations
            </a>
        </div>
    `;

    container.innerHTML = html;
}

async function updateTopicProgress(topicName, course, isCompleted) {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) return;

    try {
        const response = await fetch('api/update_topic_progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                topic_name: topicName,
                course: course,
                is_completed: isCompleted
            })
        });

        const result = await response.json();

        if (result.success) {
            // Reload weak topics to update UI
            loadWeakTopics();
            // Reload progress chart to reflect changes
            loadProgressChart();
        } else {
            alert('Error updating progress: ' + result.message);
            // Reload to revert checkbox
            loadWeakTopics();
        }
    } catch (error) {
        console.error('Error updating topic progress:', error);
        alert('Error updating progress. Please try again.');
        loadWeakTopics();
    }
}

// Make function globally available
window.updateTopicProgress = updateTopicProgress;
