// Roles page functionality for AI-powered roadmap generation

// Global variables to store roadmap data
let currentRoadmapData = null;
let currentViewMode = 'visual';

// Function to handle popular role selection
function selectRole(roleName) {
    const roleInput = document.getElementById('role-input');
    if (roleInput) {
        roleInput.value = roleName;
        // Scroll to the input field
        roleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        roleInput.focus();

        // Clear suggestions
        const suggestionsList = document.getElementById('suggestions-list');
        if (suggestionsList) {
            suggestionsList.style.display = 'none';
        }
    }
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Function to fetch and show suggestions
async function fetchSuggestions(query) {
    const suggestionsList = document.getElementById('suggestions-list');
    if (!query || query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }

    try {
        const response = await fetch('api/suggest_roles.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                suggestionsList.innerHTML = result.data.map(role => `
                    <div class="suggestion-item" onclick="selectRole('${role.replace(/'/g, "\\'")}')">
                        <i class="fas fa-search"></i> ${role}
                    </div>
                `).join('');
                suggestionsList.style.display = 'block';
            } else {
                suggestionsList.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Event listener for input changes
document.addEventListener('DOMContentLoaded', function () {
    const roleInput = document.getElementById('role-input');
    if (roleInput) {
        roleInput.addEventListener('input', debounce(function (e) {
            fetchSuggestions(e.target.value);
        }, 500));

        // Close suggestions when clicking outside
        document.addEventListener('click', function (e) {
            const suggestionsList = document.getElementById('suggestions-list');
            if (e.target !== roleInput && e.target !== suggestionsList) {
                if (suggestionsList) suggestionsList.style.display = 'none';
            }
        });
    }
});

// Function to switch between visual and text roadmap views
function switchRoadmapView(viewMode) {
    const visualBtn = document.getElementById('visual-view-btn');
    const textBtn = document.getElementById('text-view-btn');
    const visualContainer = document.getElementById('visual-roadmap-container');
    const textContainer = document.getElementById('roadmap-content');

    if (viewMode === 'visual') {
        visualBtn.classList.add('active');
        textBtn.classList.remove('active');
        visualContainer.style.display = 'block';
        textContainer.style.display = 'none';
        currentViewMode = 'visual';
    } else {
        textBtn.classList.add('active');
        visualBtn.classList.remove('active');
        textContainer.style.display = 'block';
        visualContainer.style.display = 'none';
        currentViewMode = 'text';
    }
}

// Function to generate roadmap using AI
async function generateRoadmap() {
    const roleInput = document.getElementById('role-input');
    const roadmapSection = document.getElementById('roadmap-section');
    const roadmapContent = document.getElementById('roadmap-content');
    const roadmapTitle = document.getElementById('roadmap-title');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');

    const roleText = roleInput.value.trim();

    if (!roleText) {
        showError('Please enter a role or select one from the popular roles below.');
        return;
    }

    // Hide previous content and show loading
    hideRoadmap();
    hideError();
    loadingSpinner.style.display = 'block';

    try {
        // Call the PHP API endpoint
        const response = await fetch('api/roadmap.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role_name: roleText,
                user_level: 'beginner' // You can make this dynamic based on user profile
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Store the roadmap data
            currentRoadmapData = parseRoadmapData(data.data);

            // Generate text roadmap
            const formattedRoadmap = formatRoadmapResponse(data.data, roleText);
            roadmapTitle.textContent = `Your Learning Roadmap for ${roleText}`;
            roadmapContent.innerHTML = formattedRoadmap;

            // Generate visual roadmap
            generateVisualRoadmap(currentRoadmapData, roleText);

            // Hide loading and show roadmap
            loadingSpinner.style.display = 'none';
            roadmapSection.style.display = 'block';

            // Scroll to roadmap
            roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            throw new Error(data.error || 'Failed to generate roadmap');
        }

    } catch (error) {
        console.error('Error generating roadmap:', error);
        loadingSpinner.style.display = 'none';
        showError(error.message || 'Unable to generate roadmap. Please check your API configuration and try again.');
    }
}

// Function to format the AI response into HTML
function formatRoadmapResponse(responseContent, roleName) {
    try {
        let jsonData;
        // Check if responseContent is already an object (from fetch) or string
        if (typeof responseContent === 'object') {
            jsonData = responseContent;
        } else {
            jsonData = JSON.parse(responseContent);
        }

        if (jsonData.roadmap) {
            const roadmap = jsonData.roadmap;
            let html = '';

            html += `<div class="roadmap-overview">
                <h3>Overview</h3>
                <p><strong>Role:</strong> ${roadmap.role}</p>
                <p><strong>Duration:</strong> ${roadmap.duration}</p>
                <p><strong>Prerequisites:</strong> ${roadmap.prerequisites?.join(', ') || 'None required'}</p>
            </div>`;

            if (roadmap.phases && roadmap.phases.length > 0) {
                roadmap.phases.forEach((phase, index) => {
                    html += `
                        <div class="roadmap-phase">
                            <h3>Phase ${index + 1}: ${phase.phase}</h3>
                            <p><strong>Duration:</strong> ${phase.duration}</p>

                            <h4>Key Skills:</h4>
                            <div class="course-buttons-grid">
                                ${phase.skills?.map(skill => `<button class="course-btn" onclick="addCourseToDatabase('${skill.replace(/'/g, "\\'")}')"><i class="fas fa-plus"></i> ${skill}</button>`).join('') || '<p>No specific skills listed</p>'}
                            </div>

                            <h4>Recommended Resources:</h4>
                            <div class="course-buttons-grid">
                                ${phase.resources?.map(resource => `<button class="course-btn" onclick="addCourseToDatabase('${resource.replace(/'/g, "\\'")}')"><i class="fas fa-book"></i> ${resource}</button>`).join('') || '<p>No specific resources listed</p>'}
                            </div>

                            <h4>Projects to Build:</h4>
                            <div class="course-buttons-grid">
                                ${phase.projects?.map(project => `<button class="course-btn" onclick="addCourseToDatabase('${project.replace(/'/g, "\\'")}')"><i class="fas fa-project-diagram"></i> ${project}</button>`).join('') || '<p>No specific projects listed</p>'}
                            </div>
                        </div>
                    `;
                });
            }

            if (roadmap.career_tips && roadmap.career_tips.length > 0) {
                html += `
                    <div class="career-tips">
                        <h3>Career Preparation Tips</h3>
                        <div class="course-buttons-grid">
                            ${roadmap.career_tips.map(tip => `<button class="course-btn" onclick="addCourseToDatabase('${tip.replace(/'/g, "\\'")}')"><i class="fas fa-lightbulb"></i> ${tip}</button>`).join('')}
                        </div>
                    </div>
                `;
            }

            return html;
        }
    } catch (e) {
        // If JSON parsing fails, treat as plain text and format it
        console.log('JSON parsing failed, treating as plain text');
    }

    // Fallback: format as buttons instead of plain text
    console.log('Using fallback formatting for roadmap');
    const lines = responseText.split('\n');
    let html = '<div class="roadmap-overview"><h3>Learning Roadmap</h3></div>';
    let currentSection = '';
    let buttonGroups = [];

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) {
            // Close any previous button group
            if (buttonGroups.length > 0) {
                html += '<div class="course-buttons-grid">' + buttonGroups.join('') + '</div>';
                buttonGroups = [];
            }

            const level = line.match(/^#+/)[0].length;
            const text = line.replace(/^#+\s*/, '');
            html += `<h${level + 2}>${text}</h${level + 2}>`;
            currentSection = text.toLowerCase();
        } else if (line.startsWith('-') || line.startsWith('*')) {
            const item = line.substring(1).trim();
            if (item.length > 0) {
                // Create a button for each item
                let icon = 'fas fa-plus';
                if (currentSection.includes('skill')) icon = 'fas fa-code';
                else if (currentSection.includes('resource')) icon = 'fas fa-book';
                else if (currentSection.includes('project')) icon = 'fas fa-project-diagram';
                else if (currentSection.includes('tip') || currentSection.includes('career')) icon = 'fas fa-lightbulb';

                buttonGroups.push(`<button class="course-btn" onclick="addCourseToDatabase('${item.replace(/'/g, "\\'")}')"><i class="${icon}"></i> ${item}</button>`);
            }
        } else if (line.includes(':')) {
            // Close any previous button group
            if (buttonGroups.length > 0) {
                html += '<div class="course-buttons-grid">' + buttonGroups.join('') + '</div>';
                buttonGroups = [];
            }

            const parts = line.split(':');
            if (parts.length >= 2) {
                const label = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                html += `<p><strong>${label}:</strong> ${value}</p>`;
            }
        } else if (line.length > 0 && !line.startsWith('#')) {
            // Close any previous button group
            if (buttonGroups.length > 0) {
                html += '<div class="course-buttons-grid">' + buttonGroups.join('') + '</div>';
                buttonGroups = [];
            }

            // Wrap non-header lines in buttons if they look like course items
            if (line.length < 100 && !line.includes('http') && !line.includes('@')) {
                html += `<div class="course-buttons-grid"><button class="course-btn" onclick="addCourseToDatabase('${line.replace(/'/g, "\\'")}')"><i class="fas fa-plus"></i> ${line}</button></div>`;
            } else {
                html += `<p>${line}</p>`;
            }
        }
    });

    // Close any remaining button group
    if (buttonGroups.length > 0) {
        html += '<div class="course-buttons-grid">' + buttonGroups.join('') + '</div>';
    }

    return html;
}

