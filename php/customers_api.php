<?php
require_once 'session_manager.php';
require_once 'db_connect.php';

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Content-Type: application/json');

// Require authentication
requireAuth();

$user = getCurrentUser();
$userId = $user['user_id'];

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }
    
    $action = sanitizeInput($input['action'] ?? '');
    
    switch ($action) {
        case 'add_customer':
            $name = sanitizeInput($input['name'] ?? '');
            $phone = sanitizeInput($input['phone'] ?? '');
            $email = sanitizeInput($input['email'] ?? '');
            $address = sanitizeInput($input['address'] ?? '');
            $notes = sanitizeInput($input['notes'] ?? '');
            
            if (empty($name)) {
                throw new Exception('Customer name is required');
            }
            
            if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            $stmt = $pdo->prepare("INSERT INTO customers (user_id, name, phone, email, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $success = $stmt->execute([$userId, $name, $phone, $email, $address, $notes]);
            
            if (!$success) {
                throw new Exception('Failed to add customer');
            }
            
            logActivity('add_customer', "Added customer: $name");
            
            echo json_encode([
                'success' => true,
                'message' => 'Customer added successfully',
                'customer_id' => $pdo->lastInsertId()
            ]);
            break;
            
        case 'get_customers':
            $search = sanitizeInput($input['search'] ?? '');
            $page = max(1, intval($input['page'] ?? 1));
            $limit = 20;
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE user_id = ?";
            $params = [$userId];
            
            if (!empty($search)) {
                $whereClause .= " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
                $searchTerm = "%$search%";
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
            }
            
            // Get total count
            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM customers $whereClause");
            $countStmt->execute($params);
            $totalCustomers = $countStmt->fetchColumn();
            
            // Get customers
            $stmt = $pdo->prepare("SELECT * FROM customers $whereClause ORDER BY name LIMIT ? OFFSET ?");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $customers = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'customers' => $customers,
                'total' => $totalCustomers,
                'page' => $page,
                'total_pages' => ceil($totalCustomers / $limit)
            ]);
            break;
            
        case 'get_customer':
            $customerId = intval($input['customer_id'] ?? 0);
            
            if ($customerId <= 0) {
                throw new Exception('Invalid customer ID');
            }
            
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE customer_id = ? AND user_id = ?");
            $stmt->execute([$customerId, $userId]);
            $customer = $stmt->fetch();
            
            if (!$customer) {
                throw new Exception('Customer not found');
            }
            
            // Get customer's purchase history
            $stmt = $pdo->prepare("
                SELECT s.*, p.name as product_name 
                FROM detailed_sales s 
                LEFT JOIN products p ON s.product_id = p.product_id 
                WHERE s.customer_id = ? AND s.user_id = ?
                ORDER BY s.sale_date DESC
            ");
            $stmt->execute([$customerId, $userId]);
            $purchaseHistory = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'customer' => $customer,
                'purchase_history' => $purchaseHistory
            ]);
            break;
            
        case 'update_customer':
            $customerId = intval($input['customer_id'] ?? 0);
            $name = sanitizeInput($input['name'] ?? '');
            $phone = sanitizeInput($input['phone'] ?? '');
            $email = sanitizeInput($input['email'] ?? '');
            $address = sanitizeInput($input['address'] ?? '');
            $notes = sanitizeInput($input['notes'] ?? '');
            
            if ($customerId <= 0) {
                throw new Exception('Invalid customer ID');
            }
            
            if (empty($name)) {
                throw new Exception('Customer name is required');
            }
            
            if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, notes = ? WHERE customer_id = ? AND user_id = ?");
            $success = $stmt->execute([$name, $phone, $email, $address, $notes, $customerId, $userId]);
            
            if (!$success) {
                throw new Exception('Failed to update customer');
            }
            
            logActivity('update_customer', "Updated customer: $name");
            
            echo json_encode([
                'success' => true,
                'message' => 'Customer updated successfully'
            ]);
            break;
            
        case 'delete_customer':
            $customerId = intval($input['customer_id'] ?? 0);
            
            if ($customerId <= 0) {
                throw new Exception('Invalid customer ID');
            }
            
            // Check if customer has any sales records
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM detailed_sales WHERE customer_id = ? AND user_id = ?");
            $stmt->execute([$customerId, $userId]);
            $hasSales = $stmt->fetchColumn() > 0;
            
            if ($hasSales) {
                throw new Exception('Cannot delete customer with sales history. Consider archiving instead.');
            }
            
            $stmt = $pdo->prepare("DELETE FROM customers WHERE customer_id = ? AND user_id = ?");
            $success = $stmt->execute([$customerId, $userId]);
            
            if (!$success) {
                throw new Exception('Failed to delete customer');
            }
            
            logActivity('delete_customer', "Deleted customer ID: $customerId");
            
            echo json_encode([
                'success' => true,
                'message' => 'Customer deleted successfully'
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 