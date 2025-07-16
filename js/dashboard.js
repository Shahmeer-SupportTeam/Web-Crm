// Dashboard JavaScript

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    initializeDashboard();
});

function initializeDashboard() {
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupDashboardEvents();
    
    // Start real-time updates
    startRealTimeUpdates();
}

function loadDashboardData() {
    // Simulate loading data with animations
    animateStats();
    loadRecentActivity();
    updateCharts();
}

function animateStats() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        // Initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        // Animate in with delay
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function loadRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    const activities = [
        {
            icon: 'shopping-cart',
            title: 'New sale recorded',
            time: '2 minutes ago'
        },
        {
            icon: 'box',
            title: 'Product added to inventory',
            time: '15 minutes ago'
        },
        {
            icon: 'user',
            title: 'New customer registered',
            time: '1 hour ago'
        },
        {
            icon: 'receipt',
            title: 'Expense recorded',
            time: '2 hours ago'
        },
        {
            icon: 'chart-bar',
            title: 'Monthly report generated',
            time: '1 day ago'
        }
    ];
    
    // Animate each activity item
    activities.forEach((activity, index) => {
        const activityItem = activityList.children[index];
        if (activityItem) {
            activityItem.style.opacity = '0';
            activityItem.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                activityItem.style.transition = 'all 0.5s ease';
                activityItem.style.opacity = '1';
                activityItem.style.transform = 'translateX(0)';
            }, index * 300);
        }
    });
}

function updateCharts() {
    // Simulate chart updates
    const chartContainer = document.getElementById('salesChart');
    if (chartContainer) {
        // Add some sample chart data visualization
        setTimeout(() => {
            chartContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary-color);"></i>
                    <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Sales Trend</h4>
                    <div style="display: flex; justify-content: space-around; align-items: end; height: 150px; margin: 2rem 0;">
                        <div style="width: 30px; background: var(--primary-gradient); border-radius: 4px 4px 0 0; height: 60px; animation: growBar 1s ease-out;"></div>
                        <div style="width: 30px; background: var(--success-gradient); border-radius: 4px 4px 0 0; height: 90px; animation: growBar 1s ease-out 0.2s;"></div>
                        <div style="width: 30px; background: var(--warning-gradient); border-radius: 4px 4px 0 0; height: 75px; animation: growBar 1s ease-out 0.4s;"></div>
                        <div style="width: 30px; background: var(--danger-gradient); border-radius: 4px 4px 0 0; height: 110px; animation: growBar 1s ease-out 0.6s;"></div>
                        <div style="width: 30px; background: var(--primary-gradient); border-radius: 4px 4px 0 0; height: 85px; animation: growBar 1s ease-out 0.8s;"></div>
                        <div style="width: 30px; background: var(--success-gradient); border-radius: 4px 4px 0 0; height: 95px; animation: growBar 1s ease-out 1s;"></div>
                        <div style="width: 30px; background: var(--warning-gradient); border-radius: 4px 4px 0 0; height: 70px; animation: growBar 1s ease-out 1.2s;"></div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Last 7 days sales performance</p>
                </div>
            `;
        }, 1000);
    }
}

function setupDashboardEvents() {
    // Quick action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Stat cards hover effects
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Activity items hover effects
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(102, 126, 234, 0.1)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.background = '';
        });
    });
}

function startRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
        updateRandomStat();
    }, 30000);
}

function updateRandomStat() {
    const statCards = document.querySelectorAll('.stat-card');
    const randomCard = statCards[Math.floor(Math.random() * statCards.length)];
    
    if (randomCard) {
        // Add a subtle pulse animation
        randomCard.style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => {
            randomCard.style.animation = '';
        }, 600);
    }
}

function logout() {
    // Show confirmation
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored data
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Show loading state
        const logoutBtn = document.querySelector('a[onclick="logout()"]');
        if (logoutBtn) {
            const originalText = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
            
            setTimeout(() => {
                // Redirect to login
                window.location.href = 'login.html';
            }, 1000);
        } else {
            window.location.href = 'login.html';
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes growBar {
        from {
            height: 0;
        }
        to {
            height: var(--final-height);
        }
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
    
    .stat-card {
        --final-height: 100%;
    }
`;
document.head.appendChild(style);

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S for sales
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            window.location.href = 'sales.html';
        }
        
        // Ctrl/Cmd + I for inventory
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            window.location.href = 'inventory.html';
        }
        
        // Ctrl/Cmd + R for reports
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            window.location.href = 'reports.html';
        }
    });
    
    // Add tooltips
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        const title = card.querySelector('.action-title').textContent;
        card.title = `Click to ${title.toLowerCase()}`;
    });
});

// Performance monitoring
function logPerformance() {
    const loadTime = performance.now();
    console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
}

// Call performance logging
window.addEventListener('load', logPerformance);