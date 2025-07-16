/**
 * Professional Authentication System
 * Handles login, signup, forgot password, password reset, and Google OAuth
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.googleClientId = '61731704056-31mg4teuti02p4efabt8r4if7dbc8b29.apps.googleusercontent.com'; // Replace with your actual client ID
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupPasswordStrength();
        this.setupKeyboardShortcuts();
        this.setupGoogleOAuth();
    }
    
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Signup form
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
        
        // Forgot password form
        document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
            this.handleForgotPassword();
    });
    
        // Reset password form
        document.getElementById('resetPasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
            this.handleResetPassword();
        });
        
        // Password strength monitoring
        document.getElementById('signupPassword').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value, 'passwordStrength');
        });
        
        document.getElementById('newPassword').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value, 'newPasswordStrength');
        });
        
        // Password confirmation validation
        document.getElementById('confirmPassword').addEventListener('input', (e) => {
            this.validatePasswordConfirmation();
        });
        
        document.getElementById('confirmNewPassword').addEventListener('input', (e) => {
            this.validateNewPasswordConfirmation();
        });
        
        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAllModals();
                }
            });
        });
    }
    
    setupGoogleOAuth() {
        // Update Google client ID in the HTML
        const googleOnload = document.getElementById('g_id_onload');
        if (googleOnload) {
            googleOnload.setAttribute('data-client_id', this.googleClientId);
        }
        
        // Add Google sign-in callback to window object
        window.handleGoogleSignIn = (response) => {
            this.handleGoogleSignIn(response);
        };
    }
    
    setupPasswordStrength() {
        // Initialize password strength indicators
        this.updatePasswordStrength('', 'passwordStrength');
        this.updatePasswordStrength('', 'newPasswordStrength');
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + Enter to submit forms
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.closest('form')) {
                    activeElement.closest('form').dispatchEvent(new Event('submit'));
                }
            }
        });
    }
    
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                // Redirect to dashboard if already logged in
                if (window.location.pathname.includes('login.html')) {
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        }
    }
    
    async handleGoogleSignIn(response) {
        try {
            this.showMessage('Signing in with Google...', 'info');
            
            // Decode the JWT token from Google
            const payload = this.decodeJwtResponse(response.credential);
            console.log(payload);
            debugger;
            // Send Google token to our server for verification
            const serverResponse = await fetch('php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'google_signin',
                    credential: response.credential,
                    user: payload
                })
            });
            
            const result = await serverResponse.json();
            
            if (result.success) {
                this.showMessage('Google sign-in successful! Redirecting...', 'success');
                
                // Store auth data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('loginMethod', 'google');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error(result.message || 'Google sign-in failed');
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showMessage(error.message || 'Google sign-in failed. Please try again.', 'error');
        }
    }
    
    decodeJwtResponse(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            throw new Error('Invalid Google token');
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        if (!this.validateLoginForm(email, password)) {
            return;
        }
        
        try {
            this.showLoading('loginForm');
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password,
                    remember: rememberMe
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Store auth data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('loginMethod', 'email');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            this.hideLoading('loginForm');
        }
    }
    
    async handleSignup() {
        const email = document.getElementById('signupEmail').value;
        const shopName = document.getElementById('shopName').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        if (!this.validateSignupForm(email, shopName, password, confirmPassword, agreeTerms)) {
            return;
        }
        
        try {
            this.showLoading('signupForm');
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'signup',
                    email: email,
                    shopName: shopName,
                    password: password,
                    mode: mode
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Account created successfully! You can now log in.', 'success');
                this.closeSignupModal();
                
                // Clear signup form
                document.getElementById('signupForm').reset();
                
                // Focus on login form
                document.getElementById('loginEmail').focus();
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            this.hideLoading('signupForm');
        }
    }
    
    async handleForgotPassword() {
        const email = document.getElementById('resetEmail').value;
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        try {
            this.showLoading('forgotPasswordForm');
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'forgot_password',
                    email: email
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Password reset link sent to your email!', 'success');
                this.closeForgotPasswordModal();
                document.getElementById('forgotPasswordForm').reset();
            } else {
                throw new Error(result.message || 'Failed to send reset link');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showMessage(error.message || 'Failed to send reset link. Please try again.', 'error');
        } finally {
            this.hideLoading('forgotPasswordForm');
        }
    }
    
    async handleResetPassword() {
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const token = document.getElementById('resetToken').value;
        
        if (!this.validatePasswordReset(password, confirmPassword)) {
            return;
        }
        
        try {
            this.showLoading('resetPasswordForm');
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'reset_password',
                    token: token,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Password updated successfully! You can now log in.', 'success');
                this.closeResetPasswordModal();
                
                // Clear reset form
                document.getElementById('resetPasswordForm').reset();
                
                // Redirect to login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            this.showMessage(error.message || 'Failed to update password. Please try again.', 'error');
        } finally {
            this.hideLoading('resetPasswordForm');
        }
    }
    
    // Validation Methods
    validateLoginForm(email, password) {
        if (!email || !password) {
            this.showMessage('Please fill in all fields.', 'error');
            return false;
        }
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return false;
        }
        
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long.', 'error');
            return false;
        }
        
        return true;
    }
    
    validateSignupForm(email, shopName, password, confirmPassword, agreeTerms) {
        if (!email || !shopName || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields.', 'error');
            return false;
        }
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return false;
        }
        
        if (shopName.length < 3) {
            this.showMessage('Shop name must be at least 3 characters long.', 'error');
            return false;
        }
        
        if (password.length < 8) {
            this.showMessage('Password must be at least 8 characters long.', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.', 'error');
            return false;
        }
        
        if (!agreeTerms) {
            this.showMessage('Please agree to the Terms of Service and Privacy Policy.', 'error');
            return false;
        }
        
        return true;
    }
    
    validatePasswordReset(password, confirmPassword) {
        if (!password || !confirmPassword) {
            this.showMessage('Please fill in all fields.', 'error');
            return false;
        }
        
        if (password.length < 8) {
            this.showMessage('Password must be at least 8 characters long.', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.', 'error');
            return false;
        }
        
        return true;
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validatePasswordConfirmation() {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');
        
        if (confirmPassword && password !== confirmPassword) {
            confirmInput.setCustomValidity('Passwords do not match');
        } else {
            confirmInput.setCustomValidity('');
        }
    }
    
    validateNewPasswordConfirmation() {
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const confirmInput = document.getElementById('confirmNewPassword');
        
        if (confirmPassword && password !== confirmPassword) {
            confirmInput.setCustomValidity('Passwords do not match');
        } else {
            confirmInput.setCustomValidity('');
        }
    }
    
    // Password Strength
    updatePasswordStrength(password, elementId) {
        const strengthFill = document.getElementById(elementId).querySelector('.strength-fill');
        const strengthText = document.getElementById(elementId).querySelector('.strength-text');
        
        const strength = this.calculatePasswordStrength(password);
        
        strengthFill.className = 'strength-fill';
        strengthFill.style.width = '0%';
        
        if (password.length === 0) {
            strengthText.textContent = 'Password strength';
            return;
        }
        
        if (strength < 3) {
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Weak password';
        } else if (strength < 5) {
            strengthFill.classList.add('medium');
            strengthText.textContent = 'Medium strength';
        } else {
            strengthFill.classList.add('strong');
            strengthText.textContent = 'Strong password';
        }
    }
    
    calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        return strength;
    }
    
    // Modal Management
    openSignupModal() {
        console.log('Opening signup modal...');
        const modal = document.getElementById('signupModal');
        if (modal) {
            modal.classList.add('show');
            document.getElementById('signupEmail').focus();
            console.log('Signup modal opened successfully');
        } else {
            console.error('Signup modal element not found');
        }
    }
    
    closeSignupModal() {
        document.getElementById('signupModal').classList.remove('show');
        document.getElementById('signupForm').reset();
        this.updatePasswordStrength('', 'passwordStrength');
    }
    
    openForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').classList.add('show');
        document.getElementById('resetEmail').focus();
    }
    
    closeForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').classList.remove('show');
        document.getElementById('forgotPasswordForm').reset();
    }
    
    openResetPasswordModal(token) {
        document.getElementById('resetToken').value = token;
        document.getElementById('resetPasswordModal').classList.add('show');
        document.getElementById('newPassword').focus();
    }
    
    closeResetPasswordModal() {
        document.getElementById('resetPasswordModal').classList.remove('show');
        document.getElementById('resetPasswordForm').reset();
        this.updatePasswordStrength('', 'newPasswordStrength');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    // Utility Methods
    showLoading(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    }
    
    hideLoading(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
    
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} auth-message`;
        messageDiv.innerHTML = `
            <i class="fas ${this.getMessageIcon(type)}"></i>
            ${message}
        `;
        
        // Insert message at the top of the auth card
        const authCard = document.querySelector('.auth-card');
        authCard.insertBefore(messageDiv, authCard.firstChild);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    getMessageIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('loginMethod');
        window.location.href = 'login.html';
    }
}

// Global functions for HTML onclick handlers
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    authManager = new AuthManager();
    console.log('AuthManager initialized:', authManager);
    
    // Global functions for HTML onclick handlers
    window.openSignupModal = function() {
        console.log('Global openSignupModal called');
        if (authManager) {
            authManager.openSignupModal();
        } else {
            console.error('AuthManager not initialized, trying fallback...');
            // Fallback: directly manipulate the modal
            const modal = document.getElementById('signupModal');
            if (modal) {
                modal.classList.add('show');
                const emailInput = document.getElementById('signupEmail');
                if (emailInput) emailInput.focus();
                console.log('Fallback modal opening successful');
            } else {
                console.error('Modal element not found');
            }
        }
    };
    
    window.closeSignupModal = function() {
        authManager.closeSignupModal();
    };
    
    window.openForgotPasswordModal = function() {
        authManager.openForgotPasswordModal();
    };
    
    window.closeForgotPasswordModal = function() {
        authManager.closeForgotPasswordModal();
    };
    
    window.closeResetPasswordModal = function() {
        authManager.closeResetPasswordModal();
    };
    
    window.togglePassword = function(inputId) {
        const input = document.getElementById(inputId);
        const toggleBtn = input.parentElement.querySelector('.password-toggle i');
        
        if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            toggleBtn.className = 'fas fa-eye';
        }
    };
    
    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
        authManager.openResetPasswordModal(resetToken);
    }
});