// Function to hide roadmap section
function hideRoadmap() {
    const roadmapSection = document.getElementById('roadmap-section');
    if (roadmapSection) {
        roadmapSection.style.display = 'none';
    }
}

// Function to show error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Function to hide error message
function hideError() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Function to parse roadmap data from AI response
function parseRoadmapData(responseContent) {
    console.log('Parsing roadmap data:', responseContent);
    try {
        let jsonData;
        if (typeof responseContent === 'object') {
            jsonData = responseContent;
        } else {
            jsonData = JSON.parse(responseContent);
        }
        console.log('Parsed JSON data:', jsonData);
        if (jsonData.roadmap) {
            console.log('Found roadmap in data:', jsonData.roadmap);
            return jsonData.roadmap;
        } else {
            console.log('No roadmap found in parsed data');
        }
    } catch (e) {
        console.log('Failed to parse roadmap JSON:', e);
        console.log('Raw response text:', responseText);
    }
    return null;
}

// Function to generate visual roadmap
function generateVisualRoadmap(roadmapData, roleName) {
    const container = document.getElementById('visual-roadmap-container');
    console.log('Generating visual roadmap, container:', container, 'data:', roadmapData);

    if (!container) {
        console.error('Visual roadmap container not found');
        return;
    }

    if (!roadmapData) {
        console.log('No roadmap data provided, using sample data for testing');
        roadmapData = {
            role: roleName || 'Sample Developer',
            duration: '6 months',
            prerequisites: ['Basic computer skills', 'HTML basics'],
            phases: [
                {
                    phase: 'Foundation',
                    duration: '4 weeks',
                    skills: ['HTML', 'CSS', 'JavaScript'],
                    resources: ['MDN Web Docs', 'freeCodeCamp'],
                    projects: ['Personal portfolio website']
                },
                {
                    phase: 'Intermediate',
                    duration: '8 weeks',
                    skills: ['React', 'Node.js', 'Database design'],
                    resources: ['React documentation', 'Node.js docs'],
                    projects: ['Full-stack web app', 'API development']
                }
            ],
            career_tips: ['Build a portfolio', 'Network on LinkedIn', 'Contribute to open source']
        };
    }

    let html = '<div class="roadmap-tree">';

    // Prerequisites level (if any)
    if (roadmapData.prerequisites && roadmapData.prerequisites.length > 0) {
        html += '<div class="roadmap-level">';
        roadmapData.prerequisites.forEach((prereq, index) => {
            const escapedPrereq = prereq.replace(/'/g, "\\'");
            html += `
                <div class="roadmap-node" onclick="showNodeDetails('prerequisite', '${escapedPrereq}', ${index})">
                    <div class="roadmap-node-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="roadmap-node-text">${prereq}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Phases
    if (roadmapData.phases && roadmapData.phases.length > 0) {
        roadmapData.phases.forEach((phase, phaseIndex) => {
            html += '<div class="roadmap-level">';

            // Main phase node
            const escapedPhase = phase.phase.replace(/'/g, "\\'");
            html += `
                <div class="roadmap-node" onclick="showNodeDetails('phase', '${escapedPhase}', ${phaseIndex})">
                    <div class="roadmap-node-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div class="roadmap-node-text">${phase.phase}</div>
                </div>
            `;

            // Skills in this phase
            if (phase.skills && phase.skills.length > 0) {
                phase.skills.forEach((skill, skillIndex) => {
                    const escapedSkill = skill.replace(/'/g, "\\'");
                    html += `
                        <div class="roadmap-node" onclick="showNodeDetails('skill', '${escapedSkill}', ${skillIndex}, ${phaseIndex})">
                            <div class="roadmap-node-icon">
                                <i class="fas fa-code"></i>
                            </div>
                            <div class="roadmap-node-text">${skill}</div>
                        </div>
                    `;
                });
            }

            // Projects in this phase
            if (phase.projects && phase.projects.length > 0) {
                phase.projects.forEach((project, projectIndex) => {
                    const escapedProject = project.replace(/'/g, "\\'");
                    html += `
                        <div class="roadmap-node" onclick="showNodeDetails('project', '${escapedProject}', ${projectIndex}, ${phaseIndex})">
                            <div class="roadmap-node-icon">
                                <i class="fas fa-project-diagram"></i>
                            </div>
                            <div class="roadmap-node-text">${project}</div>
                        </div>
                    `;
                });
            }

            html += '</div>';
        });
    }

    // Career tips level
    if (roadmapData.career_tips && roadmapData.career_tips.length > 0) {
        html += '<div class="roadmap-level">';
        roadmapData.career_tips.forEach((tip, index) => {
            const escapedTip = tip.replace(/'/g, "\\'");
            html += `
                <div class="roadmap-node" onclick="showNodeDetails('career_tip', '${escapedTip}', ${index})">
                    <div class="roadmap-node-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="roadmap-node-text">${tip.length > 20 ? tip.substring(0, 20) + '...' : tip}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '</div>';
    console.log('Generated HTML:', html);
    container.innerHTML = html;
    console.log('Container after setting HTML:', container.innerHTML);
}

// Function to show node details modal
function showNodeDetails(type, title, index, phaseIndex = null) {
    const modal = document.getElementById('node-details-modal');
    const modalTitle = document.getElementById('node-details-title');
    const modalBody = document.getElementById('node-details-body');
    const checkbox = document.getElementById('node-progress-checkbox');

    if (!modal || !currentRoadmapData) return;

    modalTitle.textContent = title;
    let bodyHtml = '';

    switch (type) {
        case 'prerequisite':
            bodyHtml = `
                <div class="node-details-section">
                    <h4>Description</h4>
                    <p>This is a prerequisite skill required before starting the learning journey for ${currentRoadmapData.role}.</p>
                </div>
            `;
            break;

        case 'phase':
            const phase = currentRoadmapData.phases[phaseIndex];
            bodyHtml = `
                <div class="node-details-section">
                    <h4>Duration</h4>
                    <p>${phase.duration}</p>
                </div>
                <div class="node-details-section">
                    <h4>Key Skills</h4>
                    <ul>
                        ${phase.skills?.map(skill => `<li>${skill}</li>`).join('') || '<li>No skills listed</li>'}
                    </ul>
                </div>
                <div class="node-details-section">
                    <h4>Recommended Resources</h4>
                    <ul>
                        ${phase.resources?.map(resource => `<li>${resource}</li>`).join('') || '<li>No resources listed</li>'}
                    </ul>
                </div>
                <div class="node-details-section">
                    <h4>Projects to Build</h4>
                    <ul>
                        ${phase.projects?.map(project => `<li>${project}</li>`).join('') || '<li>No projects listed</li>'}
                    </ul>
                </div>
            `;
            break;

        case 'skill':
            const skillPhase = currentRoadmapData.phases[phaseIndex];
            bodyHtml = `
                <div class="node-details-section">
                    <h4>Phase</h4>
                    <p>${skillPhase.phase}</p>
                </div>
                <div class="node-details-section">
                    <h4>Description</h4>
                    <p>This is a key skill to master in the ${skillPhase.phase} phase.</p>
                </div>
            `;
            break;

        case 'project':
            const projectPhase = currentRoadmapData.phases[phaseIndex];
            bodyHtml = `
                <div class="node-details-section">
                    <h4>Phase</h4>
                    <p>${projectPhase.phase}</p>
                </div>
                <div class="node-details-section">
                    <h4>Description</h4>
                    <p>This is a hands-on project to build during the ${projectPhase.phase} phase to apply your learning.</p>
                </div>
            `;
            break;

        case 'career_tip':
            bodyHtml = `
                <div class="node-details-section">
                    <h4>Career Advice</h4>
                    <p>${title}</p>
                </div>
            `;
            break;
    }

    modalBody.innerHTML = bodyHtml;

    // Set checkbox state (you can implement localStorage persistence here)
    const progressKey = `${type}_${index}_${phaseIndex || ''}`;
    const isCompleted = localStorage.getItem(progressKey) === 'true';
    checkbox.checked = isCompleted;

    // Update node visual state
    updateNodeProgress(type, index, phaseIndex, isCompleted);

    modal.classList.add('active');
}

// Function to close node details modal
function closeNodeDetails() {
    const modal = document.getElementById('node-details-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Function to update node progress
function updateNodeProgress(type, index, phaseIndex, isCompleted) {
    const nodes = document.querySelectorAll('.roadmap-node');
    // This is a simplified version - you might want to add data attributes to nodes for better targeting
    // For now, we'll just update based on click events
}

// Function to toggle node completion
function toggleNodeCompletion() {
    const checkbox = document.getElementById('node-progress-checkbox');
    const modalTitle = document.getElementById('node-details-title');

    if (checkbox && modalTitle) {
        const title = modalTitle.textContent;
        const progressKey = `node_${title.replace(/\s+/g, '_').toLowerCase()}`;

        if (checkbox.checked) {
            localStorage.setItem(progressKey, 'true');
        } else {
            localStorage.removeItem(progressKey);
        }

        // Update visual state of all nodes (simplified)
        updateAllNodeStates();
    }
}

// Function to update all node states based on localStorage
function updateAllNodeStates() {
    // This would need more sophisticated logic to match nodes to their storage keys
    // For now, it's a placeholder for future enhancement
}

// Function to add course to database
async function addCourseToDatabase(courseName) {
    // Get user email from localStorage
    const userEmail = localStorage.getItem('user_email');

    if (!userEmail) {
        showNotification('Please log in to save courses', 'error');
        // Optional: Open login modal if desired
        // openModal('login-modal');
        return;
    }

    try {
        const response = await fetch('api/add_course.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                course_name: courseName,
                email: userEmail
            })
        });

        const data = await response.json();

        if (data.success) {
            // Show success message
            showNotification(`"${courseName}" has been added to your courses!`, 'success');
            // You could also update the UI to show the course was added
        } else {
            showNotification(data.message || 'Failed to add course', 'error');
        }
    } catch (error) {
        console.error('Error adding course:', error);
        showNotification('Error connecting to server', 'error');
    }
}

// Function to show notification messages
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Event listener for progress checkbox and modal interactions
document.addEventListener('DOMContentLoaded', function () {
    const roleInput = document.getElementById('role-input');
    if (roleInput) {
        roleInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                generateRoadmap();
            }
        });
    }

    // Add event listener for progress checkbox
    const progressCheckbox = document.getElementById('node-progress-checkbox');
    if (progressCheckbox) {
        progressCheckbox.addEventListener('change', toggleNodeCompletion);
    }

    // Add event listener for modal close on outside click
    const modal = document.getElementById('node-details-modal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeNodeDetails();
            }
        });
    }
});
