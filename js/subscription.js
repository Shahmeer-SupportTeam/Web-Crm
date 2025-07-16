// Subscription Page JavaScript

// Global variables
let currentPlan = 'basic';
let selectedPaymentMethod = 'card';
let trialDaysLeft = 7;
let trialProgress = 65;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Subscription page loaded');
    initializeSubscriptionPage();
});

function initializeSubscriptionPage() {
    // Load subscription data
    loadSubscriptionData();
    
    // Setup event listeners
    setupSubscriptionEvents();
    
    // Initialize animations
    initializeAnimations();
    
    // Update trial progress
    updateTrialProgress();
}

function loadSubscriptionData() {
    // Simulate loading subscription data
    console.log('Loading subscription data...');
    
    // Animate plan cards
    animatePlanCards();
    
    // Animate payment methods
    animatePaymentMethods();
}

function animatePlanCards() {
    const planCards = document.querySelectorAll('.plan-card');
    
    planCards.forEach((card, index) => {
        // Initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        // Animate in with delay
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function animatePaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach((method, index) => {
        method.style.opacity = '0';
        method.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            method.style.transition = 'all 0.5s ease';
            method.style.opacity = '1';
            method.style.transform = 'translateX(0)';
        }, index * 150);
    });
}

function setupSubscriptionEvents() {
    // Plan selection
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('click', function() {
            const plan = this.dataset.plan;
            selectPlan(plan);
        });
    });
    
    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            const paymentType = this.dataset.method;
            selectPaymentMethod(paymentType);
        });
    });
    
    // Plan button clicks
    const planButtons = document.querySelectorAll('.plan-btn');
    planButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const plan = this.closest('.plan-card').dataset.plan;
            handlePlanSelection(plan);
        });
    });
    
    // Form inputs
    setupFormValidation();
}

function selectPlan(plan) {
    // Remove active class from all plans
    document.querySelectorAll('.plan-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected plan
    const selectedCard = document.querySelector(`[data-plan="${plan}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
        
        // Add animation
        selectedCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
            selectedCard.style.transform = '';
        }, 200);
    }
    
    currentPlan = plan;
    updatePlanButtons(plan);
}

function updatePlanButtons(selectedPlan) {
    const planButtons = document.querySelectorAll('.plan-btn');
    
    planButtons.forEach(button => {
        const planCard = button.closest('.plan-card');
        const plan = planCard.dataset.plan;
        
        if (plan === selectedPlan) {
            button.innerHTML = '<i class="fas fa-check"></i> Current Plan';
            button.className = 'btn btn-outline plan-btn';
        } else if (plan === 'enterprise') {
            button.innerHTML = '<i class="fas fa-phone"></i> Contact Sales';
            button.className = 'btn btn-outline plan-btn';
        } else {
            button.innerHTML = '<i class="fas fa-arrow-up"></i> Upgrade to ' + plan.charAt(0).toUpperCase() + plan.slice(1);
            button.className = 'btn btn-primary plan-btn';
        }
    });
}

function selectPaymentMethod(method) {
    // Remove active class from all payment methods
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('active');
    });
    
    // Add active class to selected method
    const selectedMethod = document.querySelector(`[data-method="${method}"]`);
    if (selectedMethod) {
        selectedMethod.classList.add('active');
        
        // Add animation
        selectedMethod.style.transform = 'scale(1.05)';
        setTimeout(() => {
            selectedMethod.style.transform = '';
        }, 200);
    }
    
    selectedPaymentMethod = method;
    updatePaymentDetails(method);
}

function updatePaymentDetails(method) {
    // Hide all payment details
    const allDetails = document.querySelectorAll('.payment-details');
    allDetails.forEach(detail => {
        detail.style.display = 'none';
    });
    
    // Show selected payment details
    const selectedDetails = document.getElementById(`${method}-details`);
    if (selectedDetails) {
        selectedDetails.style.display = 'block';
        selectedDetails.style.animation = 'slideInUp 0.5s ease-out';
    }
}

function handlePlanSelection(plan) {
    if (plan === 'enterprise') {
        showContactSales();
        return;
    }
    
    if (plan === currentPlan) {
        showMessage('You are already on this plan!', 'info');
        return;
    }
    
    // Show upgrade confirmation
    const planNames = {
        'basic': 'Basic',
        'pro': 'Professional',
        'enterprise': 'Enterprise'
    };
    
    const confirmUpgrade = confirm(`Are you sure you want to upgrade to the ${planNames[plan]} plan?`);
    
    if (confirmUpgrade) {
        processUpgrade(plan);
    }
}

function processUpgrade(plan) {
    // Show loading state
    const upgradeBtn = document.querySelector(`[data-plan="${plan}"] .plan-btn`);
    const originalText = upgradeBtn.innerHTML;
    upgradeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    upgradeBtn.disabled = true;
    
    // Simulate processing
    setTimeout(() => {
        // Reset button
        upgradeBtn.innerHTML = originalText;
        upgradeBtn.disabled = false;
        
        // Update current plan
        currentPlan = plan;
        updatePlanButtons(plan);
        
        // Show success message
        showMessage(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`, 'success');
        
        // Update trial status if upgrading from trial
        if (trialDaysLeft > 0) {
            updateToSubscription();
        }
        
    }, 2000);
}

