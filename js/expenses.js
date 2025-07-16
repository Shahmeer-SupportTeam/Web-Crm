/**
 * Professional Expenses Management JavaScript
 * Advanced expense tracking with real-time updates and analytics
 */

// Global variables
let expensesData = [];
let categoryChart = null;
let trendChart = null;
let currentExpenseId = null;

// Initialize the expenses page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Expenses page loaded');
    initializeExpensesPage();
});

function initializeExpensesPage() {
    // Set default date to today
    document.getElementById('expenseDate').valueAsDate = new Date();
    
    // Initialize forms
    setupFormHandlers();
    
    // Load initial data
    loadExpensesData();
    
    // Setup real-time updates
    setupRealTimeUpdates();
    
    // Initialize charts
    initializeCharts();
}

function setupFormHandlers() {
    // Add expense form
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleAddExpense);
    }
    
    // Edit expense form
    const editExpenseForm = document.getElementById('editExpenseForm');
    if (editExpenseForm) {
        editExpenseForm.addEventListener('submit', handleEditExpense);
    }
    
    // Form validation
    setupFormValidation();
}

function setupFormValidation() {
    // Amount validation
    const amountInputs = document.querySelectorAll('#expenseAmount, #editExpenseAmount');
    amountInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (value < 0) {
                this.classList.add('error');
                this.classList.remove('success');
            } else {
                this.classList.remove('error');
                this.classList.add('success');
            }
        });
    });
    
    // Date validation
    const dateInputs = document.querySelectorAll('#expenseDate, #editExpenseDate');
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const today = new Date();
            
            if (selectedDate > today) {
                this.classList.add('error');
                this.classList.remove('success');
            } else {
                this.classList.remove('error');
                this.classList.add('success');
            }
        });
    });
}

async function loadExpensesData() {
    try {
        showLoading();
        
        // Load summary data
        const summaryResponse = await API.get('/expenses/summary');
        updateSummaryStats(summaryResponse);
        
        // Load recent expenses
        const expensesResponse = await API.get('/expenses/recent');
        expensesData = expensesResponse.expenses || [];
        renderExpensesTable(expensesData);
        
        // Update charts
        updateCharts(summaryResponse);
        
        hideLoading();
        
    } catch (error) {
        console.error('Failed to load expenses data:', error);
        UI.showMessage('Failed to load expenses data', 'error');
        hideLoading();
    }
}

function updateSummaryStats(data) {
    // Update current month total
    const currentMonthElement = document.getElementById('current-month-total');
    if (currentMonthElement) {
        currentMonthElement.textContent = DataUtils.formatCurrency(data.currentMonthTotal, 'PKR');
    }
    
    // Update total expenses
    const totalExpensesElement = document.getElementById('total-expenses');
    if (totalExpensesElement) {
        totalExpensesElement.textContent = DataUtils.formatCurrency(data.totalExpenses, 'PKR');
    }
    
    // Update categories count
    const categoriesCountElement = document.getElementById('categories-count');
    if (categoriesCountElement) {
        categoriesCountElement.textContent = data.categoriesCount || 0;
    }
    
    // Update average expense
    const avgExpenseElement = document.getElementById('avg-expense');
    if (avgExpenseElement) {
        avgExpenseElement.textContent = DataUtils.formatCurrency(data.averageExpense, 'PKR');
    }
    
    // Update change percentages
    updateChangePercentages(data);
}

