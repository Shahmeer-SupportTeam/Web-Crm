// Customer Management JavaScript

let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let editingCustomerId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    
    // Add event listeners
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCustomers();
        }
    });
});

// Load customers with pagination
async function loadCustomers(page = 1, search = '') {
    try {
        showLoading();
        
        const response = await fetch('php/customers_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_customers',
                page: page,
                search: search
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCustomers(data.customers);
            setupPagination(data.page, data.total_pages);
            currentPage = data.page;
            totalPages = data.total_pages;
            currentSearch = search;
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Failed to load customers: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display customers in the table
function displayCustomers(customers) {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    <p>No customers found</p>
                    <button class="btn btn-primary" onclick="showAddCustomerModal()">
                        <i class="fas fa-plus"></i> Add Your First Customer
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="customer-name" onclick="viewCustomer(${customer.customer_id})">
                    ${escapeHtml(customer.name)}
                </span>
            </td>
            <td class="customer-phone">${escapeHtml(customer.phone || '-')}</td>
            <td>
                ${customer.email ? `<a href="mailto:${customer.email}" class="customer-email">${escapeHtml(customer.email)}</a>` : '-'}
            </td>
            <td class="customer-address" title="${escapeHtml(customer.address || '')}">
                ${escapeHtml(customer.address || '-')}
            </td>
            <td class="purchase-info">
                <span class="purchase-count">0</span>
                <div class="last-purchase">No purchases yet</div>
            </td>
            <td class="purchase-info">
                <span class="last-purchase">-</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-view" onclick="viewCustomer(${customer.customer_id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-small btn-edit" onclick="editCustomer(${customer.customer_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteCustomer(${customer.customer_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Setup pagination
function setupPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadCustomers(currentPage - 1, currentSearch);
    pagination.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.onclick = () => loadCustomers(i, currentSearch);
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadCustomers(currentPage + 1, currentSearch);
    pagination.appendChild(nextBtn);
}

// Search customers
function searchCustomers() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    loadCustomers(1, searchTerm);
}

// Show add customer modal
function showAddCustomerModal() {
    editingCustomerId = null;
    document.getElementById('modalTitle').textContent = 'Add New Customer';
    document.getElementById('customerForm').reset();
    document.getElementById('customerModal').style.display = 'block';
}

// Show edit customer modal
async function editCustomer(customerId) {
    try {
        const response = await fetch('php/customers_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_customer',
                customer_id: customerId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            editingCustomerId = customerId;
            document.getElementById('modalTitle').textContent = 'Edit Customer';
            
            // Fill form with customer data
            document.getElementById('customerName').value = data.customer.name;
            document.getElementById('customerPhone').value = data.customer.phone || '';
            document.getElementById('customerEmail').value = data.customer.email || '';
            document.getElementById('customerAddress').value = data.customer.address || '';
            document.getElementById('customerNotes').value = data.customer.notes || '';
            
            document.getElementById('customerModal').style.display = 'block';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Failed to load customer data: ' + error.message, 'error');
    }
}

// Save customer (add or update)
async function saveCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customerData = {
        action: editingCustomerId ? 'update_customer' : 'add_customer',
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        notes: formData.get('notes')
    };
    
    if (editingCustomerId) {
        customerData.customer_id = editingCustomerId;
    }
    
    try {
        showLoading();
        
        const response = await fetch('php/customers_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            closeCustomerModal();
            loadCustomers(currentPage, currentSearch);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Failed to save customer: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// View customer details
async function viewCustomer(customerId) {
    try {
        const response = await fetch('php/customers_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_customer',
                customer_id: customerId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCustomerDetails(data.customer, data.purchase_history);
            document.getElementById('customerDetailsModal').style.display = 'block';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Failed to load customer details: ' + error.message, 'error');
    }
}

// Display customer details
function displayCustomerDetails(customer, purchaseHistory) {
    document.getElementById('customerDetailsTitle').textContent = `Customer Details - ${customer.name}`;
    
    const content = document.getElementById('customerDetailsContent');
    content.innerHTML = `
        <div class="customer-details">
            <div class="customer-info">
                <div>
                    <h3>Contact Information</h3>
                    <div class="info-item">
                        <div class="info-label">Name</div>
                        <div class="info-value">${escapeHtml(customer.name)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${escapeHtml(customer.phone || 'Not provided')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">
                            ${customer.email ? `<a href="mailto:${customer.email}">${escapeHtml(customer.email)}</a>` : 'Not provided'}
                        </div>
                    </div>
                </div>
                <div>
                    <h3>Additional Information</h3>
                    <div class="info-item">
                        <div class="info-label">Address</div>
                        <div class="info-value">${escapeHtml(customer.address || 'Not provided')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Notes</div>
                        <div class="info-value">${escapeHtml(customer.notes || 'No notes')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Customer Since</div>
                        <div class="info-value">${formatDate(customer.created_at)}</div>
                    </div>
                </div>
            </div>
            
            <div class="purchase-history">
                <h3>Purchase History (${purchaseHistory.length} purchases)</h3>
                ${purchaseHistory.length > 0 ? `
                    <table class="purchase-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${purchaseHistory.map(purchase => `
                                <tr>
                                    <td>${formatDate(purchase.sale_date)}</td>
                                    <td>${escapeHtml(purchase.product_name || 'Unknown Product')}</td>
                                    <td>${purchase.quantity}</td>
                                    <td>Rs. ${parseFloat(purchase.sale_price).toFixed(2)}</td>
                                    <td>Rs. ${(parseFloat(purchase.sale_price) * purchase.quantity).toFixed(2)}</td>
                                    <td>${escapeHtml(purchase.notes || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No purchase history available.</p>'}
            </div>
        </div>
    `;
}

// Delete customer
async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('php/customers_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete_customer',
                customer_id: customerId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            loadCustomers(currentPage, currentSearch);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Failed to delete customer: ' + error.message, 'error');
    }
}

// Close customer modal
function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
    editingCustomerId = null;
}

// Close customer details modal
function closeCustomerDetailsModal() {
    document.getElementById('customerDetailsModal').style.display = 'none';
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('php/secure_auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'logout'
            })
        }).then(() => {
            window.location.href = 'login.html';
        }).catch(() => {
            window.location.href = 'login.html';
        });
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const customerModal = document.getElementById('customerModal');
    const customerDetailsModal = document.getElementById('customerDetailsModal');
    
    if (event.target === customerModal) {
        closeCustomerModal();
    }
    if (event.target === customerDetailsModal) {
        closeCustomerDetailsModal();
    }
} 