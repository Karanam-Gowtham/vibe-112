document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseName = urlParams.get('course');
    const userEmail = localStorage.getItem('user_email');

    if (!courseName || !userEmail) {
        alert('Invalid access');
        window.location.href = 'dashboard.html';
        return;
    }

    const quizLoading = document.getElementById('quiz-loading');
    const quizArea = document.getElementById('quiz-area');
    const quizTitle = document.getElementById('quiz-title');
    const questionsList = document.getElementById('questions-list');
    const quizForm = document.getElementById('quiz-form');
    const resultArea = document.getElementById('result-area');

    let currentQuestions = [];

    // Fetch Quiz
    try {
        const response = await fetch('api/generate_quiz.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_name: courseName })
        });

        const result = await response.json();

        if (result.success && result.data) {
            currentQuestions = result.data.questions;
            quizTitle.textContent = result.data.quiz_title;
            renderQuestions(currentQuestions);
            quizLoading.style.display = 'none';
            quizArea.style.display = 'block';
        } else {
            throw new Error(result.message || 'Failed to generate quiz');
        }
    } catch (error) {
        console.error('Quiz generation error:', error);
        quizLoading.innerHTML = '<p>Error generating quiz. Please try again later.</p>';
    }

    // Render Questions
    function renderQuestions(questions) {
        questionsList.innerHTML = '';
        questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';

            const questionText = document.createElement('h3');
            questionText.textContent = `${index + 1}. ${q.question}`;
            card.appendChild(questionText);

            if (q.type === 'single' || q.type === 'multiple') {
                q.options.forEach((opt, optIndex) => {
                    const label = document.createElement('label');
                    label.className = 'option-label';

                    const input = document.createElement('input');
                    input.className = 'option-input';

                    if (q.type === 'single') {
                        input.type = 'radio';
                        input.name = `question_${index}`;
                        input.value = optIndex;
                        input.required = true;
                    } else {
                        input.type = 'checkbox';
                        input.name = `question_${index}[]`;
                        input.value = optIndex;
                    }

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(opt));
                    card.appendChild(label);
                });
            }
            questionsList.appendChild(card);
        });
    }

    // Handle Submission
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Calculate Score
        let correctCount = 0;

        currentQuestions.forEach((q, index) => {
            if (q.type === 'single') {
                const selected = document.querySelector(`input[name="question_${index}"]:checked`);
                if (selected && parseInt(selected.value) === q.correct_indices[0]) {
                    correctCount++;
                }
            } else {
                // For multiple choice (check all that apply)
                const selected = Array.from(document.querySelectorAll(`input[name="question_${index}[]"]:checked`))
                    .map(cb => parseInt(cb.value));

                // Sort for comparison
                selected.sort();
                const correct = [...q.correct_indices].sort();

                if (JSON.stringify(selected) === JSON.stringify(correct)) {
                    correctCount++;
                }
            }
        });

        const scorePercentage = Math.round((correctCount / currentQuestions.length) * 100);

        // Identify weak topics (incorrectly answered questions)
        const weakTopics = [];
        currentQuestions.forEach((q, index) => {
            let isCorrect = false;
            if (q.type === 'single') {
                const selected = document.querySelector(`input[name="question_${index}"]:checked`);
                if (selected && parseInt(selected.value) === q.correct_indices[0]) {
                    isCorrect = true;
                }
            } else {
                const selected = Array.from(document.querySelectorAll(`input[name="question_${index}[]"]:checked`))
                    .map(cb => parseInt(cb.value));
                selected.sort();
                const correct = [...q.correct_indices].sort();
                if (JSON.stringify(selected) === JSON.stringify(correct)) {
                    isCorrect = true;
                }
            }

            if (!isCorrect) {
                // Extract topic from question (simplified - you can improve this)
                const topic = q.question.split('?')[0].substring(0, 100); // Use question as topic identifier
                weakTopics.push({
                    topic: topic,
                    question: q.question
                });
            }
        });

        // Show Result
        quizArea.style.display = 'none';
        resultArea.style.display = 'block';

        const scoreValue = document.getElementById('score-value');
        const scoreMessage = document.getElementById('score-message');

        scoreValue.textContent = scorePercentage;
        if (scorePercentage >= 80) {
            scoreMessage.textContent = "Excellent work! You've mastered this topic.";
        } else if (scorePercentage >= 60) {
            scoreMessage.textContent = "Good job! A little more study and you'll be perfect.";
        } else {
            scoreMessage.textContent = "Keep learning! Review the course material and try again.";
        }

        // Save Result to DB
        try {
            const saveResponse = await fetch('api/submit_quiz.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    course: courseName,
                    score: scorePercentage
                })
            });

            // If score is less than 80%, predict weak topics using AI and redirect to recommendations
            if (scorePercentage < 80) {
                // Prepare user answers for AI analysis
                const userAnswers = currentQuestions.map((q, index) => {
                    if (q.type === 'single') {
                        const selected = document.querySelector(`input[name="question_${index}"]:checked`);
                        return selected ? parseInt(selected.value) : null;
                    } else {
                        return Array.from(document.querySelectorAll(`input[name="question_${index}[]"]:checked`))
                            .map(cb => parseInt(cb.value));
                    }
                });

                try {
                    // Call AI prediction endpoint
                    const predictionResponse = await fetch('api/predict_weak_topics.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            course: courseName,
                            questions: currentQuestions,
                            user_answers: userAnswers,
                            score: scorePercentage
                        })
                    });

                    const predictionResult = await predictionResponse.json();

                    if (predictionResult.success && predictionResult.topics && predictionResult.topics.length > 0) {
                        // Save AI-predicted weak topics
                        await fetch('api/save_weak_topics.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: userEmail,
                                course: courseName,
                                score: scorePercentage,
                                weak_topics: predictionResult.topics
                            })
                        });

                        // Show message and redirect after 1 second
                        const redirectMessage = document.createElement('div');
                        redirectMessage.className = 'redirect-message';
                        redirectMessage.style.cssText = 'margin-top: 2rem; padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; text-align: center;';
                        redirectMessage.innerHTML = `
                            <p style="margin: 0; color: #856404;">
                                <i class="fas fa-info-circle"></i> 
                                Your score is below 80%. We've identified ${predictionResult.topics.length} topic(s) for improvement. Redirecting to personalized recommendations...
                            </p>
                        `;
                        resultArea.appendChild(redirectMessage);

                        setTimeout(() => {
                            // Store quiz result data for recommendations page
                            sessionStorage.setItem('quiz_result', JSON.stringify({
                                course: courseName,
                                score: scorePercentage,
                                weakTopics: predictionResult.topics,
                                totalQuestions: currentQuestions.length,
                                correctCount: correctCount
                            }));
                            window.location.href = 'index.html#recommendations';
                        }, 1000);
                    } else {
                        console.warn('AI prediction returned no topics');
                    }
                } catch (predictionError) {
                    console.error('Error predicting weak topics:', predictionError);
                }
            }
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    });
});