function updateChangePercentages(data) {
    const monthChangeElement = document.getElementById('month-change');
    const totalChangeElement = document.getElementById('total-change');
    
    if (monthChangeElement) {
        const change = data.monthChange || 0;
        monthChangeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        monthChangeElement.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (totalChangeElement) {
        const change = data.totalChange || 0;
        totalChangeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        totalChangeElement.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No expenses recorded yet</h3>
                    <p>Start tracking your business expenses by adding your first expense.</p>
                    <button class="btn btn-primary" onclick="openExpenseModal()">
                        <i class="fas fa-plus"></i>
                        Add First Expense
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => `
        <tr class="expense-row" data-id="${expense.expense_id}">
            <td>${DataUtils.formatDate(expense.expense_date, 'short')}</td>
            <td>
                <span class="expense-category ${expense.category}">
                    <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
                    ${expense.category}
                </span>
            </td>
            <td class="expense-amount">${DataUtils.formatCurrency(expense.amount, 'PKR')}</td>
            <td class="expense-notes" title="${expense.notes || ''}">
                ${expense.notes || '-'}
            </td>
            <td class="expense-actions">
                <button class="action-btn edit" onclick="editExpense(${expense.expense_id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteExpense(${expense.expense_id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        rent: 'home',
        bill: 'bolt',
        transport: 'car',
        salary: 'users',
        marketing: 'bullhorn',
        maintenance: 'wrench',
        insurance: 'shield-alt',
        other: 'ellipsis-h'
    };
    return icons[category] || 'tag';
}

function initializeCharts() {
    // Initialize category chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#667eea', '#4facfe', '#43e97b', '#fa709a',
                        '#ffce56', '#9966ff', '#4bc0c0', '#9e9e9e'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${DataUtils.formatCurrency(value, 'PKR')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Initialize trend chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Monthly Expenses',
                    data: [],
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
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return DataUtils.formatCurrency(value, 'PKR');
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateCharts(data) {
    // Update category chart
    if (categoryChart && data.categoryBreakdown) {
        categoryChart.data.labels = Object.keys(data.categoryBreakdown);
        categoryChart.data.datasets[0].data = Object.values(data.categoryBreakdown);
        categoryChart.update();
    }
    
    // Update trend chart
    if (trendChart && data.monthlyTrend) {
        trendChart.data.labels = data.monthlyTrend.map(item => item.month);
        trendChart.data.datasets[0].data = data.monthlyTrend.map(item => item.total);
        trendChart.update();
    }
}

async function handleAddExpense(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseData = {
        date: formData.get('expenseDate'),
        amount: parseFloat(formData.get('expenseAmount')),
        category: formData.get('expenseCategory'),
        notes: formData.get('expenseNotes') || ''
    };
    
    // Validate data
    if (!validateExpenseData(expenseData)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await API.post('/expenses/add', expenseData);
        
        if (response.success) {
            UI.showMessage('Expense added successfully!', 'success');
            closeExpenseModal();
            resetExpenseForm();
            await loadExpensesData(); // Reload data
        } else {
            throw new Error(response.message || 'Failed to add expense');
        }
        
    } catch (error) {
        console.error('Error adding expense:', error);
        UI.showMessage(`Error adding expense: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function handleEditExpense(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseData = {
        id: currentExpenseId,
        date: formData.get('editExpenseDate'),
        amount: parseFloat(formData.get('editExpenseAmount')),
        category: formData.get('editExpenseCategory'),
        notes: formData.get('editExpenseNotes') || ''
    };
    
    // Validate data
    if (!validateExpenseData(expenseData)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await API.put(`/expenses/update/${currentExpenseId}`, expenseData);
        
        if (response.success) {
            UI.showMessage('Expense updated successfully!', 'success');
            closeEditExpenseModal();
            await loadExpensesData(); // Reload data
        } else {
            throw new Error(response.message || 'Failed to update expense');
        }
        
    } catch (error) {
        console.error('Error updating expense:', error);
        UI.showMessage(`Error updating expense: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function validateExpenseData(data) {
    if (!data.date) {
        UI.showMessage('Please select a date', 'error');
        return false;
    }
    
    if (!data.amount || data.amount <= 0) {
        UI.showMessage('Please enter a valid amount', 'error');
        return false;
    }
    
    if (!data.category) {
        UI.showMessage('Please select a category', 'error');
        return false;
    }
    
    const selectedDate = new Date(data.date);
    const today = new Date();
    
    if (selectedDate > today) {
        UI.showMessage('Date cannot be in the future', 'error');
        return false;
    }
    
    return true;
}

async function editExpense(expenseId) {
    try {
        showLoading();
        
        const response = await API.get(`/expenses/${expenseId}`);
        
        if (response.success) {
            const expense = response.expense;
            currentExpenseId = expenseId;
            
            // Populate edit form
            document.getElementById('editExpenseId').value = expenseId;
            document.getElementById('editExpenseDate').value = expense.expense_date;
            document.getElementById('editExpenseAmount').value = expense.amount;
            document.getElementById('editExpenseCategory').value = expense.category;
            document.getElementById('editExpenseNotes').value = expense.notes || '';
            
            // Show edit modal
            openEditExpenseModal();
            
        } else {
            throw new Error(response.message || 'Failed to load expense');
        }
        
    } catch (error) {
        console.error('Error loading expense:', error);
        UI.showMessage(`Error loading expense: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteExpense(expenseId) {
    const confirmed = await UI.confirm(
        'Are you sure you want to delete this expense? This action cannot be undone.',
        'Delete Expense'
    );
    
    if (!confirmed) return;
    
    try {
        showLoading();
        
        const response = await API.delete(`/expenses/${expenseId}`);
        
        if (response.success) {
            UI.showMessage('Expense deleted successfully!', 'success');
            await loadExpensesData(); // Reload data
        } else {
            throw new Error(response.message || 'Failed to delete expense');
        }
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        UI.showMessage(`Error deleting expense: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Modal functions
function openExpenseModal() {
    document.getElementById('expenseModal').classList.add('active');
    document.getElementById('expenseDate').focus();
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
    resetExpenseForm();
}

function openEditExpenseModal() {
    document.getElementById('editExpenseModal').classList.add('active');
}

function closeEditExpenseModal() {
    document.getElementById('editExpenseModal').classList.remove('active');
    currentExpenseId = null;
}

function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    
    // Clear validation classes
    const inputs = document.querySelectorAll('#expenseForm .form-input');
    inputs.forEach(input => {
        input.classList.remove('error', 'success');
    });
}

// Chart functions
function toggleChartView() {
    if (categoryChart) {
        const newType = categoryChart.config.type === 'doughnut' ? 'bar' : 'doughnut';
        categoryChart.config.type = newType;
        categoryChart.update();
    }
}

async function updateTrendChart() {
    const period = document.getElementById('trendPeriod').value;
    
    try {
        const response = await API.get(`/expenses/trend?period=${period}`);
        
        if (response.success && trendChart) {
            trendChart.data.labels = response.data.map(item => item.month);
            trendChart.data.datasets[0].data = response.data.map(item => item.total);
            trendChart.update();
        }
        
    } catch (error) {
        console.error('Error updating trend chart:', error);
    }
}

// Export functions
async function exportExpenses() {
    try {
        showLoading();
        
        const response = await API.get('/expenses/export');
        
        if (response.success) {
            // Create download link
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            UI.showMessage('Expenses exported successfully!', 'success');
        } else {
            throw new Error(response.message || 'Failed to export expenses');
        }
        
    } catch (error) {
        console.error('Error exporting expenses:', error);
        UI.showMessage(`Error exporting expenses: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function viewAllExpenses() {
    // Navigate to detailed expenses page
    window.location.href = 'expenses-detail.html';
}

// Real-time updates
function setupRealTimeUpdates() {
    // Update data every 30 seconds
    setInterval(() => {
        loadExpensesData();
    }, 30000);
}

// Loading states
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N to add new expense
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openExpenseModal();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeExpenseModal();
        closeEditExpenseModal();
    }
});

// Performance monitoring
function logPerformance() {
    const loadTime = performance.now();
    console.log(`Expenses page loaded in ${loadTime.toFixed(2)}ms`);
}

// Initialize performance monitoring
window.addEventListener('load', logPerformance);