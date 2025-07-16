<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

try {
    // Test if customers table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'customers'");
    $customersTable = $stmt->fetch();
    
    if (!$customersTable) {
        throw new Exception('Customers table does not exist');
    }
    
    // Test if suppliers table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'suppliers'");
    $suppliersTable = $stmt->fetch();
    
    if (!$suppliersTable) {
        throw new Exception('Suppliers table does not exist');
    }
    
    // Test if activity_log table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'activity_log'");
    $activityLogTable = $stmt->fetch();
    
    if (!$activityLogTable) {
        throw new Exception('Activity log table does not exist');
    }
    
    // Count customers
    $stmt = $pdo->query("SELECT COUNT(*) FROM customers");
    $customerCount = $stmt->fetchColumn();
    
    // Count suppliers
    $stmt = $pdo->query("SELECT COUNT(*) FROM suppliers");
    $supplierCount = $stmt->fetchColumn();
    
    // Check if customer_id column exists in detailed_sales
    $stmt = $pdo->query("SHOW COLUMNS FROM detailed_sales LIKE 'customer_id'");
    $customerIdColumn = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'All customer management tables created successfully',
        'tables' => [
            'customers' => $customersTable ? 'exists' : 'missing',
            'suppliers' => $suppliersTable ? 'exists' : 'missing',
            'activity_log' => $activityLogTable ? 'exists' : 'missing'
        ],
        'data' => [
            'customers_count' => $customerCount,
            'suppliers_count' => $supplierCount,
            'customer_id_column' => $customerIdColumn ? 'exists' : 'missing'
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 