// Reports JavaScript - Modern CRM Reports with Charts and Analytics

// Chart.js CDN is included in the HTML
document.addEventListener('DOMContentLoaded', function() {
    initializeSalesChart();
    initializeRevenueChart();
    initializeCustomerChart();
    initializeInventoryChart();
    
    // Setup event listeners
    setupReportControls();
    setupTabNavigation();
    setupDateFilters();
    setupExportFunctions();
    
    // Load initial data
    loadReportData();
    
    // Add animations
    addReportAnimations();
});

function initializeSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Sales',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#333' } },
                x: { ticks: { color: '#333' } }
            }
        }
    });
}

function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Products', 'Services', 'Subscriptions', 'Other'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#333' } } }
        }
    });
}

function initializeCustomerChart() {
    const ctx = document.getElementById('customerChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['New', 'Returning', 'VIP', 'Inactive'],
            datasets: [{
                label: 'Customers',
                data: [150, 200, 50, 30],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#333' } },
                x: { ticks: { color: '#333' } }
            }
        }
    });
}

function initializeInventoryChart() {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'],
            datasets: [{
                label: 'Stock Level',
                data: [85, 70, 90, 60, 75, 80],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    pointLabels: { color: '#333' },
                    ticks: { color: '#333', backdropColor: 'transparent' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

function setupReportControls() {
    // Date range picker
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            updateReports(this.value);
        });
    }

    // Report type selector
    const reportType = document.getElementById('reportType');
    if (reportType) {
        reportType.addEventListener('change', function() {
            loadReportData(this.value);
        });
    }

    // Export buttons
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.dataset.format;
            exportReport(format);
        });
    });
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.tab;
            
            // Remove active class from all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(target).classList.add('active');
            
            // Add animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

function setupDateFilters() {
    const quickFilters = document.querySelectorAll('.quick-filter');
    quickFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const period = this.dataset.period;
            applyDateFilter(period);
            
            // Update active state
            quickFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function setupExportFunctions() {
    // PDF Export
    const pdfBtn = document.querySelector('.export-pdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }

    // Excel Export
    const excelBtn = document.querySelector('.export-excel');
    if (excelBtn) {
        excelBtn.addEventListener('click', function() {
            exportToExcel();
        });
    }
}

function loadReportData(type = 'sales') {
    // Simulate loading data
    showLoading();
    
    setTimeout(() => {
        updateMetrics();
        hideLoading();
    }, 1000);
}

function updateMetrics() {
    const metrics = [
        { id: 'totalSales', value: '$125,000', change: '+12%' },
        { id: 'totalRevenue', value: '$98,500', change: '+8%' },
        { id: 'totalCustomers', value: '1,250', change: '+15%' },
        { id: 'avgOrderValue', value: '$156', change: '+5%' }
    ];

    metrics.forEach(metric => {
        const element = document.getElementById(metric.id);
        if (element) {
            const valueEl = element.querySelector('.metric-value');
            const changeEl = element.querySelector('.metric-change');
            
            if (valueEl) valueEl.textContent = metric.value;
            if (changeEl) {
                changeEl.textContent = metric.change;
                changeEl.className = 'metric-change positive';
            }
        }
    });
}

function updateReports(dateRange) {
    // Update charts based on date range
    console.log('Updating reports for date range:', dateRange);
    
    // Add loading animation
    const charts = document.querySelectorAll('.chart-container');
    charts.forEach(chart => {
        chart.style.opacity = '0.5';
    });
    
    setTimeout(() => {
        charts.forEach(chart => {
            chart.style.opacity = '1';
        });
    }, 500);
}

function applyDateFilter(period) {
    const periods = {
        'today': 'Today',
        'week': 'This Week',
        'month': 'This Month',
        'quarter': 'This Quarter',
        'year': 'This Year'
    };
    
    // Update date range display
    const dateRangeDisplay = document.querySelector('.date-range-display');
    if (dateRangeDisplay) {
        dateRangeDisplay.textContent = periods[period] || period;
    }
    
    // Update reports
    updateReports(period);
}

function exportReport(format) {
    showNotification(`Exporting report as ${format.toUpperCase()}...`, 'info');
    
    setTimeout(() => {
        showNotification('Report exported successfully!', 'success');
    }, 2000);
}

function openEmailModal() {
    document.getElementById('emailModal').classList.add('show');
    document.getElementById('emailAddress').focus();
}
function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('show');
    document.getElementById('emailForm').reset();
}
async function sendEmailReport(event) {
    event.preventDefault();
    const email = document.getElementById('emailAddress').value;
    // Gather current filters
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    let startDate = '', endDate = '';
    if (dateRange === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
    }
    showLoading();
    try {
        const response = await fetch('php/reports_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'email_report',
                email,
                reportType,
                dateRange,
                startDate,
                endDate
            })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Report sent to ' + email + '!', 'success');
            closeEmailModal();
        } else {
            showNotification(result.message || 'Failed to send email.', 'error');
        }
    } catch (err) {
        showNotification('Failed to send email: ' + err.message, 'error');
    }
    hideLoading();
}

