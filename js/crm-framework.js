/**
 * Professional CRM Framework
 * A modular framework for building CRM applications
 */

class CRMFramework {
    constructor() {
        this.modules = {};
        this.state = {};
        this.config = {};
        this.init();
    }

    init() {
        this.loadConfig();
        this.setupEventListeners();
        this.initializeModules();
    }

    loadConfig() {
        this.config = {
            api: {
                baseURL: '',
                timeout: 30000,
                retries: 3
            },
            ui: {
                theme: 'light',
                animations: true,
                notifications: true
            },
            features: {
                realTime: true,
                offline: false,
                caching: true
            }
        };
    }

    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            UI.showMessage('An error occurred. Please try again.', 'error');
        });

        // Network status
        window.addEventListener('online', () => {
            UI.showMessage('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            UI.showMessage('No internet connection', 'warning');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentData();
        }

        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.openSearch();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    registerModule(name, module) {
        this.modules[name] = module;
        if (module.init) {
            module.init();
        }
    }

    getModule(name) {
        return this.modules[name];
    }

    initializeModules() {
        // Initialize core modules
        this.registerModule('auth', new AuthModule());
        this.registerModule('data', new DataModule());
        this.registerModule('ui', new UIModule());
        this.registerModule('notifications', new NotificationModule());
    }

    saveCurrentData() {
        // Auto-save functionality
        const currentData = this.getCurrentPageData();
        if (currentData) {
            Storage.set('autoSave', {
                timestamp: Date.now(),
                data: currentData
            });
            UI.showMessage('Data saved automatically', 'success');
        }
    }

    getCurrentPageData() {
        // Get form data from current page
        const forms = document.querySelectorAll('form');
        const data = {};
        
        forms.forEach(form => {
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
        });
        
        return Object.keys(data).length > 0 ? data : null;
    }

    openSearch() {
        // Global search functionality
        UI.showModal('Search', `
            <div class="form-group">
                <input type="text" class="form-input" placeholder="Search..." id="global-search">
            </div>
            <div id="search-results"></div>
        `);
        
        const searchInput = document.getElementById('global-search');
        searchInput.focus();
        
        searchInput.addEventListener('input', DataUtils.debounce((e) => {
            this.performGlobalSearch(e.target.value);
        }, 300));
    }

    performGlobalSearch(query) {
        if (query.length < 2) return;
        
        // Search across all modules
        const results = [];
        Object.values(this.modules).forEach(module => {
            if (module.search) {
                const moduleResults = module.search(query);
                results.push(...moduleResults);
            }
        });
        
        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No results found</p>';
            return;
        }
        
        resultsContainer.innerHTML = results.map(result => `
            <div class="search-result" onclick="crm.navigateTo('${result.type}', ${result.id})">
                <i class="fas fa-${result.icon}"></i>
                <div>
                    <strong>${result.title}</strong>
                    <p>${result.description}</p>
                </div>
            </div>
        `).join('');
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.remove();
        });
    }

    navigateTo(page, id = null) {
        const url = id ? `${page}.html?id=${id}` : `${page}.html`;
        window.location.href = url;
    }
}

// ===== AUTH MODULE =====
class AuthModule {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
    }

    init() {
        this.checkAuthStatus();
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await API.get('/auth/verify');
                this.user = response.user;
                this.isAuthenticated = true;
                this.updateUI();
            } catch (error) {
                this.logout();
            }
        }
    }

    async login(credentials) {
        try {
            const response = await API.post('/auth/login', credentials);
            API.setToken(response.token);
            this.user = response.user;
            this.isAuthenticated = true;
            this.updateUI();
            return response;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            API.clearToken();
            this.user = null;
            this.isAuthenticated = false;
            this.updateUI();
            window.location.href = 'login.html';
        }
    }

    updateUI() {
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const authType = element.getAttribute('data-auth');
            if (authType === 'authenticated' && this.isAuthenticated) {
                element.style.display = '';
            } else if (authType === 'unauthenticated' && !this.isAuthenticated) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });

        // Update user info
        const userElements = document.querySelectorAll('[data-user]');
        userElements.forEach(element => {
            const userField = element.getAttribute('data-user');
            if (this.user && this.user[userField]) {
                element.textContent = this.user[userField];
            }
        });
    }

    hasPermission(permission) {
        return this.user && this.user.permissions && this.user.permissions.includes(permission);
    }
}

