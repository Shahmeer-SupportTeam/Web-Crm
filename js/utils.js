/**
 * Professional CRM Utilities
 * A collection of reusable functions for the Web CRM system
 */

// ===== API UTILITIES =====
class API {
    static baseURL = '';
    static token = localStorage.getItem('authToken');

    static async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    static setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    static clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
}

// ===== VALIDATION UTILITIES =====
class Validator {
    static email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static password(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    static phone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    static required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    static minLength(value, min) {
        return value && value.toString().length >= min;
    }

    static maxLength(value, max) {
        return value && value.toString().length <= max;
    }

    static number(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    static positive(value) {
        return this.number(value) && parseFloat(value) > 0;
    }

    static date(value) {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
    }

    static futureDate(value) {
        const date = new Date(value);
        return this.date(value) && date > new Date();
    }

    static pastDate(value) {
        const date = new Date(value);
        return this.date(value) && date < new Date();
    }
}

// ===== FORM UTILITIES =====
class FormHandler {
    constructor(formId, validationRules = {}) {
        this.form = document.getElementById(formId);
        this.validationRules = validationRules;
        this.errors = {};
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupValidation();
    }

    setupValidation() {
        Object.keys(this.validationRules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldName));
                field.addEventListener('input', () => this.clearFieldError(fieldName));
            }
        });
    }

    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const value = field.value;
        const rules = this.validationRules[fieldName];
        
        for (const rule of rules) {
            const isValid = Validator[rule.type](value, rule.value);
            if (!isValid) {
                this.showFieldError(fieldName, rule.message);
                return false;
            }
        }
        
        this.clearFieldError(fieldName);
        return true;
    }

    validateAll() {
        let isValid = true;
        Object.keys(this.validationRules).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });
        return isValid;
    }

    showFieldError(fieldName, message) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);
        
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        this.errors[fieldName] = message;
    }

    clearFieldError(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);
        
        field.classList.remove('error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        delete this.errors[fieldName];
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateAll()) {
            return false;
        }
        
        const formData = this.getFormData();
        return formData;
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    setFormData(data) {
        Object.keys(data).forEach(key => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }

    reset() {
        this.form.reset();
        Object.keys(this.validationRules).forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
    }
}

// ===== UI UTILITIES =====
class UI {
    static showLoading(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <span class="loading">
                <span class="loading-spinner"></span>
                ${text}
            </span>
        `;
        element.disabled = true;
        return originalContent;
    }

    static hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
        element.disabled = false;
    }

    static showMessage(message, type = 'info', duration = 5000) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            <span>${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(messageElement);
        
        // Auto remove after duration
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, duration);
    }

    static getMessageIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    static showModal(title, content, buttons = []) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        ${content}
                    </div>
                    <div class="modal-footer" style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        ${buttons.map(btn => `
                            <button class="btn ${btn.class || 'btn-secondary'}" onclick="this.closest('.modal-overlay').remove(); ${btn.onclick || ''}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Show modal with animation
            setTimeout(() => modal.classList.add('active'), 10);
            
            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    static confirm(message, title = 'Confirm') {
        return this.showModal(title, message, [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: 'window.confirmResult = false;'
            },
            {
                text: 'Confirm',
                class: 'btn-primary',
                onclick: 'window.confirmResult = true;'
            }
        ]);
    }

    static animate(element, animation, duration = 300) {
        element.style.animation = `${animation} ${duration}ms ease-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '1';
        }, 10);
    }

    static fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }
}

// ===== DATA UTILITIES =====
class DataUtils {
    static formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    static formatDate(date, format = 'medium') {
        const dateObj = new Date(date);
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            medium: { month: 'long', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
            time: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        
        return new Intl.DateTimeFormat('en-US', options[format] || options.medium).format(dateObj);
    }

    static formatNumber(number, decimals = 2) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    static sortBy(array, key, order = 'asc') {
        return array.sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (order === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    }

    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (typeof filterValue === 'string') {
                    return itemValue.toLowerCase().includes(filterValue.toLowerCase());
                }
                
                if (typeof filterValue === 'number') {
                    return itemValue === filterValue;
                }
                
                if (Array.isArray(filterValue)) {
                    return filterValue.includes(itemValue);
                }
                
                return itemValue === filterValue;
            });
        });
    }
}

// ===== STORAGE UTILITIES =====
class Storage {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    }

    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }

    static has(key) {
        return localStorage.getItem(key) !== null;
    }
}

// ===== EVENT UTILITIES =====
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        
        if (callback) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        } else {
            delete this.events[event];
        }
    }

    emit(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Event callback error:', error);
            }
        });
    }
}

// ===== EXPORT UTILITIES =====
class ExportUtils {
    static exportToCSV(data, filename = 'export.csv') {
        if (!data || !data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    static exportToPDF(element, filename = 'export.pdf') {
        // This would require a PDF library like jsPDF
        console.log('PDF export functionality requires jsPDF library');
    }

    static printElement(element) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print</title>
                    <link rel="stylesheet" href="css/main.css">
                    <link rel="stylesheet" href="css/components.css">
                </head>
                <body>
                    ${element.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// ===== GLOBAL EVENT BUS =====
window.eventBus = new EventBus();

// ===== GLOBAL UTILITIES =====
window.API = API;
window.Validator = Validator;
window.FormHandler = FormHandler;
window.UI = UI;
window.DataUtils = DataUtils;
window.Storage = Storage;
window.ExportUtils = ExportUtils;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API,
        Validator,
        FormHandler,
        UI,
        DataUtils,
        Storage,
        EventBus,
        ExportUtils
    };
} 