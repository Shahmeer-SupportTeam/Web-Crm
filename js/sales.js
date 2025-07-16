// Sales Page JavaScript

// Global variables
let cart = [];
let selectedProducts = new Set();

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sales page loaded');
    initializeSalesPage();
});

function initializeSalesPage() {
    // Add event listeners
    setupEventListeners();
    
    // Load initial data
    loadSalesData();
    
    // Add some sample data to cart
    addSampleCartItems();
}

function setupEventListeners() {
    // Product selection
    document.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', function() {
            const productName = this.querySelector('h5').textContent;
            const productPrice = parseFloat(this.querySelector('.product-price').textContent.replace('$', ''));
            selectProduct(this, productName, productPrice);
        });
    });
}

function selectProduct(element, productName, price) {
    // Toggle selection
    element.classList.toggle('selected');
    
    if (element.classList.contains('selected')) {
        selectedProducts.add(productName);
        addToCart(productName, price);
    } else {
        selectedProducts.delete(productName);
        removeFromCart(productName);
    }
    
    // Add animation effect
    element.style.transform = 'scale(1.05)';
    setTimeout(() => {
        element.style.transform = '';
    }, 200);
}

function addToCart(productName, price) {
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.quantity * existingItem.price;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1,
            total: price
        });
    }
    
    updateCartDisplay();
    updateCartTotal();
}

function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
    updateCartDisplay();
    updateCartTotal();
}

function changeQuantity(productId, change) {
    const item = cart.find(item => item.name.toLowerCase().includes(productId));
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        item.total = item.quantity * item.price;
        updateCartDisplay();
        updateCartTotal();
    }
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;
    
    cartContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-icon">
                    <i class="fas fa-${getProductIcon(item.name)}"></i>
                </div>
                <div class="cart-item-details">
                    <h6>${item.name}</h6>
                    <p>${getProductDescription(item.name)}</p>
                </div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="changeQuantity('${item.name.toLowerCase()}', -1)">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity('${item.name.toLowerCase()}', 1)">+</button>
            </div>
            <div class="cart-item-total">$${item.total.toFixed(2)}</div>
        `;
        cartContainer.appendChild(cartItem);
    });
}

function getProductIcon(productName) {
    const icons = {
        'Laptop': 'laptop',
        'Smartphone': 'mobile-alt',
        'Headphones': 'headphones',
        'Tablet': 'tablet-alt'
    };
    return icons[productName] || 'box';
}

function getProductDescription(productName) {
    const descriptions = {
        'Laptop': 'High-performance laptop',
        'Smartphone': 'Latest smartphone model',
        'Headphones': 'Wireless noise-canceling',
        'Tablet': '10-inch tablet device'
    };
    return descriptions[productName] || 'Product';
}

function updateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.085;
    const shipping = subtotal > 0 ? 25 : 0;
    const total = subtotal + tax + shipping;
    
    // Update the cart total display
    const cartTotal = document.querySelector('.cart-total');
    if (cartTotal) {
        cartTotal.innerHTML = `
            <div class="cart-total-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="cart-total-row">
                <span>Tax (8.5%):</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="cart-total-row">
                <span>Shipping:</span>
                <span>$${shipping.toFixed(2)}</span>
            </div>
            <div class="cart-total-row final">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
    }
}

function addSampleCartItems() {
    // Add some sample items to cart
    addToCart('Laptop', 999.99);
    addToCart('Smartphone', 599.99);
    addToCart('Smartphone', 599.99); // This will increase quantity
}

function processSale() {
    if (cart.length === 0) {
        showMessage('Please add items to cart before processing sale', 'warning');
        return;
    }
    
    // Show loading state
    const processBtn = document.querySelector('.btn-success');
    const originalText = processBtn.innerHTML;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    processBtn.disabled = true;
    
    // Simulate processing
    setTimeout(() => {
        // Reset button
        processBtn.innerHTML = originalText;
        processBtn.disabled = false;
        
        // Show success message
        showMessage('Sale completed successfully!', 'success');
        
        // Clear cart
        cart = [];
        selectedProducts.clear();
        updateCartDisplay();
        updateCartTotal();
        
        // Reset product selections
        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add to sales history
        addToSalesHistory();
        
    }, 2000);
}

function addToSalesHistory() {
    const salesTable = document.querySelector('.sales-table tbody');
    if (!salesTable) return;
    
    const newRow = document.createElement('tr');
    const orderId = '#ORD-' + String(Date.now()).slice(-6);
    const customerName = document.getElementById('customer-name')?.value || 'Walk-in Customer';
    const products = cart.map(item => item.name).join(', ');
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = total * 0.085;
    const shipping = 25;
    const finalTotal = total + tax + shipping;
    
    newRow.innerHTML = `
        <td>${orderId}</td>
        <td>${customerName}</td>
        <td>${products}</td>
        <td>$${finalTotal.toFixed(2)}</td>
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td><span class="sales-status completed">Completed</span></td>
    `;
    
    // Add animation
    newRow.style.opacity = '0';
    newRow.style.transform = 'translateY(-20px)';
    salesTable.insertBefore(newRow, salesTable.firstChild);
    
    // Animate in
    setTimeout(() => {
        newRow.style.transition = 'all 0.5s ease';
        newRow.style.opacity = '1';
        newRow.style.transform = 'translateY(0)';
    }, 100);
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
    const container = document.querySelector('.sales-container');
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

function loadSalesData() {
    // Simulate loading sales data
    console.log('Loading sales data...');
    
    // Update stats with animation
    const statCards = document.querySelectorAll('.sales-stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
}

function logout() {
    // Clear any stored data
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to table rows
    const tableRows = document.querySelectorAll('.sales-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.01)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add click effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});