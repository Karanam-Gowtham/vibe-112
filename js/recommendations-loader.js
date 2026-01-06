// Load recommendations when recommendations section is active
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're coming from a quiz with low score
    const quizResult = sessionStorage.getItem('quiz_result');
    const recommendationsContainer = document.getElementById('recommendations-container');

    if (!recommendationsContainer) return;

    // Check if recommendations section is active or if we have quiz result
    const checkAndLoad = () => {
        const recommendationsSection = document.getElementById('recommendations');
        if (recommendationsSection && (recommendationsSection.classList.contains('active') || quizResult)) {
            loadRecommendations();
        }
    };

    // Load immediately if quiz result exists
    if (quizResult) {
        loadRecommendations();
    } else {
        // Otherwise check on section switch
        const observer = new MutationObserver(checkAndLoad);
        const recommendationsSection = document.getElementById('recommendations');
        if (recommendationsSection) {
            observer.observe(recommendationsSection, { attributes: true, attributeFilter: ['class'] });
        }
        checkAndLoad();
    }
});

async function loadRecommendations() {
    const recommendationsContainer = document.getElementById('recommendations-container');
    if (!recommendationsContainer) return;

    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
        recommendationsContainer.innerHTML = `
            <div class="recommendations-message">
                <p>Please <a href="#" onclick="openModal('login-modal'); return false;">sign in</a> to get personalized recommendations.</p>
            </div>
        `;
        return;
    }

    // Show loading
    recommendationsContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Finding the best learning resources for your topics to improve...</p>
        </div>
    `;

    try {
        const response = await fetch('api/get_weak_topics_recommendations.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        const result = await response.json();

        if (result.success) {
            displayLearningResources(result);
        } else {
            recommendationsContainer.innerHTML = `
                <div class="recommendations-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${result.error || result.message || 'Failed to load recommendations'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        recommendationsContainer.innerHTML = `
            <div class="recommendations-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading recommendations. Please try again later.</p>
            </div>
        `;
    }
}

function displayLearningResources(result) {
    const recommendationsContainer = document.getElementById('recommendations-container');
    const weakTopics = result.weak_topics || [];
    const strongAreas = result.strong_areas || [];
    const resources = result.resources || [];
    const studyPlan = result.study_plan;
    const feedback = result.feedback;
    const strongAreasAnalysis = result.strong_areas_analysis;
    const weakAreasAnalysis = result.weak_areas_analysis;

    // Check if we have quiz result data
    const quizResult = sessionStorage.getItem('quiz_result');
    let quizData = null;
    if (quizResult) {
        quizData = JSON.parse(quizResult);
        sessionStorage.removeItem('quiz_result');
    }

    let html = '';

    // Quiz feedback banner if coming from quiz
    if (quizData) {
        html += `
            <div class="quiz-feedback-banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
                <h2 style="margin-top: 0;">
                    <i class="fas fa-chart-line"></i> Quiz Results: ${quizData.course}
                </h2>
                <div style="display: flex; gap: 2rem; flex-wrap: wrap; margin-top: 1rem;">
                    <div><strong>Score:</strong> ${quizData.score}%</div>
                    <div><strong>Correct:</strong> ${quizData.correctCount}/${quizData.totalQuestions}</div>
                    <div><strong>Weak Topics Identified:</strong> ${quizData.weakTopics.length}</div>
                </div>
            </div>
        `;
    }

    // AI Feedback Section
    if (feedback) {
        html += `
            <div class="recommendations-section" style="margin-bottom: 2rem;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 10px;">
                    <h2 style="margin-top: 0;"><i class="fas fa-star"></i> Your Learning Assessment</h2>
                    <p style="font-size: 1.1rem; margin: 0; line-height: 1.6;">${feedback}</p>
                </div>
            </div>
        `;
    }

    // Strong Areas Section
    if (strongAreas.length > 0 && strongAreasAnalysis) {
        html += `
            <div class="recommendations-section" style="margin-bottom: 2rem;">
                <h2><i class="fas fa-trophy" style="color: #10b981;"></i> Your Strong Areas</h2>
                <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 2rem; border-radius: 10px; border-left: 5px solid #10b981;">
                    <p style="font-size: 1.05rem; margin-bottom: 1.5rem; color: #065f46;"><strong>${strongAreasAnalysis}</strong></p>
                    <div style="background: white; padding: 1.5rem; border-radius: 8px;">
                        <h3 style="margin-top: 0; color: #059669;">Courses You've Mastered:</h3>
                        <ul style="margin: 0; padding-left: 1.5rem; color: #047857;">
                            ${strongAreas.map(area => `
                                <li style="margin-bottom: 0.75rem;">
                                    <strong>${area.course}</strong> - Average Score: <span style="color: #10b981; font-weight: bold;">${Math.round(area.avg_score)}%</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    // Weak Areas Analysis
    if (weakTopics.length > 0 && weakAreasAnalysis) {
        html += `
            <div class="recommendations-section" style="margin-bottom: 2rem;">
                <h2><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Areas for Improvement</h2>
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 10px; border-left: 5px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 1.05rem;">${weakAreasAnalysis}</p>
                </div>
            </div>
        `;
    }

    // Display learning resources for each weak topic
    if (resources && resources.length > 0) {
        html += `
            <div class="recommendations-section">
                <h2><i class="fas fa-book-open"></i> AI Personalized Learning Guide</h2>
                <div class="recommendations-grid">
        `;

        resources.forEach(resource => {
            html += `
                <div class="recommendation-card" style="border-left: 4px solid #6366f1; padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
                    <h3 style="color: #6366f1; margin-top: 0;"><i class="fas fa-graduation-cap"></i> ${resource.topic}</h3>
                    
                    ${resource.content_description ? `
                        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f5f7ff; border-radius: 8px; border-left: 3px solid #6366f1;">
                            <h4 style="margin-top: 0; color: #4338ca; font-size: 1rem;"><i class="fas fa-info-circle"></i> What to Learn:</h4>
                            <p style="margin: 0; color: #3730a3; line-height: 1.5;">${resource.content_description}</p>
                        </div>
                    ` : ''}
            `;

            // Practice Tips
            if (resource.practice_tips) {
                html += `
                    <div style="background: #eff6ff; padding: 1rem; border-radius: 5px; border-left: 3px solid #3b82f6;">
                        <h4 style="margin-top: 0; color: #3b82f6;">
                            <i class="fas fa-lightbulb"></i> Practice Tips
                        </h4>
                        <p style="margin: 0; color: #1e40af;">${resource.practice_tips}</p>
                    </div>
                `;
            }

            html += `</div>`;
        });

        html += `</div></div>`;
    }

    // Study Plan
    if (studyPlan) {
        html += `
            <div class="recommendations-section">
                <h2><i class="fas fa-calendar-alt"></i> Your Personalized Study Plan</h2>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 10px;">
                    <p style="margin: 0; font-size: 1.1rem; line-height: 1.6; white-space: pre-line;">${studyPlan}</p>
                </div>
            </div>
                `;
    }

    // Fallback if no data
    if (weakTopics.length === 0 && strongAreas.length === 0) {
        html = `
            <div class="recommendations-message" style="text-align: center; padding: 3rem;">
                <i class="fas fa-graduation-cap" style="font-size: 3rem; color: #6366f1; margin-bottom: 1rem;"></i>
                <h3>Ready to Start Your Learning Journey?</h3>
                <p>Take quizzes to get personalized recommendations based on your performance!</p>
                <a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>
            </div>
                `;
    }

    recommendationsContainer.innerHTML = html;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadRecommendations };
}
