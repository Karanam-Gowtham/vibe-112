// Authentication Manager
const authManager = {
    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('user_email');
    },

    // Get current user data
    getCurrentUser() {
        if (!this.isLoggedIn()) {
            return null;
        }
        return {
            id: localStorage.getItem('user_id'),
            name: localStorage.getItem('user_name'),
            email: localStorage.getItem('user_email')
        };
    },

    // Login function
    async login(email, password) {
        try {
            const response = await fetch('login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user_id', data.user.id);
                localStorage.setItem('user_name', data.user.name);
                localStorage.setItem('user_email', data.user.email);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    // Register function
    async register(name, email, password) {
        try {
            const response = await fetch('register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user_id', data.user.id);
                localStorage.setItem('user_name', data.user.name);
                localStorage.setItem('user_email', data.user.email);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    // Logout function
    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        window.location.href = 'index.html';
    },

    // Update UI based on login status
    updateUI() {
        const isLoggedIn = this.isLoggedIn();
        const signInBtn = document.getElementById('nav-signin-btn');
        const navUser = document.querySelector('.nav-user');
        const profileBtn = document.getElementById('profile-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (isLoggedIn) {
            // Hide sign in button, show profile and logout
            if (signInBtn) signInBtn.style.display = 'none';
            if (navUser) navUser.style.display = 'flex';
            
            // Set up logout button
            if (logoutBtn) {
                logoutBtn.onclick = () => {
                    this.logout();
                };
            }
        } else {
            // Show sign in button, hide profile and logout
            if (signInBtn) signInBtn.style.display = 'block';
            if (navUser) navUser.style.display = 'none';
        }
    }
};

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => {
    authManager.updateUI();
});