// PDF Export using jsPDF and html2canvas
function exportToPDF() {
    showNotification('Generating PDF report...', 'info');
    if (window.jspdf && window.html2canvas) {
        const reportSection = document.querySelector('.reports-container');
        window.html2canvas(reportSection).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 40;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            pdf.save('report.pdf');
            showNotification('PDF report downloaded!', 'success');
        });
    } else {
        showNotification('PDF export requires jsPDF and html2canvas libraries.', 'error');
    }
}

// Excel Export using SheetJS
function exportToExcel() {
    showNotification('Generating Excel report...', 'info');
    if (window.XLSX) {
        const table = document.querySelector('.report-table');
        const wb = window.XLSX.utils.table_to_book(table, { sheet: 'Report' });
        window.XLSX.writeFile(wb, 'report.xlsx');
        showNotification('Excel report downloaded!', 'success');
    } else {
        showNotification('Excel export requires SheetJS (XLSX) library.', 'error');
    }
}

function shareReport() {
    // Get current filters
    const reportType = document.getElementById('report-type').value;
    const dateRange = document.getElementById('date-range').value;
    let url = new URL(window.location.href.split('#')[0]);
    url.searchParams.set('type', reportType);
    url.searchParams.set('range', dateRange);
    // If custom range, add start and end dates
    if (dateRange === 'custom') {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        if (startDate) url.searchParams.set('start', startDate);
        if (endDate) url.searchParams.set('end', endDate);
    }
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString()).then(() => {
        showNotification('Share link copied to clipboard!', 'success');
    }, () => {
        showNotification('Failed to copy link.', 'error');
    });
}

// Enhance generateReport to fetch real data (simulate API)
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    let startDate = '', endDate = '';
    if (dateRange === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
    }
    showLoading();
    // Simulate API call
    setTimeout(async () => {
        // In a real app, fetch data from server using filters
        try {
            const response = await fetch('php/reports_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_report',
                    reportType,
                    dateRange,
                    startDate,
                    endDate
                })
            });
            const result = await response.json();
            if (result.success && result.data) {
                // Update UI with real data (implement updateReportUI as needed)
                updateReportUI(result.data);
                showNotification('Report generated for ' + reportType.replace(/\b\w/g, l => l.toUpperCase()) + '!', 'success');
            } else {
                showNotification(result.message || 'Failed to load report.', 'error');
            }
        } catch (err) {
            showNotification('Failed to load report: ' + err.message, 'error');
        }
        hideLoading();
    }, 1000);
}

// Dummy updateReportUI function (implement as needed)
function updateReportUI(data) {
    // Example: update metrics, tables, charts, etc.
    // document.getElementById('totalRevenue').textContent = data.totalRevenue;
    // ...
}

function showLoading() {
    const loadingEl = document.querySelector('.loading-overlay');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingEl = document.querySelector('.loading-overlay');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
}

function addReportAnimations() {
    // Animate metric cards on load
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 100);
    });
    
    // Animate chart containers
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach((container, index) => {
        setTimeout(() => {
            container.classList.add('animate-in');
        }, (index + 4) * 100);
    });
    
    // Add hover effects
    const interactiveElements = document.querySelectorAll('.metric-card, .chart-container, .report-card');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Add CSS for notifications
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    margin-left: 10px;
}

.notification.success {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.notification.info {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

.notification.warning {
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

.notification.error {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.animate-in {
    animation: slideInUp 0.6s ease forwards;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// Add loading overlay to body
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
document.body.appendChild(loadingOverlay);

console.log('Reports JavaScript loaded successfully!');