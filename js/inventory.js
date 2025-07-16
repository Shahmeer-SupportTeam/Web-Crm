/**
 * Professional Inventory Management System
 * Advanced inventory tracking with analytics, charts, and real-time updates
 */

class InventoryManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.filters = {
            search: '',
            category: '',
            stockLevel: ''
        };
        
        this.charts = {
            stock: null,
            movement: null
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInventory();
        this.setupKeyboardShortcuts();
    }
    
    setupEventListeners() {
        // Product form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        // Stock adjustment form
        document.getElementById('stockForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adjustStock();
        });
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.filterProducts();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.filterProducts();
        });
        
        document.getElementById('stockFilter').addEventListener('change', (e) => {
            this.filters.stockLevel = e.target.value;
            this.filterProducts();
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
        
        // File import preview
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.previewImportFile(e.target.files[0]);
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New product
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openProductModal();
            }
            
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    async loadInventory() {
        try {
            this.showLoading();
            
            const response = await fetch('php/inventory_api.php', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load inventory');
            }
            
            this.products = await response.json();
            this.filteredProducts = [...this.products];
            
            this.updateStats();
            this.renderTable();
            this.renderCharts();
            this.updateProductCount();
            
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showMessage('Failed to load inventory data', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    updateStats() {
        const totalProducts = this.products.length;
        const lowStockCount = this.products.filter(p => p.current_stock <= p.alert_threshold).length;
        const totalValue = this.products.reduce((sum, p) => sum + (p.purchase_price * p.current_stock), 0);
        const avgStock = this.products.length > 0 ? 
            Math.round(this.products.reduce((sum, p) => sum + p.current_stock, 0) / this.products.length) : 0;
        
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('low-stock-count').textContent = lowStockCount;
        document.getElementById('total-value').textContent = `PKR ${totalValue.toLocaleString()}`;
        document.getElementById('avg-stock').textContent = avgStock;
        
        // Update change indicators (simplified - in real app would compare with previous data)
        document.getElementById('products-change').textContent = '+0%';
        document.getElementById('low-stock-change').textContent = lowStockCount > 0 ? `+${lowStockCount}` : '0';
        document.getElementById('value-change').textContent = '+0%';
    }
    
    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = !this.filters.search || 
                product.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(this.filters.search.toLowerCase()));
            
            const matchesCategory = !this.filters.category || 
                product.category === this.filters.category;
            
            let matchesStockLevel = true;
            if (this.filters.stockLevel === 'low') {
                matchesStockLevel = product.current_stock <= product.alert_threshold;
            } else if (this.filters.stockLevel === 'out') {
                matchesStockLevel = product.current_stock === 0;
            } else if (this.filters.stockLevel === 'normal') {
                matchesStockLevel = product.current_stock > product.alert_threshold;
            }
            
            return matchesSearch && matchesCategory && matchesStockLevel;
        });
        
        this.currentPage = 1;
        this.renderTable();
        this.updateProductCount();
    }
    
    renderTable() {
        const tbody = document.getElementById('inventoryTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);
        
        tbody.innerHTML = '';
        
        if (pageProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No products found</h3>
                        <p>Try adjusting your search or filters</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        pageProducts.forEach(product => {
            const row = this.createProductRow(product);
            tbody.appendChild(row);
        });
        
        this.renderPagination();
    }
    
    createProductRow(product) {
        const row = document.createElement('tr');
        
        const stockLevel = this.getStockLevel(product);
        const statusClass = this.getStatusClass(product);
        const categoryTag = this.getCategoryTag(product.category);
        
        row.innerHTML = `
            <td>
                <div class="product-info-cell">
                    <div class="product-name">${product.name}</div>
                    ${product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
                </div>
            </td>
            <td>${categoryTag}</td>
            <td>
                <span class="stock-level ${stockLevel}">
                    ${product.current_stock}
                    <i class="fas fa-box"></i>
                </span>
            </td>
            <td>${product.purchase_price ? `PKR ${product.purchase_price.toFixed(2)}` : 'N/A'}</td>
            <td>${product.purchase_price ? `PKR ${(product.purchase_price * product.current_stock).toFixed(2)}` : 'N/A'}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas ${this.getStatusIcon(product)}"></i>
                    ${this.getStatusText(product)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="inventoryManager.editProduct(${product.product_id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn-action btn-stock" onclick="inventoryManager.openStockModal(${product.product_id})">
                        <i class="fas fa-edit"></i>
                        Stock
                    </button>
                    <button class="btn-action btn-delete" onclick="inventoryManager.deleteProduct(${product.product_id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }
    
    getStockLevel(product) {
        if (product.current_stock === 0) return 'critical';
        if (product.current_stock <= product.alert_threshold) return 'low';
        return 'normal';
    }
    
    getStatusClass(product) {
        if (product.current_stock === 0) return 'status-out-of-stock';
        if (product.current_stock <= product.alert_threshold) return 'status-low-stock';
        return 'status-in-stock';
    }
    
    getStatusIcon(product) {
        if (product.current_stock === 0) return 'fa-times-circle';
        if (product.current_stock <= product.alert_threshold) return 'fa-exclamation-triangle';
        return 'fa-check-circle';
    }
    
    getStatusText(product) {
        if (product.current_stock === 0) return 'Out of Stock';
        if (product.current_stock <= product.alert_threshold) return 'Low Stock';
        return 'In Stock';
    }
    
    getCategoryTag(category) {
        if (!category) return '';
        return `<span class="category-tag category-${category}">${category}</span>`;
    }
    
    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button onclick="inventoryManager.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button onclick="inventoryManager.goToPage(${i})" 
                            class="${i === this.currentPage ? 'active' : ''}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        // Next button
        paginationHTML += `
            <button onclick="inventoryManager.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        pagination.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
        }
    }
    
    updateProductCount() {
        const count = this.filteredProducts.length;
        document.getElementById('product-count').textContent = `${count} product${count !== 1 ? 's' : ''}`;
    }
    
    renderCharts() {
        this.renderStockChart();
        this.renderMovementChart();
    }
    
    renderStockChart() {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        if (this.charts.stock) {
            this.charts.stock.destroy();
        }
        
        const categories = {};
        this.products.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = { count: 0, value: 0 };
            }
            categories[category].count++;
            categories[category].value += (product.purchase_price || 0) * product.current_stock;
        });
        
        const labels = Object.keys(categories);
        const data = labels.map(cat => categories[cat].count);
        const values = labels.map(cat => categories[cat].value);
        
        this.charts.stock = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
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
                                const totalValue = values[context.dataIndex];
                                return `${label}: ${value} items (PKR ${totalValue.toLocaleString()})`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderMovementChart() {
        const ctx = document.getElementById('movementChart').getContext('2d');
        
        if (this.charts.movement) {
            this.charts.movement.destroy();
        }
        
        // Generate sample movement data (in real app, this would come from database)
        const days = 7;
        const labels = [];
        const stockData = [];
        const salesData = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Simulate data
            stockData.push(Math.floor(Math.random() * 100) + 50);
            salesData.push(Math.floor(Math.random() * 20) + 5);
        }
        
        this.charts.movement = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stock Level',
                    data: stockData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Sales',
                    data: salesData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Modal Management
    openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.querySelector('#productModal .modal-title');
        const form = document.getElementById('productForm');
        
        if (productId) {
            const product = this.products.find(p => p.product_id == productId);
            if (product) {
                this.populateProductForm(product);
                title.innerHTML = '<i class="fas fa-edit"></i> Edit Product';
            }
        } else {
            form.reset();
            document.getElementById('productId').value = '';
            title.innerHTML = '<i class="fas fa-plus"></i> Add New Product';
        }
        
        modal.classList.add('show');
    }
    
    closeProductModal() {
        document.getElementById('productModal').classList.remove('show');
    }
    
    openStockModal(productId) {
        const product = this.products.find(p => p.product_id == productId);
        if (!product) return;
        
        document.getElementById('stockProductId').value = product.product_id;
        document.getElementById('stockProductName').textContent = product.name;
        document.getElementById('stockCurrentStock').textContent = product.current_stock;
        
        document.getElementById('stockModal').classList.add('show');
    }
    
    closeStockModal() {
        document.getElementById('stockModal').classList.remove('show');
    }
    
    openBulkImportModal() {
        document.getElementById('bulkImportModal').classList.add('show');
    }
    
    closeBulkImportModal() {
        document.getElementById('bulkImportModal').classList.remove('show');
        document.getElementById('importFile').value = '';
        document.getElementById('importPreview').innerHTML = '';
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    populateProductForm(product) {
        document.getElementById('productId').value = product.product_id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productSKU').value = product.sku || '';
        document.getElementById('productBrand').value = product.brand || '';
        document.getElementById('currentStock').value = product.current_stock;
        document.getElementById('alertThreshold').value = product.alert_threshold;
        document.getElementById('purchasePrice').value = product.purchase_price || '';
        document.getElementById('sellingPrice').value = product.selling_price || '';
        document.getElementById('productDescription').value = product.description || '';
    }
    
    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
    
    const productData = {
            name: formData.get('productName') || document.getElementById('productName').value,
            category: formData.get('productCategory') || document.getElementById('productCategory').value,
            sku: formData.get('productSKU') || document.getElementById('productSKU').value,
            brand: formData.get('productBrand') || document.getElementById('productBrand').value,
            current_stock: parseInt(formData.get('currentStock') || document.getElementById('currentStock').value),
            alert_threshold: parseInt(formData.get('alertThreshold') || document.getElementById('alertThreshold').value),
            purchase_price: parseFloat(formData.get('purchasePrice') || document.getElementById('purchasePrice').value) || null,
            selling_price: parseFloat(formData.get('sellingPrice') || document.getElementById('sellingPrice').value) || null,
            description: formData.get('productDescription') || document.getElementById('productDescription').value,
            product_id: document.getElementById('productId').value || null
    };
    
    try {
            this.showLoading();
            
      const url = 'php/inventory_api.php';
      const method = productData.product_id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(productData)
      });
      
      const result = await response.json();
      
      if (result.success) {
                this.showMessage('Product saved successfully', 'success');
                this.closeProductModal();
                this.loadInventory();
      } else {
        throw new Error(result.message || 'Failed to save product');
      }
    } catch (error) {
            console.error('Error saving product:', error);
            this.showMessage('Error saving product: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async adjustStock() {
        const form = document.getElementById('stockForm');
        const formData = new FormData(form);
        
        const stockData = {
            product_id: document.getElementById('stockProductId').value,
            adjustment_type: document.getElementById('adjustmentType').value,
            quantity: parseInt(document.getElementById('adjustmentQuantity').value),
            reason: document.getElementById('adjustmentReason').value,
            notes: document.getElementById('adjustmentNotes').value
        };
        
        try {
            this.showLoading();
            
    const response = await fetch('php/inventory_api.php', {
                method: 'POST',
      headers: {
                    'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    action: 'adjust_stock',
                    ...stockData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Stock adjusted successfully', 'success');
                this.closeStockModal();
                this.loadInventory();
            } else {
                throw new Error(result.message || 'Failed to adjust stock');
            }
  } catch (error) {
            console.error('Error adjusting stock:', error);
            this.showMessage('Error adjusting stock: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }
        
        try {
            this.showLoading();
            
    const response = await fetch('php/inventory_api.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ product_id: productId })
    });
    
    const result = await response.json();
    
    if (result.success) {
                this.showMessage('Product deleted successfully', 'success');
                this.loadInventory();
    } else {
      throw new Error(result.message || 'Failed to delete product');
    }
  } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage('Error deleting product: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async exportInventory() {
        try {
            this.showLoading();
            
            const response = await fetch('php/inventory_api.php?action=export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to export inventory');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showMessage('Inventory exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting inventory:', error);
            this.showMessage('Error exporting inventory: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    previewImportFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            let previewHTML = '<table class="table"><thead><tr>';
            headers.forEach(header => {
                previewHTML += `<th>${header.trim()}</th>`;
            });
            previewHTML += '</tr></thead><tbody>';
            
            for (let i = 1; i < Math.min(lines.length, 6); i++) {
                if (lines[i].trim()) {
                    previewHTML += '<tr>';
                    lines[i].split(',').forEach(cell => {
                        previewHTML += `<td>${cell.trim()}</td>`;
                    });
                    previewHTML += '</tr>';
                }
            }
            
            previewHTML += '</tbody></table>';
            document.getElementById('importPreview').innerHTML = previewHTML;
        };
        
        reader.readAsText(file);
    }
    
    async processBulkImport() {
        const file = document.getElementById('importFile').files[0];
        if (!file) {
            this.showMessage('Please select a file to import', 'warning');
            return;
        }
        
        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('php/inventory_api.php?action=bulk_import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage(`Successfully imported ${result.imported_count} products`, 'success');
                this.closeBulkImportModal();
                this.loadInventory();
            } else {
                throw new Error(result.message || 'Failed to import products');
            }
        } catch (error) {
            console.error('Error importing products:', error);
            this.showMessage('Error importing products: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Utility Methods
    showLoading() {
        document.body.classList.add('loading');
    }
    
    hideLoading() {
        document.body.classList.remove('loading');
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas ${this.getMessageIcon(type)}"></i>
            ${message}
        `;
        
        document.querySelector('.inventory-container').insertBefore(messageDiv, document.querySelector('.stats-grid'));
        
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
    
    refreshInventory() {
        this.loadInventory();
    }
    
    clearFilters() {
        this.filters = { search: '', category: '', stockLevel: '' };
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = '';
        this.filterProducts();
    }
}

// Global functions for HTML onclick handlers
let inventoryManager;

document.addEventListener('DOMContentLoaded', () => {
    inventoryManager = new InventoryManager();
});

// Global functions for HTML onclick handlers
function openProductModal() {
    inventoryManager.openProductModal();
}

function closeProductModal() {
    inventoryManager.closeProductModal();
}

function openBulkImportModal() {
    inventoryManager.openBulkImportModal();
}

function closeBulkImportModal() {
    inventoryManager.closeBulkImportModal();
}

function exportInventory() {
    inventoryManager.exportInventory();
}

function refreshInventory() {
    inventoryManager.refreshInventory();
}

function clearFilters() {
    inventoryManager.clearFilters();
}

function filterProducts() {
    inventoryManager.filterProducts();
}

function sortTable(field) {
    inventoryManager.sortField = field;
    inventoryManager.sortDirection = inventoryManager.sortDirection === 'asc' ? 'desc' : 'asc';
    inventoryManager.filterProducts();
}

function toggleStockChart() {
    // Toggle between pie and bar chart
    if (inventoryManager.charts.stock) {
        const chart = inventoryManager.charts.stock;
        const newType = chart.config.type === 'pie' ? 'bar' : 'pie';
        chart.config.type = newType;
        chart.update();
    }
}

function updateMovementChart() {
    // Update movement chart with new period
    inventoryManager.renderMovementChart();
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}