function updateToSubscription() {
    const trialStatus = document.getElementById('trial-status');
    if (trialStatus) {
        trialStatus.className = 'status-card subscription-active';
        trialStatus.innerHTML = `
            <div class="status-header">
                <div class="status-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="status-info">
                    <h3>Active Subscription</h3>
                    <p class="status-subtitle">Your subscription is active and billing</p>
                </div>
            </div>
            <div class="status-actions">
                <button class="btn btn-outline" onclick="manageSubscription()">
                    <i class="fas fa-cog"></i>
                    Manage Subscription
                </button>
                <button class="btn btn-outline" onclick="viewBilling()">
                    <i class="fas fa-file-invoice"></i>
                    View Billing
                </button>
            </div>
        `;
        
        // Update icon color
        const statusIcon = trialStatus.querySelector('.status-icon');
        statusIcon.style.background = 'var(--success-gradient)';
        statusIcon.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.3)';
    }
}

function updateTrialProgress() {
    const progressFill = document.getElementById('trial-progress');
    const daysLeft = document.getElementById('trial-days-left');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    if (progressFill && daysLeft && progressPercentage) {
        // Animate progress bar
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.width = trialProgress + '%';
        }, 500);
        
        // Update text
        daysLeft.textContent = `${trialDaysLeft} days remaining`;
        progressPercentage.textContent = `${trialProgress}% used`;
    }
}

function upgradeNow() {
    // Scroll to plans section
    const plansSection = document.querySelector('.plans-section');
    if (plansSection) {
        plansSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function showContactSales() {
    showMessage('Please contact our sales team for Enterprise plan pricing and setup.', 'info');
}

function manageSubscription() {
    showMessage('Subscription management features coming soon!', 'info');
}

function viewBilling() {
    // Scroll to billing section
    const billingSection = document.querySelector('.billing-section');
    if (billingSection) {
        billingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function setupFormValidation() {
    // Card number formatting
    const cardInput = document.querySelector('input[placeholder*="Card Number"]');
    if (cardInput) {
        cardInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            value = value.replace(/(\d{4})/g, '$1 ').trim();
            e.target.value = value;
        });
    }
    
    // Expiry date formatting
    const expiryInput = document.querySelector('input[placeholder="MM/YY"]');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            e.target.value = value;
        });
    }
    
    // CVV validation
    const cvvInput = document.querySelector('input[placeholder="123"]');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        ${message}
    `;
    
    // Insert at top of container
    const container = document.querySelector('.subscription-container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(-20px)';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
}

function getMessageIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function initializeAnimations() {
    // Add hover effects to plan cards
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Add hover effects to payment methods
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(-2px)';
            }
        });
        
        method.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = '';
            }
        });
    });
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
        // Ctrl/Cmd + U for upgrade
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            upgradeNow();
        }
        
        // Ctrl/Cmd + B for billing
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            viewBilling();
        }
    });
    
    // Add tooltips
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        const plan = card.dataset.plan;
        card.title = `Click to select ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`;
    });
});

// Performance monitoring
function logPerformance() {
    const loadTime = performance.now();
    console.log(`Subscription page loaded in ${loadTime.toFixed(2)}ms`);
}

// Call performance logging
window.addEventListener('load', logPerformance);