// ===== DATA MODULE =====
class DataModule {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    async fetch(endpoint, options = {}) {
        const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
        
        // Check cache first
        if (options.cache !== false && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < (options.cacheTime || 300000)) {
                return cached.data;
            }
        }

        // Check if request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // Make request
        const request = API.request(endpoint, options);
        this.pendingRequests.set(cacheKey, request);

        try {
            const data = await request;
            
            // Cache the result
            if (options.cache !== false) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return data;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    async save(endpoint, data, options = {}) {
        const method = options.method || 'POST';
        const response = await API.request(endpoint, {
            method,
            body: JSON.stringify(data),
            ...options
        });

        // Clear related cache
        this.clearCache(endpoint.split('/')[0]);
        
        return response;
    }

    search(query) {
        // Search through cached data
        const results = [];
        for (const [key, value] of this.cache.entries()) {
            if (typeof value.data === 'object') {
                this.searchInObject(value.data, query, results);
            }
        }
        return results;
    }

    searchInObject(obj, query, results, path = '') {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'data',
                    id: obj.id || key,
                    title: value,
                    description: currentPath,
                    icon: 'database'
                });
            } else if (typeof value === 'object' && value !== null) {
                this.searchInObject(value, query, results, currentPath);
            }
        }
    }
}

// ===== UI MODULE =====
class UIModule {
    constructor() {
        this.currentTheme = 'light';
        this.animationsEnabled = true;
    }

    init() {
        this.loadTheme();
        this.setupThemeToggle();
        this.setupAnimations();
    }

    loadTheme() {
        const savedTheme = Storage.get('theme', 'light');
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        Storage.set('theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'light' ? 
                '<i class="fas fa-moon"></i>' : 
                '<i class="fas fa-sun"></i>';
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            });
        }
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.animationsEnabled) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('[data-animate]').forEach(element => {
            observer.observe(element);
        });
    }

    toggleAnimations() {
        this.animationsEnabled = !this.animationsEnabled;
        Storage.set('animations', this.animationsEnabled);
        
        if (!this.animationsEnabled) {
            document.body.style.setProperty('--transition', 'none');
        } else {
            document.body.style.removeProperty('--transition');
        }
    }

    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    hideLoadingOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    updateProgress(percentage) {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
    }
}

// ===== NOTIFICATION MODULE =====
class NotificationModule {
    constructor() {
        this.notifications = [];
        this.settings = {
            position: 'top-right',
            duration: 5000,
            maxVisible: 5
        };
    }

    init() {
        this.loadSettings();
        this.setupContainer();
    }

    loadSettings() {
        const savedSettings = Storage.get('notificationSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    setupContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = `notification-container ${this.settings.position}`;
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', options = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: Date.now(),
            ...options
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto remove
        if (options.duration !== 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, options.duration || this.settings.duration);
        }

        return notification.id;
    }

    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.setAttribute('data-id', notification.id);
        
        element.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(notification.type)}"></i>
                <div class="notification-message">${notification.message}</div>
                <button class="notification-close" onclick="crm.notifications.remove(${notification.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(element);

        // Animate in
        setTimeout(() => {
            element.classList.add('show');
        }, 10);

        // Limit visible notifications
        this.limitVisibleNotifications();
    }

    remove(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                element.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    limitVisibleNotifications() {
        const visible = document.querySelectorAll('.notification.show');
        if (visible.length > this.settings.maxVisible) {
            const oldest = visible[0];
            const id = parseInt(oldest.getAttribute('data-id'));
            this.remove(id);
        }
    }

    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    clear() {
        document.querySelectorAll('.notification').forEach(element => {
            element.remove();
        });
        this.notifications = [];
    }
}

// ===== GLOBAL CRM INSTANCE =====
window.crm = new CRMFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CRMFramework,
        AuthModule,
        DataModule,
        UIModule,
        NotificationModule
    };
} 