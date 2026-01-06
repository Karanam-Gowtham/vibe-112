// UI Functions for modals and section switching

// Slideshow functionality
let currentSlide = 0;
let slideInterval;

// Initialize slideshow as soon as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlideshow);
} else {
    // DOM already loaded
    initSlideshow();
}

function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    if (slides.length === 0) return;

    // Clear any existing active states first
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Show first slide initially
    slides[0].classList.add('active');
    dots[0].classList.add('active');
    currentSlide = 0;

    // Start automatic slideshow
    startSlideshow();

    // Add click handlers to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });
}

function startSlideshow() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length <= 1) return;

    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000); // Change slide every 5 seconds
}

function showSlide(slideIndex) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Show current slide
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');

    currentSlide = slideIndex;
}

function goToSlide(slideIndex) {
    // Clear current interval and restart
    clearInterval(slideInterval);
    showSlide(slideIndex);
    startSlideshow();
}

// Open modal function
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Switch section function
function switchSection(sectionId) {
    // Check if trying to access profile without being logged in
    if (sectionId === 'profile' && !authManager.isLoggedIn()) {
        openModal('login-modal');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });

    // If switching to profile, load user data
    if (sectionId === 'profile') {
        loadProfileData();
    }
}

// Load profile data from localStorage
async function loadProfileData() {
    const user = authManager.getCurrentUser();
    if (user) {
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');

        if (profileName) profileName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;

        // Also update dashboard user name
        const dashboardUserName = document.getElementById('user-name');
        if (dashboardUserName) dashboardUserName.textContent = user.name;
    } else {
        // If not logged in, redirect to home
        switchSection('home');
    }
}

// Initialize modals and forms
document.addEventListener('DOMContentLoaded', () => {
    // Close modal on X click
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal') ||
                this.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // Handle modal login form
    const modalLoginForm = document.getElementById('login-form');
    if (modalLoginForm) {
        modalLoginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('modal-login-email').value.trim();
            const password = document.getElementById('modal-login-password').value;
            const errorDiv = document.getElementById('modal-login-error');
            const successDiv = document.getElementById('modal-login-success');

            // Clear previous messages
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.classList.remove('show');
            }
            if (successDiv) {
                successDiv.textContent = '';
                successDiv.classList.remove('show');
            }

            // Clear field errors
            document.querySelectorAll('#login-form .error-text').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });

            // Validate
            let isValid = true;
            if (!email) {
                const emailError = document.getElementById('modal-login-email-error');
                if (emailError) {
                    emailError.textContent = 'Email is required';
                    emailError.style.display = 'block';
                }
                isValid = false;
            }
            if (!password) {
                const passwordError = document.getElementById('modal-login-password-error');
                if (passwordError) {
                    passwordError.textContent = 'Password is required';
                    passwordError.style.display = 'block';
                }
                isValid = false;
            }

            if (!isValid) return;

            // Attempt login
            try {
                const result = await authManager.login(email, password);

                if (result.success) {
                    if (successDiv) {
                        successDiv.textContent = 'Login successful!';
                        successDiv.classList.add('show');
                    }

                    // Update UI
                    authManager.updateUI();

                    // Close modal and reload page after short delay
                    setTimeout(() => {
                        closeModal('login-modal');
                        window.location.reload();
                    }, 1000);
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = result.message;
                        errorDiv.classList.add('show');
                    }
                }
            } catch (error) {
                if (errorDiv) {
                    errorDiv.textContent = 'An error occurred. Please try again.';
                    errorDiv.classList.add('show');
                }
            }
        });
    }

    // Handle modal register form
    const modalRegisterForm = document.getElementById('register-form');
    if (modalRegisterForm) {
        modalRegisterForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('modal-register-name').value.trim();
            const email = document.getElementById('modal-register-email').value.trim();
            const password = document.getElementById('modal-register-password').value;
            const confirmPassword = document.getElementById('modal-register-confirm-password').value;
            const errorDiv = document.getElementById('modal-register-error');
            const successDiv = document.getElementById('modal-register-success');

            // Clear previous messages
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.classList.remove('show');
            }
            if (successDiv) {
                successDiv.textContent = '';
                successDiv.classList.remove('show');
            }

            // Clear field errors
            document.querySelectorAll('#register-form .error-text').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });

            // Validate
            let isValid = true;
            if (!name || name.length < 2) {
                const nameError = document.getElementById('modal-register-name-error');
                if (nameError) {
                    nameError.textContent = 'Name must be at least 2 characters';
                    nameError.style.display = 'block';
                }
                isValid = false;
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                const emailError = document.getElementById('modal-register-email-error');
                if (emailError) {
                    emailError.textContent = 'Please enter a valid email';
                    emailError.style.display = 'block';
                }
                isValid = false;
            }
            if (!password || password.length < 6) {
                const passwordError = document.getElementById('modal-register-password-error');
                if (passwordError) {
                    passwordError.textContent = 'Password must be at least 6 characters';
                    passwordError.style.display = 'block';
                }
                isValid = false;
            }
            if (password !== confirmPassword) {
                const confirmError = document.getElementById('modal-register-confirm-password-error');
                if (confirmError) {
                    confirmError.textContent = 'Passwords do not match';
                    confirmError.style.display = 'block';
                }
                isValid = false;
            }

            if (!isValid) return;

            // Attempt registration
            try {
                const result = await authManager.register(name, email, password);

                if (result.success) {
                    if (successDiv) {
                        successDiv.textContent = 'Account created successfully!';
                        successDiv.classList.add('show');
                    }

                    // Update UI
                    authManager.updateUI();

                    // Close modal and reload page after short delay
                    setTimeout(() => {
                        closeModal('register-modal');
                        window.location.reload();
                    }, 1000);
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = result.message;
                        errorDiv.classList.add('show');
                    }
                }
            } catch (error) {
                if (errorDiv) {
                    errorDiv.textContent = 'An error occurred. Please try again.';
                    errorDiv.classList.add('show');
                }
            }
        });
    }

    // Switch between login and register modals
    const switchToRegister = document.getElementById('switch-to-register');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function (e) {
            e.preventDefault();
            closeModal('login-modal');
            openModal('register-modal');
        });
    }

    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function (e) {
            e.preventDefault();
            closeModal('register-modal');
            openModal('login-modal');
        });
    }

    // Handle nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                // Prevent default only for section switching links
                e.preventDefault();
                // Check if trying to access profile without being logged in
                if (sectionId === 'profile' && !authManager.isLoggedIn()) {
                    openModal('login-modal');
                    return;
                }
                switchSection(sectionId);
            }
            // If no data-section, let normal navigation happen (for external links like dashboard.html)
        });
    });

    // Initialize slideshow
    initSlideshow();

    // Update UI on page load
    authManager.updateUI();

    // Load profile data if on profile section
    if (document.getElementById('profile') && document.getElementById('profile').classList.contains('active')) {
        loadProfileData();
    }

    // Handle initial hash fragment
    handleHashFragment();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashFragment);
});

// Function to handle hash fragments for section switching
function handleHashFragment() {
    const hash = window.location.hash.substring(1); // Remove '#'
    if (hash) {
        // If it's a known section, switch to it
        const section = document.getElementById(hash);
        if (section && section.classList.contains('content-section')) {
            switchSection(hash);
        }
    }
}
